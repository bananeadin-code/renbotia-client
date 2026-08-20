import { useRef } from 'react';

/**
 * Tarjeta con brillo que sigue el cursor (estilo Vercel/Linear, inspirado en el
 * "Glowing Effect" de 21st.dev). El borde y un halo suave se iluminan bajo el
 * puntero. Self-contained: solo actualiza las variables CSS --mx/--my; el efecto
 * vive en `.spotlight-card` (styles/index.css). Respeta prefers-reduced-motion
 * (el hover sigue siendo estático, sin animación).
 *
 * @param {object} props
 * @param {string} [props.className]  Clases extra (spans del bento, padding, etc.).
 * @param {React.ReactNode} props.children
 */
export function SpotlightCard({ className = '', children, ...rest }) {
  const ref = useRef(null);

  function handleMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`spotlight-card rounded-2xl border border-line bg-surface shadow-card transition-colors ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
