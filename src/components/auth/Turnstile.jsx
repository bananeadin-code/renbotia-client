import { useEffect, useRef, useState } from 'react';
import { authApi } from '../../api/endpoints.js';

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise = null;
let configPromise = null;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('turnstile'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Cloudflare Turnstile: confirma que es una persona sin hacerle resolver nada
 * (solo aparece si Cloudflare tiene dudas). Inactivo si el servidor no lo tiene
 * configurado; entonces `onToken('')` y el formulario sigue igual que siempre.
 * Avisa con onReady(required) si hace falta el token para enviar.
 */
export function Turnstile({ onToken, onReady }) {
  const box = useRef(null);
  const widget = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    configPromise = configPromise || authApi.config().catch(() => ({}));
    configPromise.then(async (cfg) => {
      const key = cfg?.turnstileSiteKey;
      onReady?.(Boolean(key));
      if (!key || !alive) return;
      try {
        await loadScript();
        if (!alive || !box.current) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: key,
          appearance: 'interaction-only',
          language: 'es',
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          callback: (t) => onToken(t),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        });
      } catch {
        if (alive) setFailed(true);
      }
    });
    return () => {
      alive = false;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={box} />
      {failed && <p className="text-xs text-amber-600">No cargó la verificación anti-robots. Recarga la página.</p>}
    </div>
  );
}
