import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';

/**
 * Modal accesible y responsive.
 * - Móvil: hoja que ocupa el ancho, anclada abajo (bottom sheet).
 * - Desktop: tarjeta centrada.
 * Cierra con Escape o clic en el fondo. Bloquea el scroll del body mientras
 * está abierto. Usa tokens semánticos (funciona en claro y oscuro).
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === 'lg' ? 'sm:max-w-lg' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-md';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Diálogo'}
    >
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={`relative z-10 flex max-h-[92vh] w-full ${maxW} flex-col rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl animate-fade-up`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-base font-bold text-fg">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-subtle transition hover:bg-surface2 hover:text-fg"
              aria-label="Cerrar"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
