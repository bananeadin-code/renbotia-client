import { ActivityLog } from '../../components/business/ActivityLog.jsx';

/**
 * Actividad: bitácora de cambios del negocio (quién hizo qué y cuándo). Antes
 * vivía al final de Perfil; aquí tiene su propia pestaña para consultarla rápido.
 */
export default function Activity() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Actividad</h1>
        <p className="text-sm text-muted">
          Registro de cambios en tu negocio y tu bot: quién hizo qué y cuándo.
        </p>
      </div>
      <ActivityLog />
    </div>
  );
}
