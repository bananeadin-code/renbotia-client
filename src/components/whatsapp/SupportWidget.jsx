import { useState, useEffect } from 'react';
import { DemoChat } from './DemoChat.jsx';
import { siteAssistantApi } from '../../api/endpoints.js';
import { Icon } from '../ui/Icon.jsx';

/**
 * Widget flotante de las páginas públicas: es el ASISTENTE DEL SITIO (soporte +
 * guía + prueba viva del producto), configurable por el admin desde el panel.
 * Distinto del demo de la landing (bot de ejemplo fijo). Reutiliza DemoChat con
 * la configuración del asistente del sitio.
 */
const SITE_CTA = { text: '¿Te ayudo a elegir un plan?', to: '/precios', label: 'Ver planes' };

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    siteAssistantApi
      .getConfig()
      .then(setCfg)
      .catch(() => setCfg({ enabled: false }));
  }, []);

  // Sin config cargada o deshabilitado por el admin: no se muestra el widget.
  if (!cfg || !cfg.enabled) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-40 w-[min(92vw,380px)] animate-fade-up sm:right-6">
          <DemoChat
            heightClass="h-[52vh] max-h-[440px]"
            botName={cfg.botName}
            welcome={cfg.welcomeMessage}
            starters={cfg.quickReplies || []}
            sendFn={siteAssistantApi.send}
            cta={SITE_CTA}
          />
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-pop transition hover:bg-brand-700 sm:right-6"
        aria-label={open ? 'Cerrar chat' : 'Abrir asistente'}
        aria-expanded={open}
      >
        <Icon name={open ? 'x' : 'message'} size={24} />
      </button>
    </>
  );
}
