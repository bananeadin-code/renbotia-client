import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { conversationsApi } from '../../api/endpoints.js';
import { Card, Select, Notice, Spinner } from '../ui/index.jsx';

const HOURS = [
  [2, '2 horas antes'],
  [4, '4 horas antes'],
  [12, '12 horas antes'],
  [24, '1 día antes'],
  [48, '2 días antes'],
];
const FIELDS = [
  ['{nombre}', 'Nombre del cliente'],
  ['{fecha}', 'Fecha (ej. viernes 17 de octubre)'],
  ['{hora}', 'Hora (ej. 4:30 p. m.)'],
  ['{servicio}', 'Servicio o resumen'],
  ['{negocio}', 'Nombre de tu negocio'],
];
const SUGGESTED = 'Hola {{1}}, te recordamos tu cita en {{2}} el {{3}} a las {{4}}. ¿Nos confirmas tu asistencia?';

/**
 * Gestión → Recordatorios: unas horas antes, el bot le escribe al cliente para
 * que confirme. Dentro de las 24 h de su último mensaje va como texto normal;
 * después, solo por WhatsApp y con una plantilla aprobada.
 */
export function ReminderSettings({ value, onChange, Toggle }) {
  const r = value;
  const set = (patch) => onChange({ ...r, ...patch });
  const tpl = r.template || { name: '', language: '', params: [] };
  const [templates, setTemplates] = useState(null);

  useEffect(() => {
    if (!r.enabled || templates) return;
    conversationsApi
      .templates()
      .then((d) => setTemplates((d.templates || []).filter((x) => x.usable !== false && x.status === 'APPROVED')))
      .catch(() => setTemplates([]));
  }, [r.enabled, templates]);

  const selected = templates?.find((x) => x.name === tpl.name && (!tpl.language || x.language === tpl.language));

  function choose(key) {
    if (!key) return set({ template: { name: '', language: '', params: [] } });
    const [name, language] = key.split('|');
    const t = templates.find((x) => x.name === name && x.language === language);
    // Propuesta inicial: las variables en el orden más común (nombre, negocio, fecha, hora…).
    const order = ['{nombre}', '{negocio}', '{fecha}', '{hora}', '{servicio}'];
    set({ template: { name, language, params: (t?.vars || []).map((_, i) => order[i] || '{servicio}') } });
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-fg">Recordatorios de citas</h2>
          <p className="mt-0.5 text-sm text-muted">
            Tu bot le escribe al cliente antes de su cita para que confirme. Si responde que sí, la cita queda confirmada; si cancela,
            se libera el espacio; si quiere cambiarla, te avisamos.
          </p>
        </div>
        <Toggle checked={Boolean(r.enabled)} onChange={(v) => set({ enabled: v })} />
      </div>

      {r.enabled && (
        <div className="mt-4 space-y-4">
          <Select label="Cuándo enviarlo" value={r.hoursBefore || 24} onChange={(e) => set({ hoursBefore: Number(e.target.value) })} className="sm:w-60">
            {HOURS.map(([h, l]) => (
              <option key={h} value={h}>
                {l}
              </option>
            ))}
          </Select>

          <div>
            <p className="text-sm font-medium text-fg">Si ya pasaron 24 h desde que escribió el cliente</p>
            <p className="mb-2 text-xs text-muted">
              WhatsApp solo permite escribirle con una plantilla aprobada por Meta (Meta la cobra a tu cuenta). Sin plantilla, ese
              recordatorio no se envía. Messenger e Instagram no permiten escribir después de 24 h.
            </p>
            {templates === null ? (
              <Spinner size={16} />
            ) : templates.length === 0 ? (
              <Notice variant="info">
                No tienes plantillas aprobadas. Crea una de categoría <b>Utilidad</b> en{' '}
                <Link to="/dashboard/conexiones" className="font-medium text-brand-600 hover:underline">
                  Conexiones → WhatsApp → Plantillas
                </Link>
                , por ejemplo: <span className="italic">“{SUGGESTED}”</span>
              </Notice>
            ) : (
              <div className="space-y-3">
                <Select
                  value={tpl.name ? `${tpl.name}|${tpl.language}` : ''}
                  onChange={(e) => choose(e.target.value)}
                  aria-label="Plantilla del recordatorio"
                  className="sm:w-96"
                >
                  <option value="" description="Solo se recuerda a quien escribió en las últimas 24 h.">
                    Sin plantilla
                  </option>
                  {templates.map((x) => (
                    <option key={`${x.name}|${x.language}`} value={`${x.name}|${x.language}`} description={x.bodyText?.slice(0, 90)}>
                      {x.name} ({x.language})
                    </option>
                  ))}
                </Select>
                {selected?.vars?.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-line p-3">
                    <p className="text-xs text-muted">{selected.bodyText}</p>
                    {selected.vars.map((v, i) => (
                      <div key={v} className="flex flex-wrap items-center gap-2">
                        <code className="w-14 shrink-0 rounded bg-surface2 px-1.5 py-0.5 text-center text-xs text-fg">{`{{${v}}}`}</code>
                        <Select
                          size="sm"
                          aria-label={`Valor de {{${v}}}`}
                          value={tpl.params[i] || '{servicio}'}
                          onChange={(e) => {
                            const params = [...tpl.params];
                            params[i] = e.target.value;
                            set({ template: { ...tpl, params } });
                          }}
                          fullWidth={false}
                          className="min-w-[14rem]"
                        >
                          {FIELDS.map(([k, l]) => (
                            <option key={k} value={k}>
                              {l}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
