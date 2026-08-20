import { useState } from 'react';
import { DemoChat } from './DemoChat.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Widget flotante de "soporte" para las páginas públicas: es el propio bot de la
 * demo respondiendo dudas 24/7. La mejor demostración posible = usar el producto
 * como soporte del sitio. Reutiliza DemoChat.
 */
export function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-40 w-[min(92vw,380px)] animate-fade-up sm:right-6">
          <DemoChat heightClass="h-[52vh] max-h-[440px]" />
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-pop transition hover:bg-brand-700 sm:right-6"
        aria-label={open ? 'Cerrar chat' : 'Probar el bot'}
        aria-expanded={open}
      >
        <Icon name={open ? 'x' : 'message'} size={24} />
      </button>
    </>
  );
}
