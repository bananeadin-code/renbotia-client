import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { connectionsApi, widgetApi } from '../../api/endpoints.js';
import { useCan } from '../../router/RequirePermission.jsx';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Card, Button, Alert, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { WhatsAppManage } from '../../components/business/WhatsAppManage.jsx';
import { ConnectionChecklist, ConnectionHelp } from '../../components/business/ConnectionAssistant.jsx';
import { MessengerConnect } from '../../components/business/MessengerConnect.jsx';
import { InstagramConnect } from '../../components/business/InstagramConnect.jsx';
import { WebWidgetCard } from '../../components/business/WebWidgetCard.jsx';
import { ChannelSettings } from '../../components/business/ChannelSettings.jsx';
import { OwnerControlCard } from '../../components/business/OwnerControlCard.jsx';
import { useBusinessStore } from '../../store/businessStore.js';

/**
 * Módulo "Conexiones": un selector de canales (WhatsApp, Messenger, Instagram,
 * Sitio web) con su estado, y debajo el panel del canal elegido. Así cada canal
 * se configura con calma y ninguno queda escondido al fondo de la página. El
 * canal activo vive en la URL (?canal=…) para poder enlazarlo directo.
 */

const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', tint: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'messenger', label: 'Messenger', icon: 'messenger', tint: 'bg-[#0866FF]/10 text-[#0866FF]' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram', tint: 'bg-[#E1306C]/10 text-[#E1306C]' },
  { key: 'web', label: 'Sitio web', icon: 'globe', tint: 'bg-brand-500/10 text-brand-600' },
];

/** Estado corto de cada canal para el selector. tone: on | off | soon */
function channelStatus(key, data, widget) {
  switch (key) {
    case 'whatsapp':
      if (data?.whatsapp?.connected && data?.settings?.whatsapp?.paused) return { text: 'Bot en pausa', tone: 'soon' };
      if (data?.whatsapp?.connected) return { text: data.whatsapp.phoneNumber || 'Conectado', tone: 'on' };
      return data?.embeddedEnabled ? { text: 'Sin conectar', tone: 'off' } : { text: 'Próximamente', tone: 'soon' };
    case 'messenger':
      if (data?.messenger?.connected && data?.settings?.facebook?.paused) return { text: 'Bot en pausa', tone: 'soon' };
      if (data?.messenger?.connected) return { text: data.messenger.pageName || 'Conectado', tone: 'on' };
      return data?.messengerEnabled ? { text: 'Sin conectar', tone: 'off' } : { text: 'Próximamente', tone: 'soon' };
    case 'instagram':
      if (data?.instagram?.connected && data?.settings?.instagram?.paused) return { text: 'Bot en pausa', tone: 'soon' };
      if (data?.instagram?.connected) return { text: `@${data.instagram.username || 'conectado'}`, tone: 'on' };
      return data?.instagramEnabled ? { text: 'Sin conectar', tone: 'off' } : { text: 'Próximamente', tone: 'soon' };
    case 'web':
      if (!widget) return { text: '…', tone: 'off' };
      if (!widget.allowed) return { text: 'Pro y Elite', tone: 'soon' };
      return widget.enabled ? { text: 'Activo', tone: 'on' } : { text: 'Apagado', tone: 'off' };
    default:
      return { text: '', tone: 'off' };
  }
}

const DOT = { on: 'bg-emerald-500', off: 'bg-slate-300 dark:bg-slate-600', soon: 'bg-amber-400' };

