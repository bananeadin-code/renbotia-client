import { useState } from 'react';
import clsx from 'clsx';
import { Icon } from './Icon.jsx';

/**
 * Campo de contraseña con "ver al mantener presionado": mientras el usuario deja
 * presionado el ojito (mouse, touch o teclado), la contraseña se muestra en
 * claro; al soltar, vuelve a ocultarse. Mismo estilo que <Input>. No se usa en el
 * campo de "confirmar/repetir contraseña" (ahí no aporta).
 */
export function PasswordInput({ label, error, className = '', ...props }) {
  const [reveal, setReveal] = useState(false);
  const show = () => setReveal(true);
  const hide = () => setReveal(false);

  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-fg">{label}</span>}
      <div className="relative">
        <input
          type={reveal ? 'text' : 'password'}
          className={clsx(
            'w-full rounded-lg border bg-surface px-3 py-2.5 pr-11 text-sm text-fg outline-none transition placeholder:text-subtle',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30',
            error ? 'border-red-400' : 'border-line',
            className
          )}
          {...props}
        />
        <button
          type="button"
          aria-label="Mantén presionado para ver la contraseña"
          title="Mantén presionado para ver"
          aria-pressed={reveal}
          onMouseDown={show}
          onMouseUp={hide}
          onMouseLeave={hide}
          onTouchStart={(e) => {
            e.preventDefault(); // evita el menú contextual / selección en móvil
            show();
          }}
          onTouchEnd={hide}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              show();
            }
          }}
          onKeyUp={hide}
          onBlur={hide}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-subtle transition hover:text-fg"
        >
          <Icon name={reveal ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
