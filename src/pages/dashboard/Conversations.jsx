import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { conversationsApi } from '../../api/endpoints.js';
import { downloadFile } from '../../api/download.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Badge, Spinner, Alert } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
const dayOf = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

// Tiempo restante de la ventana de 24h de WhatsApp, en texto legible.
function windowRemaining(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'cerrada';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `cierra en ${h} h ${m} min` : `cierra en ${m} min`;
}

const META_BILLING_URL = 'https://business.facebook.com/billing_hub/accounts';

/**
 * Bandeja de Conversaciones: actividad del bot con relevo humano. El dueño (o un
 * colaborador) ve las conversaciones, toma el control (modo manual) cuando lo
 * amerita y responde como persona. Las escalaciones aparecen como "requiere
 * atención". Hoy opera sobre el simulador; con WhatsApp real se llena solo.
 */
export default function Conversations() {
  const [list, setList] = useState([]);
  const [needAttention, setNeedAttention] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Ventana de 24h de WhatsApp + plantillas para reactivar fuera de ella.
  const [waWindow, setWaWindow] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateReason, setTemplateReason] = useState(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [tplName, setTplName] = useState('');
  const [sendingTpl, setSendingTpl] = useState(false);
  const scrollRef = useRef(null);

  async function loadList() {
    try {
      const data = await conversationsApi.list();
      setList(data.conversations);
      setNeedAttention(data.needAttention || 0);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadList();
  }, []);

  async function openConv(id) {
    setSelectedId(id);
    setLoadingThread(true);
    setTemplatesLoaded(false);
    setTemplates([]);
    setTplName('');
    try {
      const data = await conversationsApi.get(id);
      setThread(data.conversation);
      setWaWindow(data.whatsappWindow || null);
      // Fuera de la ventana de 24h: cargamos las plantillas aprobadas para ofrecerlas.
      if (data.conversation?.channel === 'whatsapp' && data.whatsappWindow && !data.whatsappWindow.open) {
        loadTemplates();
      }
    } finally {
      setLoadingThread(false);
    }
  }

  async function loadTemplates() {
    try {
      const data = await conversationsApi.templates();
      setTemplates(data.templates || []);
      setTemplateReason(data.reason || null);
      if (data.templates?.length) setTplName(data.templates[0].name);
    } catch {
      setTemplateReason('fetch_failed');
    } finally {
      setTemplatesLoaded(true);
    }
  }

  async function sendTemplateMsg() {
    if (!tplName) return;
    setSendingTpl(true);
    try {
      const tpl = templates.find((t) => t.name === tplName);
      const data = await conversationsApi.sendTemplate(selectedId, {
        templateName: tplName,
        languageCode: tpl?.language || 'es_MX',
      });
      setThread(data.conversation);
      toast.success('Plantilla enviada. Cuando el cliente responda, se reabrirá la ventana de 24 h.');
      loadList();
    } catch (err) {
      const code = err.response?.data?.details?.code;
      if (code === 'META_PAYMENT_REQUIRED') {
        toast.error('Falta un método de pago en tu cuenta de Meta para enviar plantillas.');
      } else {
        toast.error(err.response?.data?.message || 'No se pudo enviar la plantilla.');
      }
    } finally {
      setSendingTpl(false);
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread]);

  async function setMode(mode) {
    const data = await conversationsApi.setMode(selectedId, mode);
    setThread(data.conversation);
    toast.success(mode === 'manual' ? 'Tomaste el control de la conversación.' : 'El bot vuelve a responder.');
    loadList();
  }

  // Califica una respuesta del bot (up/down). Si ya estaba en ese valor, lo quita.
  async function rate(index, rating) {
    const current = thread?.messages?.[index]?.rating;
    const next = current === rating ? null : rating;
    try {
      const data = await conversationsApi.rate(selectedId, index, next);
      setThread(data.conversation);
    } catch {
      toast.error('No se pudo calificar.');
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const data = await conversationsApi.reply(selectedId, reply.trim());
      setThread(data.conversation);
      setReply('');
      if (data.sendWarning) toast.error(data.sendWarning); // p.ej. falta pago en Meta
      loadList();
    } catch (err) {
      if (err.response?.data?.details?.code === 'WINDOW_CLOSED') {
        toast.error('La ventana de 24 h cerró. Envía una plantilla para reactivar.');
        openConv(selectedId); // recarga → muestra el panel de plantilla
      } else {
        toast.error(err.response?.data?.message || 'No se pudo enviar.');
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-600" />
      </div>
    );
  }

  const isManual = thread?.handoffMode === 'manual';
  const isWhatsapp = thread?.channel === 'whatsapp';
  const windowClosed = isWhatsapp && waWindow && !waWindow.open;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-fg">Conversaciones</h1>
            {needAttention > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
                <Icon name="alert" size={13} />
                {needAttention} {needAttention === 1 ? 'requiere' : 'requieren'} atención
              </span>
            )}
          </div>
          <p className="text-sm text-muted">
            Actividad del bot. Toma el control cuando una conversación lo amerite.
          </p>
        </div>
        {list.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await downloadFile('/conversations/export', 'conversaciones-renbotia.csv');
              } catch {
                toast.error('No se pudo exportar.');
              } finally {
                setExporting(false);
              }
            }}
          >
            <Icon name="download" size={16} />
            <span className="hidden sm:inline">{exporting ? 'Exportando…' : 'Exportar CSV'}</span>
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <Card className="py-12 text-center">
          <Icon name="message" size={30} className="mx-auto mb-2 text-subtle" />
          <p className="text-sm text-muted">
            Aún no hay conversaciones. Prueba tu bot en el{' '}
            <Link to="/dashboard/simulador" className="font-medium text-brand-600 hover:underline">
              Simulador
            </Link>{' '}
            para generar actividad.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
          {/* Lista */}
          <div className={`space-y-2 ${selectedId ? 'hidden lg:block' : ''}`}>
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => openConv(c.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  c.id === selectedId
                    ? 'border-brand-400 bg-brand-500/5'
                    : c.needsAttention
                      ? 'border-amber-400/60 bg-amber-500/[0.06] hover:border-amber-400'
                      : 'border-line bg-surface hover:border-brand-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{c.title}</span>
                  <span className="shrink-0 text-[11px] text-subtle">{dayOf(c.lastAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{c.lastMessage}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {c.needsAttention && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      <Icon name="alert" size={11} /> Requiere atención
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      c.handoffMode === 'manual'
                        ? 'bg-brand-500/10 text-brand-600'
                        : 'bg-surface2 text-muted'
                    }`}
                  >
                    <Icon name={c.handoffMode === 'manual' ? 'user' : 'bot'} size={11} />
                    {c.handoffMode === 'manual' ? 'Manual' : 'Bot'}
                  </span>
                  {c.channel === 'whatsapp' && c.whatsappWindow && !c.whatsappWindow.open && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      <Icon name="alert" size={11} /> Ventana cerrada
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Hilo */}
          <div className={`${selectedId ? '' : 'hidden lg:block'}`}>
            {!selectedId ? (
              <Card className="flex h-full min-h-[300px] items-center justify-center text-center text-sm text-subtle">
                Selecciona una conversación para verla.
              </Card>
            ) : loadingThread || !thread ? (
              <Card className="flex min-h-[300px] items-center justify-center">
                <Spinner className="text-brand-600" />
              </Card>
            ) : (
              <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-line">
                {/* Cabecera del hilo */}
                <div className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      setThread(null);
                    }}
                    className="rounded-lg p-1 text-muted hover:bg-surface2 lg:hidden"
                    aria-label="Volver"
                  >
                    <Icon name="chevronRight" size={20} className="rotate-180" />
                  </button>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
                    {thread.title}
                  </span>
                  {/* Selector de modo */}
                  <div className="flex shrink-0 rounded-lg border border-line p-0.5 text-xs">
                    <button
                      onClick={() => !isManual || setMode('bot')}
                      className={`rounded-md px-2.5 py-1 font-medium transition ${
                        !isManual ? 'bg-brand-600 text-white' : 'text-muted hover:text-fg'
                      }`}
                    >
                      Bot
                    </button>
                    <button
                      onClick={() => isManual || setMode('manual')}
                      className={`rounded-md px-2.5 py-1 font-medium transition ${
                        isManual ? 'bg-brand-600 text-white' : 'text-muted hover:text-fg'
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {thread.needsAttention && (
                  <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
                    <strong>Requiere atención.</strong>{' '}
                    {thread.attentionReason || 'El bot pidió que entre una persona.'}
                  </div>
                )}

                {/* Estado de la ventana de 24h (solo conversaciones de WhatsApp) */}
                {isWhatsapp && waWindow && (
                  waWindow.open ? (
                    <div className="flex items-center gap-1.5 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <Icon name="check" size={13} className="shrink-0" />
                      <span>
                        Puedes responder libremente
                        {waWindow.expiresAt ? ` · la ventana ${windowRemaining(waWindow.expiresAt)}` : ''}.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
                      <Icon name="alert" size={13} className="shrink-0" />
                      <span>
                        Pasaron 24 h desde el último mensaje del cliente. Solo puedes reactivar con una plantilla.
                      </span>
                    </div>
                  )
                )}

                {/* Mensajes */}
                <div ref={scrollRef} className="wa-chat-bg flex-1 space-y-2 overflow-y-auto p-4">
                  {thread.messages.map((m, i) => {
                    const mine = m.role === 'assistant';
                    const agent = m.via === 'agent';
                    return (
                      <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[80%]">
                          {mine && (
                            <div className={`mb-0.5 text-right text-[10px] font-medium ${agent ? 'text-brand-600' : 'text-subtle'}`}>
                              {agent ? 'Tú (persona)' : 'Bot'}
                            </div>
                          )}
                          <div
                            className={`rounded-lg px-3 py-2 text-sm shadow-sm ${
                              mine
                                ? agent
                                  ? 'bg-brand-600 text-white'
                                  : 'bg-whatsapp-bubbleOut dark:bg-whatsapp-darkBubbleOut'
                                : 'bg-whatsapp-bubbleIn dark:bg-whatsapp-darkBubbleIn'
                            }`}
                          >
                            <p className={`whitespace-pre-wrap break-words ${mine && agent ? 'text-white' : 'text-slate-800 dark:text-whatsapp-darkText'}`}>
                              {m.content}
                            </p>
                            <span className={`mt-0.5 block text-right text-[10px] ${mine && agent ? 'text-white/70' : 'text-slate-400 dark:text-whatsapp-darkTime'}`}>
                              {timeOf(m.timestamp)}
                            </span>
                          </div>
                          {/* Calificación de calidad (solo respuestas del bot) */}
                          {mine && !agent && (
                            <div className="mt-1 flex items-center justify-end gap-1">
                              <button
                                onClick={() => rate(i, 'up')}
                                aria-label="Buena respuesta"
                                title="Buena respuesta"
                                className={`rounded-md p-1 transition ${
                                  m.rating === 'up'
                                    ? 'bg-brand-500/15 text-brand-600'
                                    : 'text-subtle hover:bg-surface2 hover:text-fg'
                                }`}
                              >
                                <Icon name="thumbsUp" size={14} />
                              </button>
                              <button
                                onClick={() => rate(i, 'down')}
                                aria-label="Respuesta a mejorar"
                                title="Respuesta a mejorar"
                                className={`rounded-md p-1 transition ${
                                  m.rating === 'down'
                                    ? 'bg-red-500/15 text-red-500'
                                    : 'text-subtle hover:bg-surface2 hover:text-fg'
                                }`}
                              >
                                <Icon name="thumbsDown" size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pie: plantilla (ventana cerrada) · responder libre (manual) · aviso (bot) */}
                {isManual && windowClosed ? (
                  <div className="space-y-2 border-t border-line bg-surface p-3">
                    <p className="flex items-start gap-1.5 text-xs text-muted">
                      <Icon name="alert" size={13} className="mt-0.5 shrink-0 text-amber-500" />
                      <span>
                        La ventana de texto libre cerró. Envía una{' '}
                        <strong className="text-fg">plantilla aprobada</strong> para reactivar la conversación.
                      </span>
                    </p>
                    {!templatesLoaded ? (
                      <p className="text-xs text-subtle">Cargando plantillas…</p>
                    ) : templates.length ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={tplName}
                          onChange={(e) => setTplName(e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
                        >
                          {templates.map((t) => (
                            <option key={`${t.name}-${t.language}`} value={t.name}>
                              {t.name} ({t.language})
                            </option>
                          ))}
                        </select>
                        <Button size="sm" className="shrink-0" disabled={sendingTpl || !tplName} onClick={sendTemplateMsg}>
                          {sendingTpl ? 'Enviando…' : 'Enviar plantilla'}
                        </Button>
                      </div>
                    ) : (
                      <Alert variant="info">
                        {templateReason === 'no_waba'
                          ? 'Conecta tu WhatsApp para poder enviar plantillas.'
                          : 'No tienes plantillas aprobadas todavía. Créalas en el Administrador de WhatsApp de Meta y espera su aprobación.'}
                      </Alert>
                    )}
                    <p className="flex items-start gap-1.5 text-[11px] text-subtle">
                      <Icon name="shield" size={12} className="mt-0.5 shrink-0" />
                      <span>
                        Enviar plantillas requiere un método de pago en tu cuenta de Meta.{' '}
                        <a
                          href={META_BILLING_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-brand-600 hover:underline"
                        >
                          Configurar en Meta
                        </a>
                        .
                      </span>
                    </p>
                  </div>
                ) : isManual ? (
                  <form onSubmit={sendReply} className="flex items-center gap-2 border-t border-line bg-surface p-2.5">
                    <input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Escribe como persona…"
                      maxLength={2000}
                      className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 py-2 text-sm text-fg outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={sending || !reply.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
                      aria-label="Enviar"
                    >
                      <Icon name="arrowRight" size={18} />
                    </button>
                  </form>
                ) : (
                  <div className="border-t border-line bg-surface px-4 py-3 text-center text-xs text-muted">
                    El bot está respondiendo esta conversación. Cambia a{' '}
                    <button onClick={() => setMode('manual')} className="font-semibold text-brand-600 hover:underline">
                      Manual
                    </button>{' '}
                    para tomar el control.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
