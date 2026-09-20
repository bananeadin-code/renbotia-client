import { useEffect, useRef, useState } from 'react';
import { useBusinessStore } from '../../store/businessStore.js';
import { getActiveBusinessId } from '../../api/axios.js';
import { Icon } from '../ui/Icon.jsx';

const roleLabel = (p) => (p.role === 'owner' ? 'Tuyo' : 'Colaboras');

/** Avatar con la inicial del proyecto; distinto tinte según el rol (propio/colaboración). */
function ProjectAvatar({ project, size = 'md' }) {
  const owner = project.role === 'owner';
  const dim = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-8 w-8 text-xs';
  return (
    <span
      className={`flex ${dim} shrink-0 items-center justify-center rounded-lg font-bold ${
        owner
          ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300'
          : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
      }`}
      aria-hidden="true"
    >
      {project.name?.charAt(0).toUpperCase() || 'N'}
    </span>
  );
}

/** Pastilla de rol (Tuyo / Colaboras). */
function RoleChip({ project }) {
  const owner = project.role === 'owner';
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        owner
          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
          : 'bg-sky-500/10 text-sky-600 dark:text-sky-300'
      }`}
    >
      {roleLabel(project)}
    </span>
  );
}

/**
 * Selector de proyecto activo. Solo aparece si el usuario tiene más de un
 * proyecto (su negocio propio + uno donde colabora). Dropdown propio (no el
 * <select> nativo) para que combine con el tema: avatar, rol y check del activo.
 * Al cambiar, recarga el dashboard con el nuevo tenant (el backend valida el
 * acceso en cada request).
 */
export function ProjectSwitcher() {
  const { projects, business, switchTo } = useBusinessStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!projects || projects.length < 2) return null;

  const activeId = String(business?.id || business?._id || getActiveBusinessId() || '');
  const active = projects.find((p) => String(p.id) === activeId) || projects[0];

  function choose(id) {
    setOpen(false);
    if (String(id) !== activeId) switchTo(id);
  }

  return (
    <div className="mb-4" ref={ref}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-subtle">
        Proyecto
      </span>

      <div className="relative">
        {/* Disparador */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Cambiar de proyecto"
          className={`flex w-full items-center gap-2.5 rounded-lg border bg-surface px-2.5 py-2 text-left transition hover:border-brand-300 ${
            open ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-line'
          }`}
        >
          <ProjectAvatar project={active} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-fg">{active.name}</span>
            <span className="block text-[11px] text-subtle">{roleLabel(active)}</span>
          </span>
          <Icon
            name="chevronRight"
            size={16}
            className={`shrink-0 text-subtle transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
          />
        </button>

        {/* Menú */}
        {open && (
          <div
            role="listbox"
            aria-label="Proyectos"
            className="absolute left-0 right-0 top-full z-40 mt-1.5 origin-top overflow-hidden rounded-xl border border-line bg-surface/95 shadow-elevated backdrop-blur-xl animate-scale-in"
          >
            {projects.map((p) => {
              const isActive = String(p.id) === activeId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => choose(p.id)}
                  className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition ${
                    isActive ? 'bg-brand-500/10' : 'hover:bg-surface2'
                  }`}
                >
                  <ProjectAvatar project={p} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{p.name}</span>
                  </span>
                  <RoleChip project={p} />
                  {isActive ? (
                    <Icon name="check" size={16} className="shrink-0 text-brand-600" />
                  ) : (
                    <span className="w-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
