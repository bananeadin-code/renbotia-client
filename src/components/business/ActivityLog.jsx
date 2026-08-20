import { useEffect, useState } from 'react';
import { businessApi } from '../../api/endpoints.js';
import { Card, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

// Ícono por tipo de acción registrada.
const ACTION_ICON = {
  'botconfig.update': 'academic',
  'business.update': 'user',
  'whatsapp.verify': 'message',
  'plan.upgrade': 'sparkles',
  'plan.activate': 'sparkles',
  'plan.change': 'sliders',
  'plan.cancel': 'card',
  'plan.resume': 'card',
  'credits.purchase': 'card',
};

const fmt = (iso) =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

/** Bitácora de auditoría del negocio: quién cambió qué y cuándo. */
export function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    businessApi
      .audit()
      .then((d) => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <Icon name="clipboard" size={18} className="text-brand-600" />
        <h2 className="font-semibold text-fg">Actividad reciente</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        Registro de cambios en tu negocio y tu bot (quién hizo qué y cuándo).
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner className="text-brand-600" size={20} />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-4 text-center text-sm text-subtle">
          Aún no hay movimientos registrados.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {logs.map((l) => (
            <li key={l._id} className="flex items-start gap-3 py-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface2 text-muted">
                <Icon name={ACTION_ICON[l.action] || 'clipboard'} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-fg">{l.summary || l.action}</div>
                <div className="text-xs text-subtle">
                  {l.user?.name || l.user?.email || 'Sistema'} · {fmt(l.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
