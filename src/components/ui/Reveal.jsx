import { useEffect, useRef, useState } from 'react';

/**
 * Revela su contenido al entrar en el viewport (fade + subida sutil), una sola
 * vez. Usa IntersectionObserver — ligero y natural al hacer scroll.
 *
 * Props:
 *  - as: etiqueta a renderizar ('div' por defecto; puede ser 'section', etc.)
 *  - delay: retraso en ms para escalonar (stagger) elementos de una grilla.
 *
 * Respeta prefers-reduced-motion: si está activo, muestra todo de inmediato.
 */
export function Reveal({ children, className = '', delay = 0, as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-all duration-700 ease-out will-change-transform ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
