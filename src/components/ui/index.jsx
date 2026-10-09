/**
 * Componentes UI reutilizables (mobile-first) usados en toda la app.
 * Consumen tokens del design system (skill ui-ux-pro-max).
 */
import { clsx } from './clsx.js';
import { Icon } from './Icon.jsx';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  // Emil: transiciones con propiedades EXPLÍCITAS (no `all`), curva fuerte, y
  // feedback de presión (scale 0.97) para que el botón se sienta físico.
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-[transform,background-color,box-shadow,color,opacity] duration-150 ease-out-strong active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:
      'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-card hover:from-brand-500 hover:to-brand-700 hover:shadow-elevated [@media(hover:hover)]:hover:-translate-y-px',
    secondary: 'bg-surface text-fg border border-line shadow-card hover:bg-surface2',
    ghost: 'text-muted hover:bg-surface2 hover:text-fg',
    danger: 'bg-red-600 text-white shadow-card hover:bg-red-700',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-fg">{label}</span>}
      <input
        className={clsx(
          'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-fg outline-none transition placeholder:text-subtle',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30',
          error ? 'border-red-400' : 'border-line',
          className
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-fg">{label}</span>}
      <textarea
        className={clsx(
          'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-fg outline-none transition placeholder:text-subtle',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30',
          error ? 'border-red-400' : 'border-line',
          className
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-fg">{label}</span>}
      <select
        className={clsx(
          'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg outline-none',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Card({ children, className = '', ...rest }) {
  return (
    <div {...rest} className={clsx('glass rounded-2xl p-5', className)}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-surface2 text-muted',
    green: 'bg-brand-500/15 text-brand-700 dark:text-brand-300',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    red: 'bg-red-500/15 text-red-700 dark:text-red-300',
  };
  return (
    <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', colors[color])}>
      {children}
    </span>
  );
}

export function Spinner({ className = '', size = 20 }) {
  return (
    <Icon
      name="spinner"
      size={size}
      className={clsx('animate-spin', className)}
      role="status"
      aria-label="Cargando"
    />
  );
}

// Avisos, advertencias y sugerencias: fondo SÓLIDO (sin transparencias ni
// cristal), barra de color a la izquierda según el tipo y texto principal
// legible. Sin borde completo, sombra ni hover: es una nota, no un botón.
const NOTE_VARIANTS = {
  info: { bar: 'border-l-blue-500', icon: 'message', iconCls: 'text-blue-500' },
  tip: { bar: 'border-l-brand-500', icon: 'sparkles', iconCls: 'text-brand-500' },
  success: { bar: 'border-l-brand-500', icon: 'checkCircle', iconCls: 'text-brand-500' },
  warning: { bar: 'border-l-amber-500', icon: 'alert', iconCls: 'text-amber-500' },
  error: { bar: 'border-l-red-500', icon: 'alert', iconCls: 'text-red-500' },
  security: { bar: 'border-l-brand-500', icon: 'shield', iconCls: 'text-brand-500' },
};

/** Nota destacada (aviso, advertencia o sugerencia). */
export function Notice({ children, variant = 'info', className = '' }) {
  const v = NOTE_VARIANTS[variant] || NOTE_VARIANTS.info;
  return (
    <div
      role="note"
      className={clsx(
        'flex items-start gap-3 rounded-md border-l-[3px] bg-surface2 px-4 py-3 text-sm leading-relaxed text-fg',
        v.bar,
        className
      )}
    >
      <Icon name={v.icon} size={18} className={clsx('mt-0.5 shrink-0', v.iconCls)} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Mensaje de estado (error, éxito, advertencia, información): mismo estilo que Notice. */
export function Alert({ children, variant = 'info' }) {
  return (
    <div role={variant === 'error' ? 'alert' : 'status'}>
      <Notice variant={variant}>{children}</Notice>
    </div>
  );
}

export { PasswordInput } from './PasswordInput.jsx';
