/**
 * Marca de RenBotIA: un glifo (burbuja de chat con destello) + wordmark.
 * Reemplaza el wordmark plano de texto por una identidad más sólida.
 */
export function LogoMark({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8.5" fill="url(#bf-grad)" />
      {/* Brillo superior sutil para dar profundidad (acabado "app icon") */}
      <rect width="32" height="32" rx="8.5" fill="url(#bf-gloss)" />
      {/* Burbuja de chat */}
      <path
        d="M9 11.5A2.5 2.5 0 0 1 11.5 9h9A2.5 2.5 0 0 1 23 11.5v5a2.5 2.5 0 0 1-2.5 2.5H14l-3.6 3v-3h-.4A2.5 2.5 0 0 1 9 16.5z"
        fill="white"
        fillOpacity="0.96"
      />
      {/* Destello de IA centrado en la burbuja */}
      <path
        d="M16 9.6c.4 2.6 1.8 4 4.4 4.4-2.6.4-4 1.8-4.4 4.4-.4-2.6-1.8-4-4.4-4.4 2.6-.4 4-1.8 4.4-4.4Z"
        fill="url(#bf-spark)"
      />
      <defs>
        <linearGradient id="bf-grad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#12a97f" />
          <stop offset="1" stopColor="#0c6f55" />
        </linearGradient>
        <linearGradient id="bf-gloss" x1="16" y1="0" x2="16" y2="20">
          <stop stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bf-spark" x1="12" y1="10" x2="20" y2="18">
          <stop stopColor="#10a074" />
          <stop offset="1" stopColor="#0b6d52" />
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
