import { Link, Navigate } from 'react-router-dom';
import { useBusinessStore } from '../store/businessStore.js';
import { Card, Button } from '../components/ui/index.jsx';
import { Icon } from '../components/ui/Icon.jsx';

const LABEL = {
  simulator: 'usar el simulador',
  training: 'entrenar el bot',
  profile: 'cambiar los datos del negocio',
  connections: 'administrar las conexiones',
};

/** ¿El usuario puede hacer `key` en el negocio activo? (el dueño siempre) */
export function useCan(key) {
  const role = useBusinessStore((s) => s.role);
  const permissions = useBusinessStore((s) => s.permissions);
  return role !== 'colaborador' || Boolean(permissions?.[key]);
}

/**
 * Protege una página del panel según los permisos que el dueño dio en Equipo.
 * El servidor valida lo mismo; esto solo evita mostrar algo que no se puede usar.
 */
export function RequirePermission({ perm, children }) {
  const can = useCan(perm);
  if (can) return children;
  return (
    <Card className="mx-auto max-w-md py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface2 text-subtle">
        <Icon name="shield" size={24} />
      </span>
      <h1 className="mt-3 text-lg font-bold text-fg">Sin permiso</h1>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
        El dueño del negocio no te ha dado permiso para {LABEL[perm] || 'esta sección'}. Pídeselo si lo necesitas.
      </p>
      <Link to="/dashboard" className="mt-5 inline-block">
        <Button variant="secondary">Ir al inicio</Button>
      </Link>
    </Card>
  );
}

/**
 * Solo el DUEÑO del negocio activo (p. ej. Facturación). Un colaborador que entra
 * por URL vuelve al inicio.
 */
export function RequireOwner({ children }) {
  const role = useBusinessStore((st) => st.role);
  if (role && role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
