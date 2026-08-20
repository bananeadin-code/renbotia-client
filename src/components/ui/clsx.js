/**
 * Mini utilidad para concatenar clases condicionales (evita una dependencia).
 */
export function clsx(...args) {
  return args.filter(Boolean).join(' ');
}
