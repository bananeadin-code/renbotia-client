import { useEffect, useRef } from 'react';
import { useToastStore } from '../../store/toastStore.js';
import { Icon } from './Icon.jsx';

const VARIANTS = {
  success: { icon: 'checkCircle', accent: 'text-brand-600', ring: 'ring-brand-500/30' },
  error: { icon: 'alert', accent: 'text-red-500', ring: 'ring-red-500/30' },
  info: { icon: 'message', accent: 'text-brand-600', ring: 'ring-brand-500/30' },
};

const supportsPopover = typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');

/**
 * Contenedor de toasts (montado una sola vez en App). Muestra confirmaciones
 * transitorias apiladas abajo-derecha; cada una se auto-descarta. Theme-aware.
 *
 * - popover="manual": va en la capa superior del navegador (encima de menús y
 *   paneles sin pelear con z-index) y no se cierra al tocar otra parte. Sin
 *   soporte de Popover, el mismo div queda fixed con z-index (degradación).
 * - La región aria-live existe siempre, para que el lector de pantalla anuncie
 *   cada aviso nuevo.
 * - Con un modal abierto los avisos se retienen y aparecen al cerrarlo; su
 *   tiempo empieza a correr cuando se ven.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const modals = useToastStore((s) => s.modals);
  const remove = useToastStore((s) => s.remove);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!supportsPopover || !el) return undefined;
    if (!el.matches(':popover-open')) el.showPopover();
    return () => {
      if (el.matches(':popover-open')) el.hidePopover();
    };
  }, []);

  const visible = modals === 0 ? toasts : [];

  return (
    <div
      ref={ref}
      popover="manual"
      aria-live="polite"
      className="pointer-events-none fixed inset-auto bottom-4 right-4 z-[60] m-0 flex w-[min(92vw,360px)] flex-col gap-2 overflow-visible border-0 bg-transparent p-0"
    >
      {visible.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onClose }) {
  const v = VARIANTS[t.type] || VARIANTS.info;
  useEffect(() => {
    if (!(t.duration > 0)) return undefined;
    const id = setTimeout(onClose, t.duration);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id, t.duration]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-pop ring-1 ${v.ring} animate-fade-up`}
    >
      <Icon name={v.icon} size={18} className={`mt-0.5 shrink-0 ${v.accent}`} />
      <p className="min-w-0 flex-1 text-sm text-fg">{t.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-0.5 text-subtle transition hover:bg-surface2 hover:text-fg"
        aria-label="Cerrar aviso"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
