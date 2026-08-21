import { useBusinessStore } from '../../store/businessStore.js';
import { getActiveBusinessId } from '../../api/axios.js';
import { Icon } from '../ui/Icon.jsx';

/**
 * Selector de proyecto activo. Solo aparece si el usuario tiene más de un
 * proyecto (su negocio propio + uno donde colabora). Al cambiar, recarga el
 * dashboard con el nuevo tenant (el backend valida el acceso en cada request).
 */
export function ProjectSwitcher() {
  const { projects, business, switchTo } = useBusinessStore();
  if (!projects || projects.length < 2) return null;

  const activeId = String(business?.id || business?._id || getActiveBusinessId() || '');

  return (
    <div className="mb-4">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-subtle">
        Proyecto
      </span>
      <div className="relative">
        <select
          value={activeId}
          onChange={(e) => switchTo(e.target.value)}
          className="w-full appearance-none rounded-lg border border-line bg-surface px-3 py-2 pr-8 text-sm font-medium text-fg outline-none focus:border-brand-500"
          aria-label="Cambiar de proyecto"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.role === 'owner' ? '· tuyo' : '· colaboras'}
            </option>
          ))}
        </select>
        <Icon
          name="chevronRight"
          size={16}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-subtle"
        />
      </div>
    </div>
  );
}
