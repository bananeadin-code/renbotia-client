/**
 * Borde con "haz de luz" animado que recorre el contorno (inspirado en la
 * sección Borders de 21st.dev — border-beam). Adaptado a nuestra paleta.
 *
 * Uso: envuelve el contenido; el hijo debe tener fondo sólido y su propio
 * border-radius (~1rem) para tapar el centro y dejar ver solo el anillo.
 *
 *   <BorderBeam>
 *     <div className="rounded-xl bg-white ...">...</div>
 *   </BorderBeam>
 */
export function BorderBeam({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="beam-ring" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
