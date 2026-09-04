import { useEffect, useRef, useState } from 'react';
import { connectionsApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Alert, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

/**
 * Módulo "Conexiones": el cliente conecta SU propio WhatsApp mediante Embedded
 * Signup (Facebook Login for Business). Mientras Meta no apruebe el App Review,
 * el backend expone `embeddedEnabled=false` y aquí mostramos "Próximamente".
 */

// Carga perezosa del SDK de Facebook (una sola vez). Resuelve cuando FB está listo.
let fbSdkPromise = null;
function loadFacebookSdk(appId, version) {
  if (fbSdkPromise) return fbSdkPromise;
  fbSdkPromise = new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB);
    window.fbAsyncInit = function () {
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version });
      resolve(window.FB);
    };
    const s = document.createElement('script');
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true;
    s.defer = true;
    s.crossOrigin = 'anonymous';
    s.onerror = () => reject(new Error('No se pudo cargar el SDK de Facebook.'));
    document.body.appendChild(s);
  });
  return fbSdkPromise;
}

export function Connections() {
  const role = useBusinessStore((s) => s.role);
  const isOwner = role !== 'colaborador';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  // Datos que el Embedded Signup envía por postMessage (número + WABA).
  const sessionInfo = useRef({ phoneNumberId: '', wabaId: '' });

  async function refresh() {
    const d = await connectionsApi.get();
    setData(d);
    return d;
  }

  useEffect(() => {
    refresh()
      .then((d) => {
        if (d?.embeddedEnabled && d.facebook?.appId) {
          loadFacebookSdk(d.facebook.appId, d.facebook.apiVersion)
            .then(() => setSdkReady(true))
            .catch(() => setSdkReady(false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Captura el número/WABA que el signup emite por postMessage.
  useEffect(() => {
    function onMessage(event) {
      if (!/facebook\.com$/.test(new URL(event.origin).hostname)) return;
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg?.type === 'WA_EMBEDDED_SIGNUP' && msg.data) {
          sessionInfo.current = {
            phoneNumberId: msg.data.phone_number_id || '',
            wabaId: msg.data.waba_id || '',
          };
        }
      } catch {
        /* mensajes ajenos: ignorar */
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function launchSignup() {
    if (!window.FB || !data?.facebook?.configId) {
      toast.error('La conexión no está lista. Recarga e intenta de nuevo.');
      return;
    }
    sessionInfo.current = { phoneNumberId: '', wabaId: '' };
    setConnecting(true);

    window.FB.login(
      async (response) => {
        const code = response?.authResponse?.code;
        if (!code) {
          setConnecting(false);
          toast.error('Conexión cancelada.');
          return;
        }
        const { phoneNumberId, wabaId } = sessionInfo.current;
        if (!phoneNumberId || !wabaId) {
          setConnecting(false);
          toast.error('No recibimos el número. Vuelve a intentar y completa todos los pasos.');
          return;
        }
        try {
          await connectionsApi.connectWhatsApp({ code, phoneNumberId, wabaId });
          await refresh();
          toast.success('¡WhatsApp conectado! Tu bot ya puede responder en tu número.');
        } catch (err) {
          toast.error(err.response?.data?.message || 'No se pudo conectar. Intenta de nuevo.');
        } finally {
          setConnecting(false);
        }
      },
      {
        config_id: data.facebook.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
      }
    );
  }

  async function disconnect() {
    if (!window.confirm('¿Desconectar tu WhatsApp? El bot dejará de responder en ese número.')) return;
    try {
      await connectionsApi.disconnectWhatsApp();
      await refresh();
      toast.success('WhatsApp desconectado.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo desconectar.');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="text-brand-600" />
      </div>
    );
  }

  const connected = data?.whatsapp?.connected;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Conexiones</h1>
        <p className="mt-1 text-muted">Conecta tus canales para que el bot atienda a tus clientes.</p>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
            <Icon name="message" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-fg">WhatsApp</h2>
              {connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  <Icon name="check" size={13} /> Conectado
                </span>
              ) : (
                <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs font-medium text-muted">
                  Sin conectar
                </span>
              )}
            </div>

            {connected ? (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-muted">
                  Tu número está conectado. El bot responde automáticamente a tus clientes en WhatsApp.
                </p>
                <p className="text-xs text-subtle">ID del número: {data.whatsapp.phoneNumberId}</p>
                {isOwner && (
                  <Button variant="ghost" onClick={disconnect} className="text-red-500 hover:bg-red-500/10">
                    Desconectar
                  </Button>
                )}
              </div>
            ) : data?.embeddedEnabled ? (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-muted">
                  Conecta tu propia cuenta de WhatsApp Business en unos pasos. Necesitas un{' '}
                  <strong className="text-fg">número dedicado</strong> que no esté activo en la app de
                  WhatsApp (ni normal ni Business).
                </p>
                {isOwner ? (
                  <Button onClick={launchSignup} disabled={!sdkReady || connecting}>
                    {connecting ? 'Conectando…' : 'Conectar WhatsApp'}
                    {!connecting && <Icon name="link" size={16} className="ml-1.5" />}
                  </Button>
                ) : (
                  <Alert>Solo el dueño del negocio puede conectar WhatsApp.</Alert>
                )}
              </div>
            ) : (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-muted">
                  La conexión directa de tu WhatsApp estará disponible muy pronto. Estamos completando
                  la aprobación con Meta para habilitarla.
                </p>
                <span className="inline-block rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600">
                  Próximamente
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="border-dashed">
        <div className="flex items-start gap-4 opacity-70">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface2 text-subtle">
            <Icon name="message" size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-fg">Instagram y Facebook Messenger</h2>
              <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs font-medium text-muted">
                Próximamente
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Automatiza también tus DMs de Instagram y Messenger con el mismo bot. En camino.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
