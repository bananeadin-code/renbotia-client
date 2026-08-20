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
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-600 text-white shadow-card hover:bg-brand-700 hover:shadow-elevated active:translate-y-px',
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

export function Card({ children, className = '' }) {
  return (
    <div className={clsx('rounded-xl border border-line bg-surface p-5 shadow-card', className)}>
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

export function Alert({ children, variant = 'info' }) {
  const variants = {
    info: { cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20', icon: 'message' },
    success: { cls: 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/20', icon: 'checkCircle' },
    error: { cls: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25', icon: 'alert' },
    warning: { cls: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25', icon: 'alert' },
  };
  const v = variants[variant] || variants.info;
  return (
    <div className={clsx('flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm', v.cls)}>
      <Icon name={v.icon} size={18} className="mt-px shrink-0" />
      <div>{children}</div>
    </div>
  );
}
