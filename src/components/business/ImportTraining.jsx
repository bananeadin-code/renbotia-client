import { useEffect, useState } from 'react';
import { importApi } from '../../api/endpoints.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { readChatFile, parseChat, guessBusiness, anonymize } from '../../lib/whatsappChat.js';

/**
 * "Entrénalo con lo que ya tienes": el bot aprende de los chats exportados de
 * WhatsApp, del sitio web o de un texto (menú, precios). La IA propone preguntas
 * frecuentes y datos del negocio; el dueño elige qué aplicar. No guarda nada por
 * sí mismo: `onApply` lo mete en el formulario y se guarda como siempre.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(sel: {faqs:Array, services:string[], hours?:string, location?:string, basePricing?:string, summary?:string, tone?:string}) => void} props.onApply
 * @param {{ tone?: boolean, extraContext?: boolean }} [props.allow]  qué campos permite el plan
 */
const SOURCES = [
  { key: 'chat', icon: 'whatsapp', title: 'Mis chats de WhatsApp', desc: 'Aprende cómo contestas de verdad.' },
  { key: 'site', icon: 'globe', title: 'Mi sitio web', desc: 'Lee tus servicios, precios y horarios.' },
  { key: 'text', icon: 'clipboard', title: 'Pegar texto', desc: 'Tu menú, lista de precios o políticas.' },
];
const STEPS = ['Leyendo tu información…', 'Encontrando las preguntas que más te hacen…', 'Redactando respuestas con tu estilo…'];
const TONE_LABEL = { formal: 'Formal', cercano: 'Cercano', neutral: 'Neutral', tecnico: 'Técnico' };

