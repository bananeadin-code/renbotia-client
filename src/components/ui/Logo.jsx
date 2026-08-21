import { useId } from 'react';

/**
 * Marca de RenBotIA: un glifo (burbuja de chat con destello) + wordmark.
 * Reemplaza el wordmark plano de texto por una identidad más sólida.
 */
export function LogoMark({ size = 32, className = '' }) {
  // Id único por instancia: evita que dos logos en la misma página compartan el
  // mismo id de degradado (lo que rompía el relleno y dejaba solo el destello).
  const gid = useId();
  const grad = `bf-grad-${gid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      {/* Burbuja de chat (círculo + cola inferior izquierda), degradado esmeralda.
          Fondo transparente → se ve limpia en tema claro y oscuro. */}
      <g fill={`url(#${grad})`}>
        <circle cx="17" cy="14.8" r="10.8" />
        <path d="M11 19.5C8.6 23 7.7 26 8.2 27.8C10.8 26.2 13.2 24.8 15.2 23.2Z" />
      </g>
      {/* Destello de IA (estrella cóncava de 4 puntas) centrado en la burbuja */}
      <path
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
  );
}

export function Logo({ size = 30, className = '', textClass = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className={`text-lg font-extrabold tracking-tight text-fg ${textClass}`}>
        RenBotIA
      </span>
    </span>
  );
}
