import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { referralApi } from '../../api/endpoints.js';

/**
 * Barra de anuncio delgada sobre la nav. Anuncia el regalo de referidos:
 *  - Sin sesión: "crea tu cuenta e invita a 3 negocios" → registro.
 *  - Con sesión y sin reclamar el regalo: lleva a su enlace en el panel.
 *  - Con el regalo ya reclamado: vuelve al anuncio general del producto.
 */
export function AnnouncementBar() {
  const { isAuthenticated, loading } = useAuthStore();
  const [claimed, setClaimed] = useState(null);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    referralApi
      .get()
      .then((r) => setClaimed(Boolean(r?.claimed)))
      .catch(() => setClaimed(null));
  }, [isAuthenticated, loading]);

  const showGift = !isAuthenticated || claimed === false;
  const to = isAuthenticated ? '/dashboard#invita' : '/registro';
  const text = !showGift
    ? 'Entrena tu bot con tus chats de WhatsApp y pruébalo con tu propio negocio'
    : isAuthenticated
      ? 'Invita a 3 negocios con tu enlace y gana 1 mes de Pro gratis'
      : 'Crea tu cuenta gratis, invita a 3 negocios y gana 1 mes de Pro';

  return (
    <Link to={showGift ? to : '/#pruebalo'} className="group block bg-ink-900 text-white transition hover:bg-ink-700">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-sm">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold">
          <Icon name={showGift ? 'gift' : 'sparkles'} size={13} />
          {showGift ? 'Regalo' : 'Nuevo'}
        </span>
        <span className="text-white/90">{text}</span>
        <Icon name="arrowRight" size={15} className="shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
