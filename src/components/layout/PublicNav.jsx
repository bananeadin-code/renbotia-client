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
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" aria-label="RenBotIA — inicio" onClick={close}>
          <Logo size={40} />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 sm:flex sm:gap-2">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-muted transition-colors hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button>Ir al panel</Button>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-2 text-[15px] font-medium text-muted transition-colors hover:text-fg"
              >
                Entrar
              </Link>
              <Link to="/registro">
                <Button>Crear cuenta</Button>
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

// Secciones del footer, agrupadas por tema para que sea fácil de escanear.
const FOOTER_SECTIONS = [
  {
    title: 'Producto',
    links: [
      { to: '/soluciones', label: 'Soluciones' },
      { to: '/precios', label: 'Precios' },
      { to: '/blog', label: 'Blog' },
      { to: '/registro', label: 'Crear cuenta' },
    ],
  },
  {
    title: 'Soporte',
    links: [
      { to: '/contacto', label: 'Contacto' },
      { to: '/status', label: 'Estado del servicio' },
      ...(GOOGLE_BUSINESS_URL
        ? [{ href: GOOGLE_BUSINESS_URL, label: 'Encuéntranos en Google', external: true }]
        : []),
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacidad', label: 'Privacidad' },
      { to: '/terminos', label: 'Términos' },
      { to: '/eliminar-datos', label: 'Eliminar datos' },
    ],
  },
];

function FooterLink({ link }) {
  const cls = 'text-sm text-muted transition hover:text-fg';
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.to} className={cls}>
      {link.label}
    </Link>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Marca */}
          <div className="max-w-xs">
            <Logo size={30} />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Asistentes de WhatsApp con IA para profesionistas y negocios de México. Atienden,
              agendan y captan clientes las 24 horas.
            </p>
            <Link
              to="/registro"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:gap-2.5 dark:text-brand-400"
            >
              Crea tu bot gratis
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          {/* Columnas por sección */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Barra inferior */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} RenBotIA · Asistentes de WhatsApp con IA</span>
        </div>
      </div>
    </footer>
  );
}
