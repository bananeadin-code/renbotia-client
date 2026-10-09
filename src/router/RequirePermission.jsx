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

const RANK = { none: 0, view: 1, edit: 2 };

/** ¿El acceso alcanza `level` en `module`? (fuera de un hook) */
export function canAccess(access, role, module, level = 'view') {
  if (role === 'owner') return true;
  if (!access) return level === 'view'; // mientras carga: no ocultar de más
  return (RANK[access.modules?.[module]] ?? 0) >= (RANK[level] ?? 1);
}

/** ¿Puede usar `module` con este nivel en el negocio activo? (el dueño siempre) */
export function useAccess(module, level = 'view') {
  const role = useBusinessStore((s) => s.role);
  const access = useBusinessStore((s) => s.access);
  return canAccess(access, role, module, level);
}

/**
 * Compatibilidad: los 4 permisos de antes = "editar" en su módulo
 * (simulator, training, profile, connections).
 */
export function useCan(key) {
  return useAccess(key, 'edit');
}

const MODULE_LABEL = {
  conversations: 'las conversaciones',
  training: 'el entrenamiento',
  simulator: 'el simulador',
  management: 'la gestión de trabajo',
  analytics: 'las analíticas',
  connections: 'las conexiones',
  profile: 'los datos del negocio',
  team: 'el equipo',
  activity: 'la actividad',
};

/** Protege una página según el ROL (módulo y nivel). El servidor valida lo mismo. */
export function RequireAccess({ module, level = 'view', children }) {
  const ok = useAccess(module, level);
  if (ok) return children;
  return (
    <Card className="mx-auto max-w-md py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface2 text-subtle">
        <Icon name="shield" size={24} />
      </span>
      <h1 className="mt-3 text-lg font-bold text-fg">Tu rol no incluye esta sección</h1>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
        Para ver {MODULE_LABEL[module] || 'esta sección'}, pídele al dueño del negocio que ajuste tu rol en Equipo.
      </p>
      <Link to="/dashboard" className="mt-5 inline-block">
        <Button variant="secondary">Ir al inicio</Button>
      </Link>
    </Card>
  );
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
