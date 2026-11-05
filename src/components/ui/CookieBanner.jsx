import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getConsent, setConsent } from '../../lib/consent.js';

/**
 * Aviso de cookies: aparece hasta que la persona decide. "Solo necesarias" deja
 * fuera la medición de campañas (Meta y Google); se puede cambiar después desde
 * "Preferencias de cookies" en el pie de página.
 */
export function CookieBanner() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => getConsent() === null);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('rb:consent-open', reopen);
    return () => window.removeEventListener('rb:consent-open', reopen);
  }, []);

  // Nunca dentro del chat incrustado en sitios de clientes.
  if (!open || pathname.startsWith('/w/')) return null;

  const choose = (ads) => {
    setConsent(ads);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl rounded-xl border border-line bg-surface p-4 shadow-pop sm:inset-x-4 sm:bottom-4 sm:flex sm:items-center sm:gap-4"
    >
      <p className="text-sm text-muted">
        Usamos cookies necesarias para que el sitio funcione y, si aceptas, cookies para medir nuestras campañas en Meta y
        Google. No vendemos tus datos.{' '}
        <Link to="/privacidad" className="font-medium text-brand-700 underline-offset-2 hover:underline dark:text-brand-300">
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
    </div>
  );
}
