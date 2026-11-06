import { useEffect } from 'react';

/**
 * Lleva la pantalla a un elemento que acaba de aparecer (sección desplegada,
 * formulario, resultado o aviso), para que el usuario no tenga que buscarlo.
 *  - Solo se mueve si hace falta: si el inicio del elemento ya está a la vista
 *    con espacio suficiente, no hace nada (evita saltos innecesarios).
 *  - Deja margen arriba para la barra fija del panel en móvil.
 *  - Respeta "reducir movimiento" del sistema (salta sin animación).
 */
export function revealInView(el, { offset = 80, minVisible = 140 } = {}) {
  if (!el || typeof window === 'undefined') return;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  // Ya visible: empieza debajo del margen y queda al menos `minVisible` px a la vista.
  const visibleEnough = r.top >= offset && r.top <= vh - Math.min(minVisible, r.height);
  if (visibleEnough) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: Math.max(0, window.scrollY + r.top - offset), behavior: reduce ? 'auto' : 'smooth' });
}

/**
 * Hook: cuando `active` pasa a verdadero (o cambia de valor), lleva la pantalla al
 * elemento de `ref`. Espera a que el contenido se pinte antes de medir.
 */
export function useRevealOnChange(active, ref, opts) {
  useEffect(() => {
    if (!active) return undefined;
    const id = setTimeout(() => revealInView(ref.current, opts), 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
