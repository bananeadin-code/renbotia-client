import { useEffect, useId, useState } from 'react';
import { clsx } from './clsx.js';

const MESSAGES = ['Cargando…', 'Preparando tu información…', 'Casi listo…'];

/**
 * Carga con la marca: la burbuja de RenBotIA flota, el destello de IA titila,
 * un anillo late y unos puntos "escriben" como el bot. Con texto que rota para
 * que la espera se sienta viva. Respeta "reducir movimiento" del sistema.
 */
export function BotLoader({ size = 52, label, messages = MESSAGES, showText = true, className = '' }) {
  const gid = useId();
  const grad = `rbl-${gid}`;
  const [i, setI] = useState(0);
  const rotating = showText && !label && messages.length > 1;
  useEffect(() => {
    if (!rotating) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 2400);
    return () => clearInterval(t);
  }, [rotating, messages.length]);

  return (
    <div role="status" aria-live="polite" className={clsx('inline-flex flex-col items-center gap-3', className)}>
      <span className="relative inline-flex items-center justify-center" style={{ width: size * 1.6, height: size * 1.6 }}>
        <span className="rb-loader-ring absolute rounded-xl border-2 border-brand-500/50" style={{ width: size, height: size }} />
        <span className="rb-loader-ring rb-loader-ring-late absolute rounded-xl border-2 border-brand-500/40" style={{ width: size, height: size }} />
        <svg width={size} height={size} viewBox="0 0 32 32" className="rb-loader-float relative" aria-hidden="true">
          <g fill={`url(#${grad})`}>
            <circle cx="17" cy="14.8" r="10.8" />
            <path d="M11 19.5C8.6 23 7.7 26 8.2 27.8C10.8 26.2 13.2 24.8 15.2 23.2Z" />
          </g>
          <path
            className="rb-loader-twinkle"
            d="M17 7.4C17.6 12.3 19.6 14.3 24.5 14.9C19.6 15.5 17.6 17.5 17 22.4C16.4 17.5 14.4 15.5 9.5 14.9C14.4 14.3 16.4 12.3 17 7.4Z"
            fill="#fbfaf5"
          />
          <defs>
            <linearGradient id={grad} x1="7" y1="5" x2="27" y2="27" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22b98a" />
              <stop offset="1" stopColor="#0a6b4f" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      {showText && (
        <span className="flex items-center gap-2 text-sm text-muted">
          <Dots className="text-brand-500" />
          <span key={label || i} className={rotating ? 'rb-loader-msg' : undefined}>
            {label || messages[i]}
          </span>
        </span>
      )}
      {!showText && <span className="sr-only">Cargando</span>}
    </div>
  );
}

/** Tres puntos que "escriben" (para botones y espacios chicos). Usan el color del texto. */
export function Dots({ className = '', label = 'Cargando' }) {
  return (
    <span role="status" aria-label={label} className={clsx('inline-flex items-center gap-[3px] align-middle', className)}>
      <span className="rb-dot h-1.5 w-1.5 rounded-[2px] bg-current" />
      <span className="rb-dot h-1.5 w-1.5 rounded-[2px] bg-current" />
      <span className="rb-dot h-1.5 w-1.5 rounded-[2px] bg-current" />
    </span>
  );
}
