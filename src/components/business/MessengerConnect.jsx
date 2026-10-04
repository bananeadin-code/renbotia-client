import { useState } from 'react';
import { Link } from 'react-router-dom';
import { connectionsApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Card, Button, Alert } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Tarjeta de Facebook Messenger en Conexiones. El dueño conecta su Página de
 * Facebook con Facebook Login for Business (config de Páginas); si concedió
 * varias Páginas, elige cuál. Gateada por `messengerEnabled` (App Review de
 * `pages_messaging`) y por el límite de canales del plan (Free = uno a la vez).
 *
 * @param {object} props
 * @param {object} props.data      respuesta de GET /connections
 * @param {boolean} props.isOwner
 * @param {boolean} props.sdkReady SDK de Facebook cargado
 * @param {() => Promise<any>} props.onChanged refresca el estado
 */
export function MessengerConnect({ data, isOwner, sdkReady, onChanged }) {
  const [connecting, setConnecting] = useState(false);
  const [pages, setPages] = useState(null); // [{id,name}] cuando hay que elegir
  const [selecting, setSelecting] = useState('');

  const enabled = Boolean(data?.messengerEnabled);
  const connected = Boolean(data?.messenger?.connected);
  // Free con WhatsApp ya conectado: un canal a la vez.
  const blockedByPlan = !data?.multiChannel && data?.whatsapp?.connected && !connected;

  function launchLogin() {
    if (!window.FB || !data?.facebook?.messengerConfigId) {
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
            const res = await connectionsApi.connectMessenger(accessToken);
            if (res?.needsSelection) {
              setPages(res.pages || []);
            } else {
              await onChanged?.();
              toast.success(`¡Messenger conectado! Tu bot ya responde en "${res?.pageName || 'tu Página'}".`);
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'No se pudo conectar Messenger. Intenta de nuevo.');
          } finally {
            setConnecting(false);
          }
        })();
      },
      { config_id: data.facebook.messengerConfigId }
    );
  }

  async function choosePage(pageId) {
    setSelecting(pageId);
    try {
      const res = await connectionsApi.selectMessengerPage(pageId);
      setPages(null);
      await onChanged?.();
      toast.success(`¡Messenger conectado! Tu bot ya responde en "${res?.pageName || 'tu Página'}".`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo conectar esa Página.');
      if (err.response?.data?.details?.code === 'SELECTION_EXPIRED') setPages(null);
    } finally {
      setSelecting('');
    }
  }

  async function disconnect() {
    const ok = await confirm({
      title: 'Desconectar Messenger',
      message: 'El bot dejará de responder los mensajes de tu Página de Facebook. ¿Desconectarla?',
      tone: 'danger',
      confirmLabel: 'Desconectar',
    });
    if (!ok) return;
    try {
      await connectionsApi.disconnectMessenger();
      await onChanged?.();
      toast.success('Messenger desconectado.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo desconectar.');
    }
  }

  return (
    <Card className={enabled && !connected ? 'border-brand-200 dark:border-brand-900/60' : ''}>
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0866FF]/10 text-[#0866FF]">
          <Icon name="messenger" size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-fg">Facebook Messenger</h2>
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
              ? 'Tu bot responde automáticamente los mensajes que llegan a tu Página de Facebook.'
              : 'Conecta tu Página de Facebook para que el bot atienda también los mensajes de Messenger.'}
          </p>
        </div>
      </div>

      {/* Conectado */}
      {connected && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <p className="text-sm text-fg">
            Página conectada: <span className="font-semibold">{data.messenger.pageName || data.messenger.pageId}</span>
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
            <Alert>Solo el dueño del negocio puede conectar Messenger.</Alert>
          ) : pages ? (
            // Concedió varias Páginas: elegir cuál conectar.
            <div className="animate-fade-up">
              <p className="mb-2 text-sm font-medium text-fg">¿Qué Página quieres conectar?</p>
              <div className="space-y-2">
                {pages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={Boolean(selecting)}
                    onClick={() => choosePage(p.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-sm font-medium text-fg transition hover:border-brand-300 disabled:opacity-60"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-xs text-brand-600">
                      {selecting === p.id ? 'Conectando…' : 'Elegir'}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPages(null)}
                className="mt-2 text-xs font-medium text-muted hover:text-fg"
              >
                Cancelar
              </button>
            </div>
          ) : blockedByPlan ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
              <p className="text-sm text-muted">
                Tu plan <strong className="text-fg">Free</strong> permite un canal conectado a la vez y ya tienes
                WhatsApp. Mejora a Pro para usar ambos al mismo tiempo.
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
                  {connecting ? 'Conectando…' : 'Conectar Messenger'}
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
                  Se abrirá una ventana segura de Facebook. Inicia sesión con la cuenta que administra tu Página
                  y selecciónala cuando te lo pida.
                </span>
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
