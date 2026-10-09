import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { conversationsApi } from '../../api/endpoints.js';
import { Alert, Spinner, Notice, Select } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

const DELAYS = [
  [24, '1 día'],
  [48, '2 días'],
  [72, '3 días'],
  [120, '5 días'],
  [168, '7 días'],
];

/**
 * Seguimiento DESPUÉS de las 24 h (solo WhatsApp): pasado ese tiempo Meta solo
 * deja escribir con una plantilla aprobada. Se configura dentro de la tarjeta
 * de Seguimiento automático y se guarda con el resto del entrenamiento.
 *
 * @param {object} props
 * @param {object} props.value     followUp.template
 * @param {(v:object) => void} props.onChange
 */
export function TemplateFollowUp({ value, onChange }) {
  const [templates, setTemplates] = useState(null);
  const [reason, setReason] = useState(null);
  const t = value;
  const set = (patch) => onChange({ ...t, ...patch });

  useEffect(() => {
    if (!t.enabled || templates) return;
    conversationsApi
      .templates()
      .then((d) => {
        setTemplates((d.templates || []).filter((x) => x.usable !== false));
        setReason(d.reason || null);
      })
      .catch(() => {
        setTemplates([]);
        setReason('fetch_failed');
      });
  }, [t.enabled, templates]);

  const selected = templates?.find((x) => x.name === t.name && (!t.language || x.language === t.language));

  function choose(key) {
    const [name, language] = key.split('|');
    const tpl = templates.find((x) => x.name === name && x.language === language);
    set({ name, language, params: (tpl?.vars || []).map((_, i) => t.params?.[i] ?? (i === 0 ? '{nombre}' : '')) });
  }

  let preview = selected?.bodyText || '';
  (selected?.vars || []).forEach((v, i) => {
    const val = String(t.params?.[i] || '').replace(/\{nombre\}/gi, 'María') || '…';
    preview = preview.split(new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`)).join(val);
  });

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-fg">Después de 24 h, con plantilla (WhatsApp)</p>
          <p className="mt-0.5 text-xs text-muted">
            Pasado ese tiempo Meta solo deja escribir con una plantilla aprobada. Se envía una vez a clientes que te
            escribieron en los últimos 7 días y no respondieron.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={t.enabled}
          aria-label="Activar seguimiento con plantilla"
          onClick={() => set({ enabled: !t.enabled })}
          className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
            t.enabled ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              t.enabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {t.enabled &&
        (templates === null ? (
          <div className="flex justify-center py-3">
            <Spinner className="text-brand-600" />
          </div>
        ) : templates.length === 0 ? (
          <Alert variant="info">
            {reason === 'no_waba' ? (
              'Conecta tu WhatsApp para usar plantillas.'
            ) : (
              <>
                Aún no tienes plantillas aprobadas. Crea una en{' '}
                <Link to="/dashboard/conexiones?canal=whatsapp" className="font-semibold underline underline-offset-2">
                  Conexiones → WhatsApp
                </Link>{' '}
                (hay una sugerida de seguimiento) y espera la aprobación de Meta.
              </>
            )}
          </Alert>
        ) : (
          <div className="space-y-3 animate-fade-up">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="tfu-name" className="mb-1.5 block text-sm font-medium text-fg">
                  Plantilla
                </label>
                <Select
                  id="tfu-name"
                  value={selected ? `${selected.name}|${selected.language}` : ''}
                  onChange={(e) => choose(e.target.value)}
                  placeholder="Elige una plantilla aprobada"
                >
                  <option value="" disabled>
                    Elige una plantilla aprobada
                  </option>
                  {templates.map((x) => (
                    <option key={`${x.name}|${x.language}`} value={`${x.name}|${x.language}`}>
                      {x.name} ({x.language})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="tfu-delay" className="mb-1.5 block text-sm font-medium text-fg">
                  Enviarla tras
                </label>
                <Select
                  id="tfu-delay"
                  value={t.delayHours}
                  onChange={(e) => set({ delayHours: Number(e.target.value) })}
                  size="sm"
                  className="py-2"
                >
                  {DELAYS.map(([h, label]) => (
                    <option key={h} value={h}>
                      {label} sin respuesta
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {selected?.vars?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  Variables de la plantilla. Usa <code className="rounded bg-surface2 px-1">{'{nombre}'}</code> para el
                  nombre del cliente.
                </p>
                {selected.vars.map((v, i) => (
                  <input
                    key={v}
                    value={t.params?.[i] || ''}
                    onChange={(e) =>
                      set({ params: selected.vars.map((_, k) => (k === i ? e.target.value : t.params?.[k] || '')) })
                    }
                    maxLength={300}
                    placeholder={`Valor de {{${v}}}`}
                    className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
                  />
                ))}
                <label className="flex items-center gap-2 text-xs text-muted">
                  Si no sabemos su nombre, usar
                  <input
                    value={t.nameFallback ?? 'cliente'}
                    onChange={(e) => set({ nameFallback: e.target.value })}
                    maxLength={40}
                    className="w-32 rounded-md border border-line bg-canvas px-2 py-1 text-xs text-fg outline-none focus:border-brand-500"
                  />
                </label>
              </div>
            )}

            {preview && (
              <p className="whitespace-pre-wrap rounded-lg bg-surface2 px-3 py-2 text-xs text-muted">
                <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-subtle">
                  Vista previa
                </span>
                {preview}
                {selected?.quickReplies?.length > 0 && (
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {selected.quickReplies.map((q) => (
                      <span key={q} className="rounded-full border border-line px-2 py-0.5 text-[10px] text-fg">
                        {q}
                      </span>
                    ))}
                  </span>
                )}
              </p>
            )}
            {!selected && t.name && (
              <Alert variant="warning">
                La plantilla "{t.name}" ya no está aprobada o no se puede enviar sola. Elige otra.
              </Alert>
            )}
          </div>
        ))}

      <Notice variant="security">
Meta cobra cada plantilla a tu cuenta de Meta (no gasta tu saldo de RenBotIA). Máximo 30 al día, en tu
          horario de atención, nunca si tomaste el control o la conversación pide atención. Si el cliente
          responde, el bot retoma la conversación.
</Notice>
    </div>
  );
}
