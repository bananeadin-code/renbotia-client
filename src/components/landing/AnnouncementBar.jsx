import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';

/**
 * Barra de anuncio delgada sobre la nav (inspirado en la sección Announcements
 * de 21st.dev). Comunica una novedad y lleva al registro.
 */
export function AnnouncementBar() {
  return (
    <Link
      to="/registro"
      className="group block bg-ink-900 text-white transition hover:bg-ink-700"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold">
          <Icon name="sparkles" size={13} />
          Nuevo
        </span>
        <span className="text-white/90">
          Entrena tu bot y pruébalo gratis en el simulador de WhatsApp
        </span>
        <Icon
          name="arrowRight"
          size={15}
          className="text-white/70 transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}
