/**
 * Fondo "aurora" sutil (blobs emerald/teal difuminados y animados) para el hero.
 * Inspirado en la sección Backgrounds de 21st.dev, adaptado a nuestro tema claro
 * y paleta de marca. Decorativo: aria-hidden y pointer-events-none.
 */
export function AuroraBackground({ className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="aurora-blob bg-brand-300"
        style={{ width: 420, height: 420, top: -120, left: -80 }}
      />
      <div
        className="aurora-blob bg-brand-200"
        style={{ width: 380, height: 380, top: -60, right: -60, animationDelay: '3s' }}
      />
      <div
        className="aurora-blob bg-emerald-100"
        style={{ width: 460, height: 460, bottom: -220, left: '35%', animationDelay: '6s' }}
      />
    </div>
  );
}
