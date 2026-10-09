import { useState } from 'react';
import { Link } from 'react-router-dom';
import { connectionsApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Card, Button, Alert, Notice } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Tarjeta de Instagram en Conexiones. El dueño conecta su cuenta profesional de
 * Instagram (ligada a una Página de Facebook) con Facebook Login for Business
 * (config de Instagram); si tiene varias, elige cuál. Gateada por
 * `instagramEnabled` (App Review de `instagram_manage_messages`) y por el límite
 * de canales del plan (Free = uno a la vez).
 *
 * @param {object} props
 * @param {object} props.data      respuesta de GET /connections
 * @param {boolean} props.isOwner
 * @param {boolean} props.sdkReady SDK de Facebook cargado
 * @param {() => Promise<any>} props.onChanged refresca el estado
 */
export function InstagramConnect({ data, isOwner, sdkReady, onChanged }) {
  const [connecting, setConnecting] = useState(false);
  const [accounts, setAccounts] = useState(null); // [{id,username,pageName,picture}] cuando hay que elegir
  const [selecting, setSelecting] = useState('');

  const enabled = Boolean(data?.instagramEnabled);
  const connected = Boolean(data?.instagram?.connected);
  // Free con otro canal ya conectado: un canal a la vez.
  const otherChannel = data?.whatsapp?.connected ? 'WhatsApp' : data?.messenger?.connected ? 'Messenger' : '';
  const blockedByPlan = !data?.multiChannel && Boolean(otherChannel) && !connected;

  function launchLogin() {
    if (!window.FB || !data?.facebook?.instagramConfigId) {
      toast.error('La conexión no está lista. Recarga e intenta de nuevo.');
      return;
    }
    setConnecting(true);

    // Si cierran el popup con la "X", FB.login a veces no llama al callback:
    // al volver el foco, reseteamos si no hubo respuesta.
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
        // Variación General: el SDK entrega el TOKEN de usuario (no un code). El
        // servidor lo verifica con Meta antes de usarlo.
        const accessToken = response?.authResponse?.accessToken;
        if (!accessToken) {
          setConnecting(false);
          return;
        }
        // El SDK no acepta callbacks async: el trabajo va en una IIFE.
        (async () => {
          try {
            const res = await connectionsApi.connectInstagram(accessToken);
            if (res?.needsSelection) {
              setAccounts(res.accounts || []);
            } else {
              await onChanged?.();
              toast.success(`¡Instagram conectado! Tu bot ya responde los mensajes de @${res?.username || 'tu cuenta'}.`);
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'No se pudo conectar Instagram. Intenta de nuevo.');
          } finally {
            setConnecting(false);
          }
        })();
      },
      { config_id: data.facebook.instagramConfigId }
    );
  }

  async function chooseAccount(accountId) {
    setSelecting(accountId);
    try {
      const res = await connectionsApi.selectInstagramAccount(accountId);
      setAccounts(null);
      await onChanged?.();
      toast.success(`¡Instagram conectado! Tu bot ya responde los mensajes de @${res?.username || 'tu cuenta'}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo conectar esa cuenta.');
      if (err.response?.data?.details?.code === 'SELECTION_EXPIRED') setAccounts(null);
    } finally {
      setSelecting('');
    }
  }

  async function disconnect() {
    const ok = await confirm({
      title: 'Desconectar Instagram',
      message: 'El bot dejará de responder los mensajes directos de tu cuenta de Instagram. ¿Desconectarla?',
      tone: 'danger',
      confirmLabel: 'Desconectar',
    });
    if (!ok) return;
    try {
      await connectionsApi.disconnectInstagram();
      await onChanged?.();
      toast.success('Instagram desconectado.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo desconectar.');
    }
  }

  return (
    <Card className={enabled && !connected ? 'border-brand-200 dark:border-brand-900/60' : ''}>
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E1306C]/10 text-[#E1306C]">
          <Icon name="instagram" size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-fg">Instagram</h2>
            {connected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                <Icon name="check" size={13} /> Conectado
              </span>
            ) : enabled ? (
              <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs font-medium text-muted">Sin conectar</span>
            ) : (
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600">
                Próximamente
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            {connected
              ? 'Tu bot responde automáticamente los mensajes directos de tu cuenta de Instagram.'
              : 'Conecta tu cuenta de Instagram para que el bot atienda también tus mensajes directos.'}
          </p>
        </div>
      </div>

      {/* Conectado */}
      {connected && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <p className="text-sm text-fg">
            Cuenta conectada: <span className="font-semibold">@{data.instagram.username || data.instagram.accountId}</span>
          </p>
          {isOwner && (
            <Button variant="ghost" onClick={disconnect} className="text-red-500 hover:bg-red-500/10">
              Desconectar
            </Button>
          )}
        </div>
      )}

      {/* Sin conectar y habilitado */}
      {!connected && enabled && (
        <div className="mt-5 border-t border-line pt-5">
          {!isOwner ? (
            <Alert>Solo el dueño del negocio puede conectar Instagram.</Alert>
          ) : accounts ? (
            // Tiene varias cuentas de IG ligadas a sus Páginas: elegir cuál conectar.
            <div className="animate-fade-up">
              <p className="mb-2 text-sm font-medium text-fg">¿Qué cuenta de Instagram quieres conectar?</p>
              <div className="space-y-2">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={Boolean(selecting)}
                    onClick={() => chooseAccount(a.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-sm font-medium text-fg transition hover:border-brand-300 disabled:opacity-60"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      {a.picture ? (
                        <img src={a.picture} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                      ) : (
                        <Icon name="instagram" size={18} className="shrink-0 text-subtle" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate">@{a.username || a.id}</span>
                        {a.pageName && (
                          <span className="block truncate text-xs font-normal text-subtle">Página: {a.pageName}</span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-brand-600">
                      {selecting === a.id ? 'Conectando…' : 'Elegir'}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAccounts(null)}
                className="mt-2 text-xs font-medium text-muted hover:text-fg"
              >
                Cancelar
              </button>
            </div>
          ) : blockedByPlan ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
              <p className="text-sm text-muted">
                Tu plan <strong className="text-fg">Free</strong> permite un canal conectado a la vez y ya tienes
                {otherChannel}. Mejora a Pro para usar varios al mismo tiempo.
              </p>
              <Link to="/dashboard/facturacion" className="shrink-0">
                <Button size="sm">Mejorar plan</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={launchLogin}
                  disabled={!sdkReady || connecting}
                  className="w-full justify-center sm:w-auto"
                >
                  {connecting ? 'Conectando…' : 'Conectar Instagram'}
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
              <ul className="mt-4 space-y-2 rounded-md border-l-[3px] border-l-brand-500 bg-surface2 px-4 py-3 text-sm leading-relaxed text-fg">
                <li className="flex items-start gap-1.5">
                  <Icon name="check" size={13} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>
                    Tu Instagram debe ser una cuenta <strong className="text-fg">profesional</strong> (empresa o creador).
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Icon name="check" size={13} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>
                    Debe estar <strong className="text-fg">vinculada a una Página de Facebook</strong> que administres.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Icon name="check" size={13} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>
                    En la app de Instagram: Configuración, Mensajes y respuestas a historias, Herramientas conectadas:
                    activa <strong className="text-fg">Permitir acceso a los mensajes</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Icon name="check" size={13} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>
                    En la ventana de Facebook, elige la <strong className="text-fg">Página ligada</strong> y tu cuenta de
                    Instagram, y deja <strong className="text-fg">todos los permisos marcados</strong>. No necesitas
                    conectar Messenger antes.
                  </span>
                </li>
              </ul>
              <Notice variant="security" className="mt-3">
Se abrirá una ventana segura de Facebook. Inicia sesión con la cuenta que administra la Página
                  ligada a tu Instagram y selecciona tu cuenta cuando te lo pida.
</Notice>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
