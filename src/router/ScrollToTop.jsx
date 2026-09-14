import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lleva la vista al inicio al cambiar de ruta.
 *
 * React Router NO resetea el scroll por sí solo (a diferencia de una recarga
 * real del navegador): al navegar entre páginas (blog, soluciones, precios…) la
 * posición previa se conservaba y el usuario aterrizaba, por ejemplo, en el
 * footer. Este componente reproduce el comportamiento esperado de "cada página
 * empieza arriba".
 *
 * Respeta los enlaces con ancla (#seccion): si la URL trae hash, dejamos que el
 * navegador salte al elemento correspondiente en vez de forzar el tope.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return; // hay ancla → el navegador la resuelve
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
