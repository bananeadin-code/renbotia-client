import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';
import { useToastStore } from '../../store/toastStore.js';

/**
 * Modal accesible y responsive sobre el <dialog> nativo (showModal()).
 * - El navegador pone el diálogo en la capa superior, vuelve inerte el resto de
 *   la página, encierra el foco, cierra con Escape / gesto "atrás" y devuelve el
 *   foco al botón que lo abrió. Por eso aquí NO hay role="dialog", aria-modal,
 *   trampa de foco ni bloqueo de scroll con overflow en <body> (ver index.css:
 *   overscroll-behavior en dialog:modal y ::backdrop).
 * - Móvil: hoja anclada abajo (bottom sheet). Desktop: tarjeta centrada.
 * - El <dialog> ocupa toda la pantalla y es transparente; la tarjeta va dentro.
 *   Así la animación (transform) vive en la tarjeta y los menús de <Select>, que
 *   se dibujan dentro del diálogo con position: fixed, siguen ubicándose
 *   respecto a la ventana.
 * - Clic fuera de la tarjeta = cerrar (presionar y soltar fuera, para que
 *   arrastrar al seleccionar texto no lo cierre).
 *
 * API sin cambios: `open` controla la visibilidad y `onClose` se llama cuando el
 * usuario pide cerrar (Escape, atrás, clic fuera o la X).
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // El contenido se monta DESPUÉS de showModal(): así el autoFocus de React
  // funciona (un elemento dentro de un <dialog> cerrado no puede recibir foco).
  const [shown, setShown] = useState(false);
  const closingByProp = useRef(false);
  // Avisa al Toaster que hay un modal abierto (retiene los avisos hasta cerrarlo).
  const counted = useRef(false);
  const markOpen = (isOpen) => {
    if (isOpen === counted.current) return;
    counted.current = isOpen;
    const st = useToastStore.getState();
    if (isOpen) st.modalOpened();
    else st.modalClosed();
  };

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      markOpen(true);
      setShown(true);
    } else if (!open && d.open) {
      closingByProp.current = true;
      d.close();
      markOpen(false);
      setShown(false);
    } else if (!open) {
      setShown(false);
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    // Escape / gesto atrás: dejamos que el padre decida (controlado por `open`).
    const onCancel = (e) => {
      e.preventDefault();
      onCloseRef.current?.();
    };
    // Si el navegador lo cerró por su cuenta (p. ej. Escape repetido), avisamos.
    const onNativeClose = () => {
      if (closingByProp.current) {
        closingByProp.current = false;
        return;
      }
      markOpen(false);
      setShown(false);
      onCloseRef.current?.();
    };
    let downOutside = false;
    const isOutside = (e) => e.target === d; // el <dialog> transparente = fuera de la tarjeta
    const onDown = (e) => {
      downOutside = isOutside(e);
    };
    const onUp = (e) => {
      if (downOutside && isOutside(e)) onCloseRef.current?.();
      downOutside = false;
    };
    d.addEventListener('cancel', onCancel);
    d.addEventListener('close', onNativeClose);
    d.addEventListener('pointerdown', onDown);
    d.addEventListener('pointerup', onUp);
    return () => {
      d.removeEventListener('cancel', onCancel);
      d.removeEventListener('close', onNativeClose);
      d.removeEventListener('pointerdown', onDown);
      d.removeEventListener('pointerup', onUp);
    };
  }, []);

  // Si el componente se desmonta abierto (p. ej. `{open && <Modal …/>}`), lo
  // cerramos ANTES de que React quite el <dialog> del DOM: cerrarlo así devuelve
  // el foco al botón que lo abrió (quitarlo abierto pierde ese foco).
  useLayoutEffect(
    () => () => {
      const d = ref.current;
      if (d?.open) {
        closingByProp.current = true;
        d.close();
      }
      markOpen(false);
    },
    []
  );

  const maxW = size === 'lg' ? 'sm:max-w-lg' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-md';

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Diálogo'}
      className="m-0 h-full max-h-none w-full max-w-none items-end justify-center overflow-hidden border-0 bg-transparent p-0 text-fg backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm open:flex sm:items-center"
    >
      {shown && (
        <div
          className={`flex max-h-[92dvh] w-full ${maxW} flex-col rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl animate-slide-up sm:animate-scale-in`}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 id={titleId} className="text-base font-bold text-fg">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => onCloseRef.current?.()}
                className="rounded-lg p-1 text-subtle transition hover:bg-surface2 hover:text-fg"
                aria-label="Cerrar"
              >
                <Icon name="x" size={20} />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
          {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
        </div>
      )}
    </dialog>,
    document.body
  );
}
