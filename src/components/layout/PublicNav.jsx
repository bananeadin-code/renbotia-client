import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Button } from '../ui/index.jsx';
import { Logo } from '../ui/Logo.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { Icon } from '../ui/Icon.jsx';
import { GOOGLE_BUSINESS_URL } from '../../lib/seo.js';

const NAV_LINKS = [
  { to: '/soluciones', label: 'Soluciones' },
  { to: '/precios', label: 'Precios' },
  { to: '/blog', label: 'Blog' },
  { to: '/status', label: 'Estado' },
];

/**
 * Barra de navegación pública. En desktop los links van en línea; en móvil se
 * recogen en un menú (hamburguesa), y el toggle de tema queda en la esquina.
 */
export function PublicNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" aria-label="RenBotIA — inicio" onClick={close}>
          <Logo size={30} />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 sm:flex sm:gap-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm">Ir al panel</Button>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-fg"
              >
                Entrar
              </Link>
              <Link to="/registro">
                <Button size="sm">Crear cuenta</Button>
              </Link>
            </>
          )}
          <div className="ml-2 border-l border-line/70 pl-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Móvil: hamburguesa + toggle en la esquina */}
        <div className="flex items-center gap-1 sm:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-fg hover:bg-surface2"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            <Icon name={open ? 'x' : 'menu'} size={24} />
          </button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Panel del menú móvil */}
      {open && (
        <div className="border-t border-line bg-surface px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={close}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg hover:bg-surface2"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={close}>
                <Button className="w-full">Ir al panel</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={close}>
                  <Button variant="secondary" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link to="/registro" onClick={close}>
                  <Button className="w-full">Crear cuenta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size={26} />
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/soluciones" className="hover:text-fg">
              Soluciones
            </Link>
            <Link to="/precios" className="hover:text-fg">
              Precios
            </Link>
            <Link to="/blog" className="hover:text-fg">
              Blog
            </Link>
            <Link to="/registro" className="hover:text-fg">
              Crear cuenta
            </Link>
            <Link to="/status" className="hover:text-fg">
              Estado
            </Link>
            <Link to="/privacidad" className="hover:text-fg">
              Privacidad
            </Link>
            <Link to="/terminos" className="hover:text-fg">
              Términos
            </Link>
            {GOOGLE_BUSINESS_URL && (
              <a
                href={GOOGLE_BUSINESS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-fg"
              >
                Encuéntranos en Google
              </a>
            )}
          </nav>
          <span>© {new Date().getFullYear()} RenBotIA · Asistentes de WhatsApp con IA</span>
        </div>
      </div>
    </footer>
  );
}
