import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

/**
 * Mosaico de ícono (estilo "Primeros pasos"): cuadro sólido con el ícono grande,
 * el texto como enlace y una flecha. El cuadro usa los colores invertidos del
 * tema (oscuro en claro, claro en oscuro) para destacar igual en ambos.
 */
export function IconTile({ icon, label, to, className = '' }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-4 rounded-xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${className}`}
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-fg text-canvas shadow-card transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-pop">
        <Icon name={icon} size={30} />
      </span>
      <span className="text-base font-semibold text-brand-700 group-hover:underline dark:text-brand-300 sm:text-lg">{label}</span>
      <Icon
        name="arrowRight"
        size={22}
        className="shrink-0 text-brand-700 transition-transform duration-200 group-hover:translate-x-1 dark:text-brand-300"
      />
    </Link>
  );
}
