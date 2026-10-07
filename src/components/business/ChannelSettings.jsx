import { useEffect, useState } from 'react';
import { connectionsApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Ajustes de un canal conectado: pausar el bot (sin desconectar) y, en Messenger
 * e Instagram, las preguntas iniciales que el cliente ve antes de escribir; en
 * Messenger, además, el saludo de la pantalla de bienvenida.
 *
 * @param {object} props
 * @param {'whatsapp'|'facebook'|'instagram'} props.channel
 * @param {object} props.settings  ajustes actuales de ese canal (de GET /connections)
 * @param {boolean} props.isOwner
 * @param {() => Promise<any>} props.onChanged
 */
const LABEL = { whatsapp: 'WhatsApp', facebook: 'Messenger', instagram: 'Instagram' };
const MAX_QUESTIONS = 4;

export function ChannelSettings({ channel, settings, isOwner, onChanged }) {
  const supportsQuestions = channel !== 'whatsapp';
  const supportsGreeting = channel === 'facebook';
  const paused = Boolean(settings?.paused);

  const [questions, setQuestions] = useState(settings?.iceBreakers || []);
  const [greeting, setGreeting] = useState(settings?.greeting || '');
  const [saving, setSaving] = useState('');

  useEffect(() => {
    setQuestions(settings?.iceBreakers || []);
    setGreeting(settings?.greeting || '');
  }, [settings]);

  async function save(patch, okMsg, key) {
    setSaving(key);
    try {
      const res = await connectionsApi.updateSettings({ channel, ...patch });
      await onChanged?.();
      if (res?.metaWarning) toast.error(res.metaWarning);
      else toast.success(okMsg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setSaving('');
    }
  }

  const cleanQuestions = questions.map((q) => q.trim()).filter(Boolean);
  const profileDirty =
    JSON.stringify(cleanQuestions) !== JSON.stringify(settings?.iceBreakers || []) ||
    (supportsGreeting && greeting.trim() !== (settings?.greeting || ''));
  const tooShort = cleanQuestions.some((q) => q.length < 2);

  return (
    <Card>
      <h2 className="font-semibold text-fg">Ajustes de {LABEL[channel]}</h2>

      {/* Pausa del bot en este canal */}
      <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-line p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">Bot activo en {LABEL[channel]}</p>
          <p className="mt-0.5 text-xs text-muted">
            {paused
              ? `En pausa${
                  settings?.pausedUntil
                    ? ` hasta ${new Date(settings.pausedUntil).toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : ''
                }: los mensajes llegan a Conversaciones y los contestas tú. El canal sigue conectado.`
              : 'Pausa el bot sin desconectar el canal, por ejemplo si prefieres atender este canal tú mismo.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!paused}
          aria-label={`Bot activo en ${LABEL[channel]}`}
          disabled={!isOwner || saving === 'pause'}
          onClick={() =>
            save({ paused: !paused }, paused ? `Bot reactivado en ${LABEL[channel]}.` : `Bot en pausa en ${LABEL[channel]}.`, 'pause')
          }
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
            !paused ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              !paused ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {supportsQuestions && (
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-fg">Preguntas iniciales</p>
              <span className="text-xs text-subtle">
                {cleanQuestions.length}/{MAX_QUESTIONS}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Botones que el cliente ve al abrir el chat por primera vez. Al tocar uno, el bot responde esa pregunta.
            </p>
            <div className="mt-3 space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={q}
                    maxLength={80}
                    disabled={!isOwner}
                    onChange={(e) => setQuestions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={['¿Cuáles son sus precios?', '¿Qué horario tienen?', '¿Dónde están ubicados?', '¿Cómo agendo una cita?'][i]}
                    aria-label={`Pregunta inicial ${i + 1}`}
                    className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
                  />
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setQuestions((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Quitar pregunta ${i + 1}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </div>
              ))}
              {isOwner && questions.length < MAX_QUESTIONS && (
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => [...prev, ''])}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-600 transition hover:bg-brand-500/10"
                >
                  <Icon name="plus" size={15} /> Agregar pregunta
                </button>
              )}
            </div>
          </div>

          {supportsGreeting && (
            <div>
              <label htmlFor="msg-greeting" className="text-sm font-medium text-fg">
                Saludo de bienvenida <span className="font-normal text-subtle">(opcional)</span>
              </label>
              <p className="mt-0.5 text-xs text-muted">
                Lo ve quien abre el chat de tu Página por primera vez, antes de escribir. Puedes usar {'{{user_first_name}}'}{' '}
                para su nombre.
              </p>
              <textarea
                id="msg-greeting"
                rows={2}
                maxLength={160}
                value={greeting}
                disabled={!isOwner}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="¡Hola {{user_first_name}}! Escríbenos y te respondemos al instante."
                className="mt-2 w-full resize-none rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
              />
              <p className="text-right text-[11px] text-subtle">{greeting.length}/160</p>
            </div>
          )}

          {isOwner && profileDirty && (
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={saving === 'profile' || tooShort}
                onClick={() =>
                  save(
                    {
                      iceBreakers: cleanQuestions,
                      ...(supportsGreeting ? { greeting: greeting.trim() } : {}),
                    },
                    `Listo. Meta puede tardar unos minutos en mostrarlo en ${LABEL[channel]}.`,
                    'profile'
                  )
                }
              >
                {saving === 'profile' ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
