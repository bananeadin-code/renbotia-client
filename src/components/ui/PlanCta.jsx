import { Link } from 'react-router-dom';
import { useBusinessStore } from '../../store/businessStore.js';

/**
 * Llamado a mejorar el plan o comprar créditos. Solo el DUEÑO puede pagar: a un
 * colaborador se le muestra a quién pedírselo, en vez de un enlace a Facturación
 * que no podría usar.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children  El enlace/botón para el dueño.
 * @param {string} [props.to]               Destino (por defecto Facturación).
 * @param {string} [props.className]        Clases del enlace del dueño.
 * @param {string} [props.memberText]       Texto para el colaborador.
 */
export function PlanCta({ children, to = '/dashboard/facturacion', className = '', memberText = 'Pídele al dueño del negocio que mejore el plan.' }) {
  const role = useBusinessStore((s) => s.role);
  if (role && role !== 'owner') {
    return <span className="text-xs font-medium text-muted">{memberText}</span>;
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

/** ¿El usuario actual es el dueño del negocio activo? */
export function useIsOwner() {
  return useBusinessStore((s) => s.role) === 'owner';
}
