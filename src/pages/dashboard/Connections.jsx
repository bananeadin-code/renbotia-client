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

    // Si el usuario cierra el popup con la "X", FB.login a veces NO llama al
    // callback → el botón quedaría en "Conectando...". Al volver el foco a la
    // ventana principal (popup cerrado), reseteamos si no hubo conexión.
    let settled = false;
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => {
        if (!settled) setConnecting(false);
      }, 1200);
    };
    window.addEventListener('focus', onFocus);

    window.FB.login(
      (response) => {
        settled = true;
        window.removeEventListener('focus', onFocus);
        const code = response?.authResponse?.code;
        if (!code) {
          setConnecting(false); // cancelado: reset silencioso
          return;
        }
        const { phoneNumberId, wabaId } = sessionInfo.current;
        // El SDK de Facebook NO acepta un callback async (lanza "Expression is
        // of type asyncfunction, not function"); el trabajo asíncrono (canje del
        // código en el backend) va en una función interna auto-invocada.
        (async () => {
          try {
            // Enviamos el code y, si el navegador los pasó, el número/WABA; si no,
            // el backend los deduce del token (más robusto).
            await connectionsApi.connectWhatsApp({ code, phoneNumberId, wabaId });
            await refresh();
            toast.success('¡WhatsApp conectado! Tu bot ya puede responder en tu número.');
          } catch (err) {
            toast.error(err.response?.data?.message || 'No se pudo conectar. Intenta de nuevo.');
          } finally {
            setConnecting(false);
          }
        })();
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

      <Card className={!connected && data?.embeddedEnabled ? 'border-brand-200 dark:border-brand-900/60' : ''}>
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
            <Icon name="whatsapp" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-fg">WhatsApp</h2>
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
            <p className="mt-1 text-sm text-muted">
              {connected
                ? 'Tu número está conectado. El bot responde automáticamente a tus clientes en WhatsApp.'
                : data?.embeddedEnabled
                  ? 'Conecta tu propia cuenta de WhatsApp Business para que el bot atienda a tus clientes de forma automática.'
                  : 'La conexión directa de WhatsApp estará disponible pronto. Estamos completando la aprobación con Meta.'}
            </p>
          </div>
        </div>

        {connected && (
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <p className="text-xs text-subtle">ID del número: {data.whatsapp.phoneNumberId}</p>
            {isOwner && (
              <Button variant="ghost" onClick={disconnect} className="text-red-500 hover:bg-red-500/10">
                Desconectar
              </Button>
            )}
          </div>
        )}

        {!connected && data?.embeddedEnabled && (
          <div className="mt-5 border-t border-line pt-5">
            {isOwner ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={launchSignup}
                    disabled={!sdkReady || connecting}
                    className="w-full justify-center sm:w-auto"
                  >
                    {connecting ? 'Conectando…' : 'Conectar WhatsApp'}
                    {!connecting && <Icon name="link" size={16} className="ml-1.5" />}
                  </Button>
                  {connecting && (
                    <button
                      type="button"
                      onClick={() => setConnecting(false)}
                      className="text-sm font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-xs text-subtle">
                  <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Se abrirá una ventana segura de Meta para iniciar sesión y verificar tu número. Puedes
                    cerrarla en cualquier momento.
                  </span>
                </p>
              </>
            ) : (
              <Alert>Solo el dueño del negocio puede conectar WhatsApp.</Alert>
            )}
          </div>
        )}

        {!connected && !data?.embeddedEnabled && (
          <div className="mt-4">
            <span className="inline-block rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600">
              Próximamente
            </span>
          </div>
        )}
      </Card>

      {!connected && (
        <Card>
          <h2 className="font-semibold text-fg">Cómo funciona</h2>
          <ol className="mt-4 space-y-4">
            {[
              {
                t: 'Conecta tu número',
                d: 'Inicias sesión con Facebook y confirmas tu número con un código. Es el proceso oficial de Meta y toma unos minutos.',
              },
              {
                t: 'El bot usa tu información',
                d: 'Responde con los datos de tu negocio que configuraste en el panel.',
              },
              {
                t: 'Atiende de forma automática',
                d: 'El bot responde a tus clientes en WhatsApp las 24 horas.',
              },
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-sm font-bold text-brand-700 dark:text-brand-300">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{s.t}</p>
                  <p className="text-sm text-muted">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-xl border border-line bg-surface2/50 p-4">
            <p className="text-sm font-medium text-fg">Qué necesitas</p>
            <p className="mt-1 text-sm text-muted">
              Un <strong className="text-fg">número dedicado</strong> para tu negocio: un chip o número que
              uses solo para el bot y que <strong className="text-fg">no esté activo</strong> en la app de
              WhatsApp (ni la normal ni Business).
            </p>
          </div>

          <div className="mt-3 rounded-xl border border-line bg-surface2/50 p-4">
            <p className="text-sm font-medium text-fg">Sobre costos</p>
            <p className="mt-1 text-sm text-muted">
              Tu plan RenBotIA cubre el bot con IA. Las conversaciones de WhatsApp las cobra{' '}
              <strong className="text-fg">Meta directamente</strong> a tu cuenta, con{' '}
              <strong className="text-fg">1,000 conversaciones gratis al mes</strong>. RenBotIA no agrega
              ningún cargo por los mensajes.
            </p>
          </div>
        </Card>
      )}

      <Card className="border-dashed">
        <div className="flex items-start gap-4 opacity-70">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center gap-1 rounded-xl bg-surface2 text-subtle">
            <Icon name="instagram" size={16} />
            <Icon name="messenger" size={16} />
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
