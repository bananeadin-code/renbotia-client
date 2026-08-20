import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { conversationsApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Badge, Spinner, Alert } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
const dayOf = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

/**
 * Bandeja de Conversaciones: actividad del bot con relevo humano. El dueño (o un
 * colaborador) ve las conversaciones, toma el control (modo manual) cuando lo
 * amerita y responde como persona. Las escalaciones aparecen como "requiere
 * atención". Hoy opera sobre el simulador; con WhatsApp real se llena solo.
 */
export default function Conversations() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  async function loadList() {
    try {
      const data = await conversationsApi.list();
      setList(data.conversations);
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
    try {
      const data = await conversationsApi.get(id);
      setThread(data.conversation);
    } finally {
      setLoadingThread(false);
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

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const data = await conversationsApi.reply(selectedId, reply.trim());
      setThread(data.conversation);
      setReply('');
      loadList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar.');
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

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-fg">Conversaciones</h1>
        <p className="text-sm text-muted">
          Actividad del bot. Toma el control cuando una conversación lo amerite.
        </p>
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
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pie: responder (manual) o aviso (bot) */}
                {isManual ? (
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
