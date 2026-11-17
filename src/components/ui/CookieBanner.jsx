import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getConsent, setConsent } from '../../lib/consent.js';

/**
 * Aviso de cookies: aparece hasta que la persona decide. "Solo necesarias" deja
 * fuera la medición de campañas (Meta y Google); se puede cambiar después desde
 * "Preferencias de cookies" en el pie de página.
 *
 * Es un diálogo NO modal (la página sigue usable): <dialog popover="manual">
 * en la capa superior del navegador, por encima de menús y modales sin pelear
 * con z-index, y que no se cierra al tocar otra parte. Sin soporte de Popover
 * se abre con dialog.show() (mismo aspecto, con z-index).
 */
export function CookieBanner() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => getConsent() === null);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('rb:consent-open', reopen);
    return () => window.removeEventListener('rb:consent-open', reopen);
  }, []);

  const ref = useRef(null);
  const visible = open && !pathname.startsWith('/w/'); // nunca en el chat incrustado
  useEffect(() => {
    const d = ref.current;
    if (!visible || !d) return undefined;
    const prev = document.activeElement;
    if (typeof d.showPopover === 'function') d.showPopover();
    else d.show();
    // Un <dialog> enfoca su primer control al abrirse; el aviso no debe robarle
    // el foco a la página al cargar (sigue alcanzable con Tab).
    if (d.contains(document.activeElement)) {
      if (prev && prev !== document.body && prev.isConnected) prev.focus({ preventScroll: true });
      else document.activeElement.blur();
    }
    return () => {
      if (typeof d.hidePopover === 'function' && d.matches(':popover-open')) d.hidePopover();
      else if (d.open) d.close();
    };
  }, [visible]);

  if (!visible) return null;

  const choose = (ads) => {
    setConsent(ads);
    setOpen(false);
  };

  return (
    <dialog
      ref={ref}
      popover="manual"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-3 bottom-3 top-auto z-[80] mx-auto h-auto w-auto max-w-3xl rounded-xl border border-line bg-surface p-4 text-fg shadow-pop sm:inset-x-4 sm:bottom-4 sm:items-center sm:gap-4 sm:open:flex sm:[&:popover-open]:flex"
    >
      <p className="text-sm text-muted">
        Usamos cookies necesarias para que el sitio funcione y, si aceptas, cookies para medir nuestras campañas en Meta y
        Google. No vendemos tus datos.{' '}
        <Link to="/privacidad" className="font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-400">
          Aviso de privacidad
        </Link>
      </p>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <button
          type="button"
          onClick={() => choose(false)}
          className="min-h-[40px] flex-1 rounded-lg border border-line px-3 text-sm font-medium text-fg transition hover:bg-surface2 sm:flex-none"
        >
          Solo necesarias
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          className="min-h-[40px] flex-1 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-800 sm:flex-none"
        >
          Aceptar
        </button>
      </div>
    </dialog>
  );
}
