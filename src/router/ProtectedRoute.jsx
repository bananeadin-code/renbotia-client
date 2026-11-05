import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Spinner } from '../components/ui/index.jsx';

/**
 * Envuelve rutas privadas. Redirige a /login si no hay sesión y, opcionalmente,
 * exige un rol concreto (para el panel admin).
 */
export function ProtectedRoute({ children, role }) {
  const { isAuthenticated, loading, user } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowed = Array.isArray(role) ? role : role ? [role] : null;
  if (allowed && !allowed.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
