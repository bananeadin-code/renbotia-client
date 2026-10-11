import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { botConfigApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useAccess } from '../../router/RequirePermission.jsx';

const fmt = (d) => new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Prueba de seguridad del bot: 7 "clientes tramposos" (piden sus instrucciones,
 * datos de otros clientes, descuentos falsos, se hacen pasar por el dueño…).
 * Muestra qué hace bien y qué conviene ajustar en el entrenamiento.
 */
export function BotAuditCard() {
  const canView = useAccess('training', 'view');
  const canRun = useAccess('training', 'edit');
  const [audit, setAudit] = useState(undefined);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!canView) return;
    botConfigApi
      .audit()
      .then(({ audit: a }) => setAudit(a))
      .catch(() => setAudit(null));
  }, [canView]);

  if (!canView) return null;

  async function run() {
    setRunning(true);
    try {
      const { audit: a } = await botConfigApi.runAudit();
      setAudit(a);
      toast.success(a.passed === a.total ? 'Tu bot pasó todas las pruebas.' : `Tu bot pasó ${a.passed} de ${a.total}. Revisa las sugerencias.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo correr la prueba.');
    } finally {
      setRunning(false);
    }
  }

  const all = audit && audit.passed === audit.total;

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg text-canvas shadow-card">
          <Icon name="shieldCheck" size={20} />
        </span>
        <h2 className="min-w-0 flex-1 font-semibold text-fg">Prueba de seguridad de tu bot</h2>
        {canRun && (
          <Button size="sm" className="shrink-0" onClick={run} disabled={running}>
            {running ? (
              <>
                <Spinner size={16} /> Probando…
              </>
            ) : audit ? (
              'Repetir'
            ) : (
              'Probar mi bot'
            )}
          </Button>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">
        Le escribimos como 7 clientes tramposos: piden sus instrucciones, datos de otros clientes, descuentos que no existen o se
        hacen pasar por ti. No avisa a nadie ni guarda conversaciones; tarda ~30 segundos y usa ~4 conversaciones de tu plan.
      </p>

      {audit === undefined ? null : !audit ? (
        <p className="mt-4 text-sm text-subtle">Aún no has probado tu bot. Tarda medio minuto.</p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={`text-sm font-semibold ${all ? 'text-brand-700 dark:text-brand-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {all ? 'Pasó todas las pruebas' : `Pasó ${audit.passed} de ${audit.total}`}
            </p>
            <span className="text-xs text-subtle">{fmt(audit.at)}</span>
          </div>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {audit.results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  aria-expanded={open === r.id}
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      r.ok === true ? 'bg-brand-500 text-white' : r.ok === false ? 'bg-amber-500/15 text-amber-600' : 'bg-surface2 text-subtle'
                    }`}
                  >
                    <Icon name={r.ok === true ? 'check' : r.ok === false ? 'alert' : 'clock'} size={12} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">{r.title}</span>
                    <span className="block text-xs text-muted">{r.reason}</span>
                  </span>
                  <Icon name="chevronRight" size={15} className={`mt-0.5 shrink-0 text-subtle transition-transform ${open === r.id ? 'rotate-90' : ''}`} />
                </button>
                {open === r.id && (
                  <div className="space-y-2 px-3 pb-3 pl-10 text-sm">
                    <p className="text-muted">
                      <span className="font-medium text-fg">Cliente:</span> {r.message}
                    </p>
                    <p className="whitespace-pre-line text-muted">
                      <span className="font-medium text-fg">Tu bot:</span> {r.reply || '(sin respuesta)'}
                    </p>
                    {r.tip && (
                      <p className="rounded-lg bg-surface2 px-3 py-2 text-fg">
                        <span className="font-medium">Sugerencia:</span> {r.tip}{' '}
                        <Link to="/dashboard/entrenamiento" className="font-medium text-brand-600 hover:underline">
                          Ir a Entrenamiento
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
