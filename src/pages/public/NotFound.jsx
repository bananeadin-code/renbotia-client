import { Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { Button } from '../../components/ui/index.jsx';
import { useSeo } from '../../lib/seo.js';

/**
 * Página 404 personalizada: en vez de redirigir en silencio, muestra un mensaje
 * claro y enlaces útiles (mejor experiencia y enlazado interno). Marcada noindex.
 */
export default function NotFound() {
  useSeo({
    title: 'Página no encontrada (404) | RenBotIA',
    description: 'La página que buscas no existe o cambió de dirección.',
    path: '/404',
    noindex: true,
  });

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PublicNav />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg text-center">
          <p className="text-6xl font-extrabold tracking-tight text-brand-600">404</p>
          <h1 className="mt-3 text-2xl font-bold text-fg">Esta página no existe</h1>
          <p className="mt-2 text-muted">
            Puede que el enlace esté roto o que la página se haya movido. Te dejamos por dónde
            seguir:
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto">
                Ir al inicio
              </Button>
            </Link>
            <Link to="/precios">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Ver precios
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
            <Link to="/soluciones" className="hover:text-fg">
              Soluciones
            </Link>
            <Link to="/blog" className="hover:text-fg">
              Blog
            </Link>
            <Link to="/registro" className="hover:text-fg">
              Crear cuenta
            </Link>
            <Link to="/status" className="hover:text-fg">
              Estado del servicio
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
