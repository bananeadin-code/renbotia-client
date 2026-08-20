import { useToastStore } from '../../store/toastStore.js';
import { Icon } from './Icon.jsx';

const VARIANTS = {
  success: { icon: 'checkCircle', accent: 'text-brand-600', ring: 'ring-brand-500/30' },
  error: { icon: 'alert', accent: 'text-red-500', ring: 'ring-red-500/30' },
  info: { icon: 'message', accent: 'text-brand-600', ring: 'ring-brand-500/30' },
};

/**
 * Contenedor de toasts (montado una sola vez en App). Muestra confirmaciones
 * transitorias apiladas abajo-derecha; cada una se auto-descarta. Theme-aware.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => {
        const v = VARIANTS[t.type] || VARIANTS.info;
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-pop ring-1 ${v.ring} animate-fade-up`}
          >
            <Icon name={v.icon} size={18} className={`mt-0.5 shrink-0 ${v.accent}`} />
            <p className="min-w-0 flex-1 text-sm text-fg">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 rounded-md p-0.5 text-subtle transition hover:bg-surface2 hover:text-fg"
              aria-label="Cerrar"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
