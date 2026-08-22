import { useState, useEffect } from 'react';
import { RenChat } from './RenChat.jsx';
import { siteAssistantApi } from '../../api/endpoints.js';
import { LogoMark } from '../ui/Logo.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * "Ren": el asistente del sitio con presencia propia. No es un chat genérico —
 * tiene launcher animado, un teaser de invitación (una vez por sesión) y un modal
 * con su identidad (cabecera de marca, avatar y estatus). Configurable por el admin
 * (endpoint /site-assistant). Distinto del demo de la landing.
 *
 * @param {{ mobileRaised?: boolean }} props  Eleva el launcher en móvil cuando la
 *   página tiene una barra CTA fija abajo (la landing), para que no choquen.
 */
const SITE_CTA = { text: '¿Te ayudo a elegir un plan?', to: '/precios', label: 'Ver planes' };

/** Chispa (identidad IA de Ren) en blanco, para el launcher sobre fondo verde. */
function RenSpark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M17 7.4C17.6 12.3 19.6 14.3 24.5 14.9C19.6 15.5 17.6 17.5 17 22.4C16.4 17.5 14.4 15.5 9.5 14.9C14.4 14.3 16.4 12.3 17 7.4Z"
        fill="#fff"
      />
    </svg>
  );
}

export function SupportWidget({ mobileRaised = false }) {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [teaser, setTeaser] = useState(false);

  useEffect(() => {
    siteAssistantApi
      .getConfig()
      .then(setCfg)
      .catch(() => setCfg({ enabled: false }));
  }, []);

  // El teaser aparece una vez por sesión, tras unos segundos, si no se abrió/descartó.
  useEffect(() => {
    if (!cfg?.enabled) return undefined;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem('ren:teaser') === 'off';
    } catch {
      /* noop */
    }
    if (dismissed) return undefined;
    const t = setTimeout(() => setTeaser(true), 4500);
    return () => clearTimeout(t);
  }, [cfg]);

  function dismissTeaser() {
    setTeaser(false);
    try {
      sessionStorage.setItem('ren:teaser', 'off');
    } catch {
      /* noop */
    }
  }
  function openChat() {
    setOpen(true);
    dismissTeaser();
  }

  if (!cfg || !cfg.enabled) return null;
  const name = cfg.botName || 'Ren';

  const fabPos = mobileRaised ? 'bottom-24 sm:bottom-5' : 'bottom-5';
  const panelPos = mobileRaised ? 'bottom-40 sm:bottom-24' : 'bottom-24';
  // Altura del panel según el offset inferior, para que SIEMPRE quepa en pantalla
  // (móvil elevado deja más espacio abajo). Guion bajo = espacio dentro de calc().
  const panelHeight = mobileRaised
    ? 'h-[min(560px,calc(100dvh_-_11rem))] sm:h-[min(560px,calc(100dvh_-_7rem))]'
    : 'h-[min(560px,calc(100dvh_-_7rem))]';

  return (
    <>
      {/* Panel del asistente + fondo oscurecido en móvil (para que no se confunda
          con el sitio). En escritorio flota en la esquina sin scrim. */}
      {open && (
        <>
          <button
            aria-label="Cerrar asistente"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          />
          <div className={`ren-pop-in fixed right-4 z-50 w-[min(94vw,400px)] sm:right-6 ${panelPos}`}>
            <RenChat
              name={name}
              welcome={cfg.welcomeMessage}
              starters={cfg.quickReplies || []}
              sendFn={siteAssistantApi.send}
              cta={SITE_CTA}
              onClose={() => setOpen(false)}
              heightClass={panelHeight}
            />
          </div>
        </>
      )}

      {/* Teaser tipo anuncio (una vez por sesión) */}
      {!open && teaser && (
        <div className={`ren-pop-in fixed right-4 z-50 w-[min(90vw,320px)] sm:right-6 ${panelPos}`}>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 to-brand-700" />
            <button
              onClick={dismissTeaser}
              aria-label="Cerrar aviso"
              className="absolute right-2 top-2.5 rounded-md p-1 text-subtle transition hover:bg-surface2 hover:text-fg"
            >
              <Icon name="x" size={16} />
            </button>
            <div className="flex items-start gap-3 p-4 pr-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/10">
                <LogoMark size={28} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-fg">Hola, soy {name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  Tu guía en RenBotIA. Te ayudo a resolver dudas y a elegir el plan ideal.
                </p>
                <button
                  onClick={openChat}
                  className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
                >
                  Conversar con {name}
                  <Icon name="arrowRight" size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launcher (FAB) con presencia */}
      <div className={`fixed right-4 z-50 sm:right-6 ${fabPos}`}>
        <div className="ren-ring">
          <button
            onClick={() => (open ? setOpen(false) : openChat())}
            aria-label={open ? `Cerrar a ${name}` : `Abrir a ${name}, tu asistente`}
            aria-expanded={open}
            className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-pop ring-2 ring-white/25 transition hover:scale-105"
          >
            {open ? (
              <Icon name="x" size={24} />
            ) : (
              <span className="ren-bob flex">
                <RenSpark size={26} />
              </span>
            )}
          </button>
          {!open && (
            <span className="absolute right-0 top-0 z-20 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-canvas" />
          )}
        </div>
      </div>
    </>
  );
}
