import { Link } from 'react-router-dom';
import { Button } from '../ui/index.jsx';

/**
 * CTA fijo en la parte inferior, solo en móvil. Mantiene la acción principal
 * siempre a la vista mientras el usuario hace scroll (mejora la conversión).
 * Incluye un espaciador para que el contenido no quede tapado por la barra.
 */
export function StickyMobileCTA() {
  return (
    <>
      <div className="h-16 sm:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:hidden">
        <Link to="/registro" aria-label="Empezar gratis">
          <Button size="lg" className="shine-cta w-full">
            Empezar gratis
          </Button>
        </Link>
      </div>
    </>
  );
}