/** Selector de canales: tablist accesible (flechas, Inicio/Fin) en cuadrícula. */
function ChannelSwitcher({ active, onSelect, data, widget }) {
  const refs = useRef({});
  function onKeyDown(e) {
    const i = CHANNELS.findIndex((c) => c.key === active);
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = CHANNELS[(i + 1) % CHANNELS.length];
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = CHANNELS[(i - 1 + CHANNELS.length) % CHANNELS.length];
    if (e.key === 'Home') next = CHANNELS[0];
    if (e.key === 'End') next = CHANNELS[CHANNELS.length - 1];
    if (!next) return;
    e.preventDefault();
    onSelect(next.key);
    refs.current[next.key]?.focus();
  }
  return (
    // Móvil: control segmentado compacto (4 en fila: ícono con punto de estado y
    // nombre, sin textos cortados). Desde sm: tarjetas con el detalle del estado.
    <div
      role="tablist"
      aria-label="Canales"
      onKeyDown={onKeyDown}
      className="grid grid-cols-4 gap-1 rounded-2xl border border-line bg-surface p-1 shadow-card sm:grid-cols-2 sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none lg:grid-cols-4"
    >
      {CHANNELS.map((c) => {
        const st = channelStatus(c.key, data, widget);
        const selected = c.key === active;
        return (
          <button
            key={c.key}
            ref={(el) => (refs.current[c.key] = el)}
            type="button"
            role="tab"
            id={`tab-${c.key}`}
            aria-selected={selected}
            aria-controls={`panel-${c.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(c.key)}
            className={`group flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 sm:flex-row sm:justify-start sm:gap-3 sm:rounded-2xl sm:border sm:px-3 sm:py-2.5 sm:text-left sm:active:scale-100 ${
              selected
                ? 'bg-brand-500/10 sm:border-brand-500 sm:bg-surface sm:shadow-card sm:ring-1 sm:ring-brand-500'
                : 'hover:bg-surface2 sm:border-line sm:bg-surface/60 sm:hover:border-brand-300 sm:hover:bg-surface'
            }`}
          >
            <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${c.tint}`}>
              <Icon name={c.icon} size={19} />
              {/* Punto de estado sobre el ícono (solo móvil). */}
              <span
                className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface sm:hidden ${DOT[st.tone]}`}
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0 max-w-full sm:flex-1">
              <span
                className={`block truncate text-[11px] font-semibold sm:text-sm ${
                  selected ? 'text-brand-700 dark:text-brand-300 sm:text-fg' : 'text-muted sm:text-fg/90'
                }`}
              >
                {c.label}
              </span>
              <span className="sr-only sm:hidden">{st.text}</span>
              <span className="mt-0.5 hidden items-center gap-1.5 text-xs text-muted sm:flex">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[st.tone]}`} aria-hidden="true" />
                <span className="truncate">{st.text}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

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
  // Puede administrar conexiones: el dueño o un colaborador con ese permiso.
  const isOwner = useCan('connections');
  const role = useBusinessStore((s) => s.role);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  // El botón de conectar se habilita solo cuando el usuario marcó los 3 puntos
  // del checklist "Antes de conectar" (evita intentos fallidos por no tener listo
  // el número dedicado).
  const [checklistReady, setChecklistReady] = useState(false);
  // Datos que el Embedded Signup envía por postMessage (número + WABA).
  const sessionInfo = useRef({ phoneNumberId: '', wabaId: '' });
  // Canal visible (en la URL para poder enlazarlo: /dashboard/conexiones?canal=web).
  const [params, setParams] = useSearchParams();
  const active = CHANNELS.some((c) => c.key === params.get('canal')) ? params.get('canal') : 'whatsapp';
  const selectChannel = (key) => setParams(key === 'whatsapp' ? {} : { canal: key }, { replace: true });
  // Estado del widget web (para el selector); lo actualiza también su tarjeta.
  const [widget, setWidget] = useState(null);
  const onWidgetStatus = useCallback((w) => setWidget(w), []);

  async function refresh() {
    const d = await connectionsApi.get();
    setData(d);
    return d;
  }

  useEffect(() => {
    widgetApi.get().then(setWidget).catch(() => {});
    refresh()
      .then((d) => {
        // El SDK de Facebook sirve para WhatsApp (Embedded Signup) y Messenger (FB Login).
        if ((d?.embeddedEnabled || d?.messengerEnabled || d?.instagramEnabled) && d.facebook?.appId) {
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
    if (
      !(await confirm({
        title: 'Desconectar WhatsApp',
        message: 'El bot dejará de responder en ese número. ¿Seguro que quieres desconectarlo?',
        tone: 'danger',
        confirmLabel: 'Desconectar',
      }))
    )
      return;
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
        <p className="mt-1 text-sm text-muted sm:text-base">
          Elige un canal para conectarlo o ajustarlo. El bot responde igual en todos, con el mismo entrenamiento.
        </p>
      </div>

      <ChannelSwitcher active={active} onSelect={selectChannel} data={data} widget={widget} />

      <div
        key={active}
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="animate-fade-up space-y-6"
      >
      {active === 'whatsapp' && (
      <>
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
            {data.whatsapp.phoneNumber && (
              <p className="text-sm text-fg">
                Número conectado:{' '}
                <span className="font-semibold tabular">{data.whatsapp.phoneNumber}</span>
              </p>
            )}
            {data.whatsapp.verifiedName && (
              <p className="text-xs text-subtle">Nombre visible: {data.whatsapp.verifiedName}</p>
            )}
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
            {!isOwner ? (
              <Alert>Solo el dueño del negocio puede conectar WhatsApp.</Alert>
            ) : !checklistReady ? (
              // Antes de conectar: el checklist ocupa este espacio; al marcar los
              // 3 puntos, se desvanece y aparece el botón de conexión.
              <ConnectionChecklist onReadyChange={setChecklistReady} />
            ) : (
              <div className="animate-fade-up">
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
                    Se abrirá una ventana segura de Meta para iniciar sesión y verificar tu número.
                    Puedes cerrarla en cualquier momento.
                  </span>
                </p>
              </div>
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

      {/* Ajustes y gestión del WhatsApp conectado: pausa, perfil y plantillas */}
      {connected && (
        <ChannelSettings channel="whatsapp" settings={data?.settings?.whatsapp} isOwner={isOwner} onChanged={refresh} />
      )}
      {connected && <WhatsAppManage isOwner={isOwner} />}
      {/* Manejar el bot desde el WhatsApp del dueño (solo el dueño, no colaboradores) */}
      {connected && role === 'owner' && <OwnerControlCard />}

      {/* Ayuda (atascos + contacto) debajo de la tarjeta, mientras no conecta */}
      {!connected && data?.embeddedEnabled && isOwner && <ConnectionHelp />}

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
              Tu plan RenBotIA cubre el bot con IA. Cuando un cliente te escribe y el bot le
              responde, esas son <strong className="text-fg">conversaciones de servicio</strong> y{' '}
              <strong className="text-fg">Meta no las cobra: son gratis e ilimitadas</strong>. Meta
              solo cobra los mensajes con plantilla que tú <em>inicias</em> (promociones o avisos), y
              lo hace <strong className="text-fg">directamente a tu cuenta</strong>. RenBotIA no
              agrega ningún cargo por los mensajes.
            </p>
          </div>

          <div className="mt-3 rounded-xl border border-line bg-surface2/50 p-4">
            <p className="text-sm font-medium text-fg">Método de pago en Meta</p>
            <p className="mt-1 text-sm text-muted">
              Responder a tus clientes es gratis, así que puedes empezar sin tarjeta. Para no tener
              interrupciones y habilitar mensajes proactivos más adelante, agrega un método de pago
              en tu cuenta de Meta:{' '}
              <a
                href="https://business.facebook.com/billing_hub/accounts"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-600 underline-offset-2 hover:underline"
              >
                Facturación en Meta Business
              </a>{' '}
              (WhatsApp Manager → Facturación). Este pago es entre tu negocio y Meta; RenBotIA no
              interviene.
            </p>
          </div>
        </Card>
      )}

      </>
      )}

      {/* Facebook Messenger */}
      {active === 'messenger' && (
        <>
          <MessengerConnect data={data} isOwner={isOwner} sdkReady={sdkReady} onChanged={refresh} />
          {data?.messenger?.connected && (
            <ChannelSettings channel="facebook" settings={data?.settings?.facebook} isOwner={isOwner} onChanged={refresh} />
          )}
        </>
      )}

      {/* Instagram DMs */}
      {active === 'instagram' && (
        <>
          <InstagramConnect data={data} isOwner={isOwner} sdkReady={sdkReady} onChanged={refresh} />
          {data?.instagram?.connected && (
            <ChannelSettings channel="instagram" settings={data?.settings?.instagram} isOwner={isOwner} onChanged={refresh} />
          )}
        </>
      )}

      {/* Widget de chat para el sitio web del negocio (Pro/Elite) */}
      {active === 'web' && <WebWidgetCard isOwner={isOwner} onStatus={onWidgetStatus} />}
      </div>
    </div>
  );
}
