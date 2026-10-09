import { useEffect, useState } from 'react';
import { PlanCta } from '../ui/PlanCta.jsx';
import { Link } from 'react-router-dom';
import { widgetApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Card, Button, Spinner, Select } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Tarjeta "Chat para tu sitio web" en Conexiones (Pro/Elite). El dueño lo activa,
 * elige color, posición y saludo, y copia el snippet para pegarlo en su sitio.
 * Las conversaciones llegan a la bandeja con la etiqueta "Sitio web".
 */

const SWATCHES = ['#4f46e5', '#059669', '#0866ff', '#e11d48', '#ea580c', '#0f172a'];
const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://renbotia.com';

export function WebWidgetCard({ isOwner, onStatus }) {
  const [w, setW] = useState(null);
  const [form, setForm] = useState({ color: '#4f46e5', position: 'right', greeting: '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Informa al selector de canales si el widget está activo.
  useEffect(() => {
    if (w && !w.error) onStatus?.(w);
  }, [w, onStatus]);

  useEffect(() => {
    widgetApi
      .get()
      .then((data) => {
        setW(data);
        setForm({ color: data.color, position: data.position, greeting: data.greeting });
      })
      .catch(() => setW({ error: true }));
  }, []);

  async function save(patch, okMsg = 'Widget actualizado.') {
    setSaving(true);
    try {
      const data = await widgetApi.update(patch);
      setW(data);
      setForm({ color: data.color, position: data.position, greeting: data.greeting });
      toast.success(okMsg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    const ok = await confirm({
      title: 'Generar código nuevo',
      message: 'El código que ya pegaste en tu sitio dejará de funcionar y tendrás que reemplazarlo. ¿Continuar?',
      tone: 'danger',
      confirmLabel: 'Generar nuevo',
    });
    if (ok) save({ regenerateKey: true }, 'Código nuevo generado. Reemplázalo en tu sitio.');
  }

  const snippet = w?.key ? `<script src="${SITE}/widget.js" data-key="${w.key}" async></script>` : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('No se pudo copiar. Selecciona el código y cópialo manualmente.');
    }
  }

  const dirty = w && (form.color !== w.color || form.position !== w.position || form.greeting !== w.greeting);

  return (
    <Card className={w?.enabled ? '' : w?.allowed ? 'border-brand-200 dark:border-brand-900/60' : ''}>
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
          <Icon name="globe" size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-fg">Chat para tu sitio web</h2>
            {w?.enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                <Icon name="check" size={13} /> Activo
              </span>
            )}
            {w && !w.error && !w.allowed && (
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600">Pro y Elite</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            Un botón de chat en tu página para que tus visitantes hablen con el mismo bot, sin salir de tu sitio.
          </p>
        </div>
      </div>

      {!w ? (
        <div className="mt-5 flex justify-center">
          <Spinner className="text-brand-600" />
        </div>
      ) : w.error ? (
        <p className="mt-4 text-sm text-muted">No se pudo cargar la configuración del widget. Recarga la página.</p>
      ) : !w.allowed ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface2/50 p-3">
          <p className="text-sm text-muted">
            Disponible en los planes <strong className="text-fg">Pro</strong> y <strong className="text-fg">Elite</strong>.
          </p>
          <PlanCta className="shrink-0">
            <Button size="sm">Mejorar plan</Button>
          </PlanCta>
        </div>
      ) : (
        <div className="mt-5 space-y-5 border-t border-line pt-5">
          {/* Activar */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">Mostrar el chat en mi sitio</p>
              <p className="text-xs text-subtle">Si lo apagas, el botón desaparece de tu página al instante.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={w.enabled}
              aria-label="Mostrar el chat en mi sitio"
              disabled={!isOwner || saving}
              onClick={() => save({ enabled: !w.enabled }, w.enabled ? 'Widget desactivado.' : 'Widget activado.')}
              className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
                w.enabled ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  w.enabled ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Apariencia */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-fg">Color</p>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={!isOwner}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    aria-label={`Color ${c}`}
                    className={`h-8 w-8 rounded-full transition ${
                      form.color.toLowerCase() === c ? 'ring-2 ring-offset-2 ring-brand-500 ring-offset-surface' : ''
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <label
                  className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-line text-subtle"
                  title="Otro color"
                >
                  <Icon name="plus" size={14} />
                  <input
                    type="color"
                    value={form.color}
                    disabled={!isOwner}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Elegir otro color"
                  />
                </label>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-fg">Posición del botón</p>
              <div className="inline-flex rounded-lg border border-line p-0.5">
                {[
                  ['left', 'Izquierda'],
                  ['right', 'Derecha'],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    disabled={!isOwner}
                    onClick={() => setForm((f) => ({ ...f, position: val }))}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      form.position === val ? 'bg-brand-600 text-white' : 'text-muted hover:text-fg'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="widget-greeting" className="mb-2 block text-sm font-medium text-fg">
              Saludo <span className="font-normal text-subtle">(opcional)</span>
            </label>
            <input
              id="widget-greeting"
              value={form.greeting}
              disabled={!isOwner}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))}
              placeholder="¡Hola! ¿Te ayudo a cotizar o agendar?"
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
            />
            <p className="mt-1 text-xs text-subtle">Aparece junto al botón y como primer mensaje del chat.</p>
          </div>

          {isOwner && dirty && (
            <div className="flex justify-end">
              <Button size="sm" disabled={saving} onClick={() => save(form)}>
                {saving ? 'Guardando…' : 'Guardar apariencia'}
              </Button>
            </div>
          )}

          {/* Opciones del chat: preguntas sugeridas, apertura, prospectos, dominios… */}
          <WidgetOptions w={w} isOwner={isOwner} saving={saving} onSave={save} />

          {/* Código para pegar */}
          {w.key && (
            <div>
              <p className="mb-1 text-sm font-medium text-fg">Código para tu sitio</p>
              <p className="mb-2 text-xs text-subtle">
                Pégalo antes de la etiqueta &lt;/body&gt;. En WordPress, Wix, Shopify o Tiendanube búscalo como
                &quot;código personalizado&quot; o &quot;scripts del pie de página&quot;.
              </p>
              <div className="flex items-stretch gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-line bg-canvas px-3 py-2.5 font-mono text-xs text-fg">
                  {snippet}
                </code>
                <Button size="sm" variant="secondary" onClick={copy} className="shrink-0">
                  <Icon name={copied ? 'check' : 'copy'} size={15} />
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {w.enabled && (
                  <a
                    href={`/w/${w.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                  >
                    Probar el chat <Icon name="arrowRight" size={14} />
                  </a>
                )}
                {isOwner && (
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={saving}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
                  >
                    <Icon name="refresh" size={13} /> Generar código nuevo
                  </button>
                )}
              </div>
            </div>
          )}

          {!w.key && isOwner && (
            <Button size="sm" disabled={saving} onClick={() => save({ enabled: true }, 'Widget activado.')}>
              Activar y obtener mi código
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

const AUTO_OPEN = [
  [0, 'Nunca'],
  [5, 'A los 5 s'],
  [10, 'A los 10 s'],
  [20, 'A los 20 s'],
  [30, 'A los 30 s'],
  [60, 'Al minuto'],
];

function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

/**
 * Opciones avanzadas del widget. Se editan juntas y se guardan con un botón
 * (los interruptores también esperan a "Guardar opciones" para no hacer una
 * petición por clic).
 */
function WidgetOptions({ w, isOwner, saving, onSave }) {
  const fromW = (x) => ({
    suggestions: x.suggestions?.length ? [...x.suggestions] : [],
    autoOpenSeconds: x.autoOpenSeconds || 0,
    requireContact: Boolean(x.requireContact),
    hideOnMobile: Boolean(x.hideOnMobile),
    buttonText: x.buttonText || '',
    domainsText: (x.allowedDomains || []).join('\n'),
  });
  const [o, setO] = useState(() => fromW(w));
  const [open, setOpen] = useState(false);
  useEffect(() => setO(fromW(w)), [w]);

  const domains = o.domainsText
    .split(/[\n,]/)
    .map((d) => d.trim())
    .filter(Boolean);
  const suggestions = o.suggestions.map((q) => q.trim()).filter(Boolean);
  const dirty =
    JSON.stringify(suggestions) !== JSON.stringify(w.suggestions || []) ||
    o.autoOpenSeconds !== (w.autoOpenSeconds || 0) ||
    o.requireContact !== Boolean(w.requireContact) ||
    o.hideOnMobile !== Boolean(w.hideOnMobile) ||
    o.buttonText.trim() !== (w.buttonText || '') ||
    JSON.stringify(domains) !== JSON.stringify(w.allowedDomains || []);
  const tooShort = suggestions.some((q) => q.length < 2);
  const active = [
    suggestions.length && `${suggestions.length} preguntas sugeridas`,
    w.requireContact && 'pide datos',
    w.autoOpenSeconds && 'se abre solo',
    (w.allowedDomains || []).length && 'dominios limitados',
    w.hideOnMobile && 'oculto en celular',
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-fg">Más opciones del chat</span>
          <span className="block truncate text-xs text-muted">
            {active.length ? active.join(' · ') : 'Preguntas sugeridas, pedir datos, dominios y más'}
          </span>
        </span>
        <Icon
          name="chevronRight"
          size={16}
          className={`shrink-0 text-subtle transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-line px-3 pb-4 pt-4 animate-fade-up">
          {/* Preguntas sugeridas */}
          <div>
            <p className="text-sm font-medium text-fg">Preguntas sugeridas</p>
            <p className="mt-0.5 text-xs text-muted">Botones dentro del chat para que el visitante empiece con un toque.</p>
            <div className="mt-2 space-y-2">
              {o.suggestions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={q}
                    maxLength={60}
                    disabled={!isOwner}
                    onChange={(e) =>
                      setO((x) => ({ ...x, suggestions: x.suggestions.map((y, j) => (j === i ? e.target.value : y)) }))
                    }
                    placeholder={['¿Cuánto cuesta?', '¿Tienen disponibilidad hoy?', '¿Dónde están?', 'Quiero una cotización'][i]}
                    aria-label={`Pregunta sugerida ${i + 1}`}
                    className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
                  />
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setO((x) => ({ ...x, suggestions: x.suggestions.filter((_, j) => j !== i) }))}
                      aria-label={`Quitar pregunta ${i + 1}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </div>
              ))}
              {isOwner && o.suggestions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setO((x) => ({ ...x, suggestions: [...x.suggestions, ''] }))}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-500/10"
                >
                  <Icon name="plus" size={15} /> Agregar pregunta
                </button>
              )}
            </div>
          </div>

          {/* Pedir datos */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">Pedir nombre y contacto antes de chatear</p>
              <p className="mt-0.5 text-xs text-muted">
                El visitante deja su nombre y su correo o WhatsApp. Cada conversación queda como prospecto en tu bandeja.
              </p>
            </div>
            <Switch
              checked={o.requireContact}
              disabled={!isOwner}
              label="Pedir nombre y contacto"
              onChange={(v) => setO((x) => ({ ...x, requireContact: v }))}
            />
          </div>

          {/* Apertura automática + texto del botón */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="w-autoopen" className="text-sm font-medium text-fg">
                Abrir el chat solo
              </label>
              <Select
                id="w-autoopen"
                value={o.autoOpenSeconds}
                disabled={!isOwner}
                onChange={(e) => setO((x) => ({ ...x, autoOpenSeconds: Number(e.target.value) }))}
                size="sm"
                className="mt-1.5 py-2"
              >
                {AUTO_OPEN.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-[11px] text-subtle">Una vez por visita y nunca en celular.</p>
            </div>
            <div>
              <label htmlFor="w-btntext" className="text-sm font-medium text-fg">
                Texto del botón <span className="font-normal text-subtle">(opcional)</span>
              </label>
              <input
                id="w-btntext"
                value={o.buttonText}
                maxLength={30}
                disabled={!isOwner}
                onChange={(e) => setO((x) => ({ ...x, buttonText: e.target.value }))}
                placeholder="¿Te ayudamos?"
                className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
              />
              <p className="mt-1 text-[11px] text-subtle">Vacío = solo el ícono.</p>
            </div>
          </div>

          {/* Ocultar en celular */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">Ocultar en celular</p>
              <p className="mt-0.5 text-xs text-muted">El botón solo aparece en computadora y tableta.</p>
            </div>
            <Switch
              checked={o.hideOnMobile}
              disabled={!isOwner}
              label="Ocultar en celular"
              onChange={(v) => setO((x) => ({ ...x, hideOnMobile: v }))}
            />
          </div>

          {/* Dominios permitidos */}
          <div>
            <label htmlFor="w-domains" className="text-sm font-medium text-fg">
              Dominios permitidos <span className="font-normal text-subtle">(recomendado)</span>
            </label>
            <p className="mt-0.5 text-xs text-muted">
              Uno por línea, por ejemplo <span className="font-mono">misitio.com</span>. Incluye sus subdominios. Si alguien
              copia tu código en otro sitio, el chat no aparece y no gasta tu saldo. Vacío = cualquier sitio.
            </p>
            <textarea
              id="w-domains"
              rows={2}
              value={o.domainsText}
              disabled={!isOwner}
              onChange={(e) => setO((x) => ({ ...x, domainsText: e.target.value }))}
              placeholder="misitio.com"
              className="mt-2 w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-sm text-fg outline-none transition focus:border-brand-500"
            />
          </div>

          {isOwner && dirty && (
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={saving || tooShort || domains.length > 5}
                onClick={() =>
                  onSave(
                    {
                      suggestions,
                      autoOpenSeconds: o.autoOpenSeconds,
                      requireContact: o.requireContact,
                      hideOnMobile: o.hideOnMobile,
                      buttonText: o.buttonText.trim(),
                      allowedDomains: domains,
                    },
                    'Opciones del chat guardadas.'
                  )
                }
              >
                {saving ? 'Guardando…' : 'Guardar opciones'}
              </Button>
            </div>
          )}
          {domains.length > 5 && <p className="text-xs text-red-500">Máximo 5 dominios.</p>}
        </div>
      )}
    </div>
  );
}
