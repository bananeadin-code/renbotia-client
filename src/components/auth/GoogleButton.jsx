import { useEffect, useRef, useState } from 'react';
import { authApi } from '../../api/endpoints.js';
import { useAuthStore } from '../../store/authStore.js';
import { useThemeStore } from '../../store/themeStore.js';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Botón oficial "Continuar con Google" (Google Identity Services, flujo de ID
 * token). Obtiene el Client ID del backend; si no está configurado, no se
 * muestra (así el sitio no pide nada roto en desarrollo). Al autenticarse,
 * llama a onSuccess.
 */
export function GoogleButton({ onSuccess, onError }) {
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const isDark = useThemeStore((s) => s.isDark);
  const [clientId, setClientId] = useState(null); // null = cargando, '' = no config
  const ref = useRef(null);
  const busy = useRef(false);

  useEffect(() => {
    authApi
      .config()
      .then((c) => setClientId(c.googleClientId || ''))
      .catch(() => setClientId(''));
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    function render() {
      if (cancelled || !window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          if (busy.current) return;
          busy.current = true;
          try {
            await googleLogin(resp.credential);
            onSuccess?.();
          } catch (e) {
            onError?.(e);
          } finally {
            busy.current = false;
          }
        },
      });
      ref.current.innerHTML = '';
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
      });
    }

    if (window.google?.accounts?.id) {
      render();
    } else {
      let s = document.getElementById('gsi-script');
      if (s) {
        s.addEventListener('load', render);
      } else {
        s = document.createElement('script');
        s.id = 'gsi-script';
        s.src = GSI_SRC;
        s.async = true;
        s.defer = true;
        s.onload = render;
        document.head.appendChild(s);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [clientId, isDark, googleLogin, onSuccess, onError]);

  // No configurado (o aún cargando la config): no mostramos nada.
  if (!clientId) return null;

  return (
    <div className="my-4">
      <div className="flex justify-center">
        <div ref={ref} />
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" />
        <span>o con tu correo</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