export function ImportTraining({ open, onClose, onApply, allow = {}, faqRoom = null }) {
  const [source, setSource] = useState('');
  const [chats, setChats] = useState([]); // [{ file, messages, participants }]
  const [business, setBusiness] = useState([]); // nombres que son el negocio
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [pick, setPick] = useState({});

  useEffect(() => {
    if (!open) {
      setSource('');
      setChats([]);
      setBusiness([]);
      setUrl('');
      setText('');
      setError('');
      setResult(null);
      setPick({});
    }
  }, [open]);

  useEffect(() => {
    if (!loading) return undefined;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(id);
  }, [loading]);

  async function onFiles(e) {
    setError('');
    const files = [...(e.target.files || [])].slice(0, 10);
    e.target.value = '';
    const parsed = [];
    for (const file of files) {
      try {
        const c = parseChat(await readChatFile(file));
        if (c.messages.length) parsed.push({ file: file.name, ...c });
      } catch (err) {
        setError(err.message);
      }
    }
    if (!parsed.length) {
      setError((prev) => prev || 'No encontramos mensajes. Exporta el chat desde WhatsApp: ⋮ → Más → Exportar chat → Sin archivos.');
      return;
    }
    const all = [...chats, ...parsed];
    setChats(all);
    const guess = guessBusiness(all);
    setBusiness(guess ? [guess] : []);
  }

  const participants = [...new Set(chats.flatMap((c) => c.participants.map((p) => p.name)))];
  const totalMsgs = chats.reduce((n, c) => n + c.messages.length, 0);

  async function analyze() {
    setError('');
    let body;
    if (source === 'chat') {
      if (!chats.length) return setError('Sube al menos un chat exportado.');
      if (!business.length) return setError('Marca quién eres tú (o tu equipo) en los chats.');
      body = { source: 'chat', text: anonymize(chats, business) };
    } else if (source === 'site') {
      if (!url.trim()) return setError('Pega el enlace de tu sitio.');
      body = { source: 'site', url: url.trim() };
    } else {
      if (text.trim().length < 40) return setError('Pega un poco más de información (al menos un par de líneas).');
      body = { source: 'text', text: text.trim() };
    }
    setLoading(true);
    try {
      const r = await importApi.analyze(body);
      setResult(r);
      setPick({
        // Solo se preseleccionan las que caben en el plan (faqRoom = lugares libres).
        faqs: r.faqs.map((_, i) => faqRoom == null || i < faqRoom),
        services: r.services.length > 0,
        hours: Boolean(r.hours),
        location: Boolean(r.location),
        basePricing: Boolean(r.basePricing),
        summary: Boolean(r.summary) && allow.extraContext,
        tone: Boolean(r.tone) && allow.tone,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos analizarlo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    const r = result;
    onApply({
      faqs: r.faqs.filter((_, i) => pick.faqs?.[i]),
      services: pick.services ? r.services : [],
      hours: pick.hours ? r.hours : undefined,
      location: pick.location ? r.location : undefined,
      basePricing: pick.basePricing ? r.basePricing : undefined,
      summary: pick.summary ? r.summary : undefined,
      tone: pick.tone ? r.tone : undefined,
    });
    onClose();
  }

  const Check = ({ checked, onChange, disabled, children }) => (
    <label
      className={`flex items-start gap-2.5 rounded-lg p-2 transition ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-surface2/60'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
      />
      <span className="min-w-0 text-sm">{children}</span>
    </label>
  );

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title="Entrénalo con lo que ya tienes" size="lg">
      <div className="max-h-[65vh] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Icon name="spinner" size={26} className="animate-spin text-brand-600" />
            <p className="text-sm font-medium text-fg">{STEPS[step]}</p>
            <p className="text-xs text-subtle">Tarda de 10 a 30 segundos.</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">Esto aprendimos. Elige qué aplicar; después revisa y pulsa Guardar.</p>
            {result.faqs.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtle">Preguntas frecuentes</p>
                {faqRoom != null && faqRoom < result.faqs.length && (
                  <p className="mb-1 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                    {faqRoom === 0
                      ? 'Ya usaste todas las preguntas frecuentes de tu plan. Mejóralo para agregar más.'
                      : `Tu plan guarda ${faqRoom} ${faqRoom === 1 ? 'pregunta más' : 'preguntas más'}: elige las más importantes.`}
                  </p>
                )}
                {result.faqs.map((f, i) => (
                  <Check
                    key={i}
                    checked={Boolean(pick.faqs?.[i])}
                    disabled={
                      !pick.faqs?.[i] && faqRoom != null && (pick.faqs || []).filter(Boolean).length >= faqRoom
                    }
                    onChange={(v) => setPick((p) => ({ ...p, faqs: p.faqs.map((x, j) => (j === i ? v : x)) }))}
                  >
                    <span className="block font-medium text-fg">{f.question}</span>
                    <span className="block text-muted">{f.answer}</span>
                  </Check>
                ))}
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtle">Datos del negocio</p>
              {result.services.length > 0 && (
                <Check checked={pick.services} onChange={(v) => setPick((p) => ({ ...p, services: v }))}>
                  <span className="font-medium text-fg">Servicios:</span> <span className="text-muted">{result.services.join(', ')}</span>
                </Check>
              )}
              {result.basePricing && (
                <Check checked={pick.basePricing} onChange={(v) => setPick((p) => ({ ...p, basePricing: v }))}>
                  <span className="font-medium text-fg">Precios:</span> <span className="text-muted">{result.basePricing}</span>
                </Check>
              )}
              {result.location && (
                <Check checked={pick.location} onChange={(v) => setPick((p) => ({ ...p, location: v }))}>
                  <span className="font-medium text-fg">Ubicación:</span> <span className="text-muted">{result.location}</span>
                </Check>
              )}
              {result.hours && (
                <Check checked={pick.hours} onChange={(v) => setPick((p) => ({ ...p, hours: v }))}>
                  <span className="font-medium text-fg">Horario:</span> <span className="text-muted">{result.hours}</span>
                </Check>
              )}
              {result.summary && allow.extraContext && (
                <Check checked={pick.summary} onChange={(v) => setPick((p) => ({ ...p, summary: v }))}>
                  <span className="font-medium text-fg">Descripción para el bot:</span>{' '}
                  <span className="text-muted">{result.summary}</span>
                </Check>
              )}
              {result.tone && allow.tone && (
                <Check checked={pick.tone} onChange={(v) => setPick((p) => ({ ...p, tone: v }))}>
                  <span className="font-medium text-fg">Tono:</span> <span className="text-muted">{TONE_LABEL[result.tone]}</span>
                </Check>
              )}
            </div>
          </div>
        ) : !source ? (
          <div className="space-y-2">
            <p className="mb-3 text-sm text-muted">
              En lugar de escribir todo, deja que el bot aprenda de lo que ya tienes. Tú eliges qué se queda.
            </p>
            {SOURCES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSource(s.key)}
                className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:border-brand-300 hover:bg-surface2/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                  <Icon name={s.icon} size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{s.title}</span>
                  <span className="block text-xs text-muted">{s.desc}</span>
                </span>
                <Icon name="chevronRight" size={16} className="text-subtle" />
              </button>
            ))}
          </div>
        ) : source === 'chat' ? (
          <div className="space-y-3">
            <ol className="list-decimal space-y-1 pl-5 text-xs text-muted">
              <li>En WhatsApp abre un chat con un cliente → menú ⋮ (o el nombre en iPhone) → Más → Exportar chat → Sin archivos.</li>
              <li>Repite con 3 a 10 chats donde respondas dudas típicas.</li>
              <li>Súbelos aquí (.txt o .zip). Se leen en tu navegador y quitamos nombres, teléfonos y correos de tus clientes.</li>
            </ol>
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-line px-4 py-6 text-center transition hover:border-brand-300">
              <Icon name="download" size={20} className="rotate-180 text-brand-600" />
              <span className="text-sm font-medium text-fg">{chats.length ? 'Agregar más chats' : 'Elegir chats exportados'}</span>
              <span className="text-xs text-subtle">.txt o .zip · hasta 10 a la vez</span>
              <input type="file" accept=".txt,.zip,text/plain,application/zip" multiple onChange={onFiles} className="sr-only" />
            </label>
            {chats.length > 0 && (
              <div className="rounded-xl border border-line p-3">
                <p className="text-xs text-muted">
                  {chats.length} {chats.length === 1 ? 'chat' : 'chats'} · {totalMsgs} mensajes
                </p>
                <p className="mt-2 text-sm font-medium text-fg">¿Quién eres tú (o tu equipo) en estos chats?</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {participants.map((name) => {
                    const on = business.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setBusiness((b) => (on ? b.filter((x) => x !== name) : [...b, name]))}
                        aria-pressed={on}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          on ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'border-line text-muted hover:text-fg'
                        }`}
                      >
                        {on && <Icon name="check" size={12} className="mr-1 inline" />}
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : source === 'site' ? (
          <div className="space-y-2">
            <label htmlFor="imp-url" className="text-sm font-medium text-fg">Enlace de tu sitio</label>
            <input
              id="imp-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="minegocio.com"
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-fg outline-none focus:border-brand-500"
            />
            <p className="text-xs text-subtle">Leemos la página principal. Si tu menú o precios están en otra página, pega ese enlace.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="imp-text" className="text-sm font-medium text-fg">Pega tu información</label>
            <textarea
              id="imp-text"
              rows={8}
              maxLength={20000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Menú, lista de precios, servicios, políticas de envío o de citas…"
              className="w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
            />
          </div>
        )}

        {error && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-red-600" role="alert">
            <Icon name="alert" size={15} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
      </div>

      {!loading && (source || result) && (
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (result) setResult(null);
              else setSource('');
              setError('');
            }}
          >
            Atrás
          </Button>
          {result ? (
            <Button onClick={apply} disabled={!Object.values(pick).some((v) => (Array.isArray(v) ? v.some(Boolean) : v))}>
              <Icon name="check" size={16} /> Aplicar al entrenamiento
            </Button>
          ) : (
            <Button onClick={analyze}>
              <Icon name="sparkles" size={16} /> Analizar
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
