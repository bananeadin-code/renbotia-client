import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo.jsx';
import { Icon } from '../ui/Icon.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';

const BENEFITS = [
  { icon: 'bot', text: 'Entrenado con la información de tu negocio' },
  { icon: 'clock', text: 'Responde a tus clientes 24/7, sin esperas' },
  { icon: 'calendarCheck', text: 'Agenda citas y capta clientes solo' },
  { icon: 'message', text: 'Pruébalo en un simulador antes de conectarlo' },
];

/**
 * Layout de autenticación tipo SaaS premium (split-screen): panel de marca a la
 * izquierda (solo desktop) con rejilla + glow y propuesta de valor; formulario a
 * la derecha. En móvil se muestra solo el formulario (con el logo arriba).
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {React.ReactNode} props.children  Formulario + acciones.
 * @param {React.ReactNode} [props.footer]  Nota bajo la tarjeta (links, demo…).
 */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Panel de marca (desktop) */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:w-[55%]">
        <div aria-hidden="true" className="panel-grid pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl"
        />
        <div className="relative">
          <Link to="/" aria-label="RenBotIA — inicio">
            <Logo size={32} textClass="text-white" />
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight text-white xl:text-4xl">
            Tu asistente de WhatsApp con IA, listo en minutos.
          </h2>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-brand-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-inset ring-white/20">
                  <Icon name={b.icon} size={18} />
                </span>
                <span className="text-sm font-medium">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-100/80">
          © {new Date().getFullYear()} RenBotIA · Asistentes de WhatsApp con IA
        </p>
      </aside>

      {/* Formulario */}
      <main className="relative flex w-full flex-col justify-center px-4 py-10 sm:px-8 lg:w-1/2 xl:w-[45%]">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="mb-8 flex justify-center lg:hidden"
            aria-label="RenBotIA — inicio"
          >
            <Logo size={32} />
          </Link>
          <h1 className="text-2xl font-bold text-fg">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer}
        </div>
      </main>
    </div>
  );
}
