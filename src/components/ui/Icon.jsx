/**
 * Sistema de íconos SVG (estilo Lucide) — reemplaza emojis en toda la UI.
 * Fuente: skill ui-ux-pro-max › references/icon-system.md.
 * Sin dependencias externas; heredan color (currentColor) y tamaño por prop.
 */
const P = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const ICONS = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" {...P} />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" {...P} />
    </>
  ),
  bot: (
    <>
      <rect x="3" y="11" width="18" height="10" rx="2" {...P} />
      <path d="M12 7V5" {...P} />
      <circle cx="12" cy="4" r="1" {...P} />
      <path d="M8 16h.01M16 16h.01" {...P} />
    </>
  ),
  message: <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" {...P} />,
  academic: (
    <>
      <path d="M12 4 2 9l10 5 10-5-10-5z" {...P} />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" {...P} />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" {...P} />
      <path d="M2 10h20" {...P} />
    </>
  ),
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" {...P} />
      <circle cx="12" cy="7" r="4" {...P} />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...P} />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...P} />
      <path d="m16 17 5-5-5-5M21 12H9" {...P} />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" {...P} />,
  close: <path d="M18 6 6 18M6 6l12 12" {...P} />,
  send: (
    <>
      <path d="M22 2 11 13" {...P} />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" {...P} />
    </>
  ),
  zap: <path d="M13 2 4 14h7l-2 8 9-12h-7l2-8z" {...P} />,
  sliders: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" {...P} />
      <path d="M2 14h4M10 8h4M18 16h4" {...P} />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" {...P} />
      <path d="M7 15v3M12 9v9M17 5v13" {...P} />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" {...P} />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" {...P} />
      <path d="m8.5 12 2.5 2.5 4.5-5" {...P} />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" {...P} />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...P} />
      <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" {...P} />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" {...P} />,
  chevronRight: <path d="m9 6 6 6-6 6" {...P} />,
  alert: (
    <>
      <path d="M12 3 2 20h20L12 3z" {...P} />
      <path d="M12 10v4M12 18h.01" {...P} />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" {...P} />
      <circle cx="18" cy="20" r="1.5" {...P} />
      <path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6" {...P} />
    </>
  ),
  sparkles: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" {...P} />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" {...P} />
      <path d="M12 7v5l3 2" {...P} />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" {...P} />
      <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-3a2 2 0 0 1 4 0v3" {...P} />
    </>
  ),
  spinner: <path d="M21 12a9 9 0 1 1-6.2-8.6" {...P} />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" {...P} />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...P} />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" {...P} />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" {...P} />
      <path d="M8 20h8M12 16v4" {...P} />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...P} />
      <path d="m9 12 2 2 4-4" {...P} />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" {...P} />
      <path d="M3 9h18M8 3v3M16 3v3" {...P} />
    </>
  ),
  calendarCheck: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" {...P} />
      <path d="M3 9h18M8 3v3M16 3v3M9 15l2 2 4-4" {...P} />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" {...P} />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" {...P} />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-3-4.9" {...P} />
    </>
  ),
  phone: (
    <path
      d="M4 4h3l2 5-2.5 1.5a12 12 0 0 0 5.5 5.5L15 15l5 2v3a1.5 1.5 0 0 1-1.6 1.5A17 17 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"
      {...P}
    />
  ),
  edit: (
    <>
      <path d="M12 20h9" {...P} />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" {...P} />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" {...P} />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 12h6M9 16h4" {...P} />
    </>
  ),
  inbox: (
    <>
      <path d="M3 12h5l1.5 3h5L16 12h5" {...P} />
      <path d="M5 5h14l2 7v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6l2-7z" {...P} />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l8 8-9 9-8-8z" {...P} />
      <circle cx="7.5" cy="7.5" r="1.2" {...P} />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" {...P} />
      <path d="M5.6 5.6l12.8 12.8" {...P} />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" {...P} />,
};

export function Icon({ name, size = 20, className = '', title, ...rest }) {
  const inner = ICONS[name];
  if (!inner) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      {...rest}
    >
      {inner}
    </svg>
  );
}
