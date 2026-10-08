import { Link, useLocation } from 'react-router-dom';
import { useBusinessStore } from '../../store/businessStore.js';
import { Icon } from '../ui/Icon.jsx';

/**
 * Aviso en todo el panel cuando la renovación del plan no se pudo cobrar (solo
 * al dueño, que es quien paga). Sin esto, el dueño solo se enteraba al entrar a
 * Facturación o por correo, y su cuenta bajaba a Free al terminar la gracia.
 */
export function PastDueBanner() {
  const { subscription, role } = useBusinessStore();
  const { pathname } = useLocation();
  if (role !== 'owner' || !subscription) return null;
  const due = subscription.status === 'vencida' || subscription.renewalDue;
  if (!due || !subscription.renewalAmountMXN) return null;
  if (pathname.startsWith('/dashboard/facturacion')) return null; // ahí ya está el detalle

  const until = subscription.graceEndsAt
    ? new Date(subscription.graceEndsAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    : '';
  return (
    <Link
      to="/dashboard/facturacion"
      className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3 text-sm text-fg transition hover:border-red-500/60"
    >
      <Icon name="alert" size={18} className="shrink-0 text-red-500" />
      <span className="min-w-0 flex-1">
        <strong>No pudimos cobrar la renovación de tu plan.</strong>{' '}
        <span className="text-muted">
          {until ? `Resuélvelo antes del ${until} para no pasar a Free.` : 'Resuélvelo para conservar tu plan.'}
        </span>
      </span>
      <span className="shrink-0 font-semibold text-red-600 dark:text-red-400">Resolver</span>
    </Link>
  );
}
