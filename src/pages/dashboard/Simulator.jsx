import { useEffect, useRef, useState } from 'react';
import { PlanCta } from '../../components/ui/PlanCta.jsx';
import { Link } from 'react-router-dom';
import { simulatorApi, botConfigApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { ChatHeader } from '../../components/whatsapp/ChatHeader.jsx';
import { ChatBubble } from '../../components/whatsapp/ChatBubble.jsx';
import { TypingIndicator } from '../../components/whatsapp/TypingIndicator.jsx';
import { Button, Alert } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { compressImageForUpload, fileToBase64 } from '../../lib/image.js';

const hhmm = (d = new Date()) =>
  d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

export default function Simulator() {
  const { balance, setBalance, business, subscription } = useBusinessStore();
  const readsFiles = subscription?.plan?.key === 'elite';
  const [botName, setBotName] = useState('Asistente');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatId, setChatId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState([]);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    botConfigApi.get().then((data) => setBotName(data.botConfig.botName || 'Asistente')).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // Probar cómo responde el bot a una foto o un PDF (como si lo mandara un cliente).
  async function onPickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || typing) return;
    try {
      if (f.type.startsWith('image/')) {
        const img = await compressImageForUpload(f);
        await send(null, { kind: 'image', mediaType: img.mediaType, data: img.data, preview: img.preview });
      } else if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
        if (f.size > 5 * 1024 * 1024) return setError('El PDF pesa demasiado (máximo 5 MB).');
        await send(null, { kind: 'pdf', mediaType: 'application/pdf', data: await fileToBase64(f), name: f.name });
      } else {
        setError('Puedes adjuntar una foto o un PDF.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo leer el archivo.');
    }
  }

  async function send(e, file) {
    e?.preventDefault();
    const text = input.trim();
    if ((!text && !file) || typing) return;

    setError('');
    setInput('');
    setMessages((m) => [
      ...m,
      {
        role: 'user',
        content: text,
        images: file?.preview ? [{ url: file.preview }] : undefined,
        files: file?.kind === 'pdf' ? [{ name: file.name }] : undefined,
        time: hhmm(),
      },
    ]);
    setTyping(true);

    try {
      const payload = file ? { kind: file.kind, mediaType: file.mediaType, data: file.data, name: file.name || '' } : undefined;
      const res = await simulatorApi.send(text, chatId || undefined, payload);
      const data = res.data.data;
      setChatId(data.chatId);
      setBalance(data.balance);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.reply, images: data.sentImages, time: hhmm() },
      ]);
      // El bot pudo captar trabajo (cita/reservación/pedido/prospecto) en este turno.
      if (data.createdRecords?.length) {
        setCaptured((c) => [...c, ...data.createdRecords]);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 402) {
        // Límite alcanzado: mostramos CTA a comprar créditos.
        setLimitReached(true);
        if (err.response.data?.details?.balance) setBalance(err.response.data.details.balance);
      } else {
        setError(err.response?.data?.message || 'No se pudo enviar el mensaje');
      }
    } finally {
      setTyping(false);
    }
  }

  function resetChat() {
    setMessages([]);
    setChatId(null);
    setLimitReached(false);
    setError('');
    setCaptured([]);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Simulador</h1>
          <p className="text-sm text-muted">Prueba tu bot como si fueras un cliente en WhatsApp.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={resetChat}>
          Nueva conversación
        </Button>
      </div>

      {/* Balance */}
      {balance && (
        <div className="flex items-center justify-between rounded-lg bg-surface2 px-4 py-2 text-sm">
          <span className="text-muted">Tokens disponibles</span>
          <span className={`font-semibold ${balance.available < 1000 ? 'text-red-600' : 'text-brand-700 dark:text-brand-300'}`}>
            {balance.available.toLocaleString('es-MX')}
          </span>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {/* Trabajo captado por el bot en esta conversación */}
      {captured.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-sm">
          <Icon name="calendarCheck" size={18} className="mt-px shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-brand-700 dark:text-brand-300">
              El bot registró {captured.length} {captured.length === 1 ? 'elemento' : 'elementos'} en Gestión
            </p>
            <ul className="mt-0.5 text-brand-700/90 dark:text-brand-300/90">
              {captured.slice(-3).map((r, i) => (
                <li key={i} className="truncate">• {r.summary || r.type}</li>
              ))}
            </ul>
            <Link to="/dashboard/gestion" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold underline">
              Ver en Gestión <Icon name="arrowRight" size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Ventana de chat */}
      <div className="overflow-hidden rounded-xl border border-line shadow-card">
        <ChatHeader botName={botName} typing={typing} />

        <div ref={scrollRef} className="wa-chat-bg h-[55vh] space-y-2 overflow-y-auto p-4">
          {messages.length === 0 && !limitReached && (
            <div className="mt-10 flex flex-col items-center text-center text-sm text-slate-600 dark:text-slate-300">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm dark:bg-whatsapp-darkBubbleIn dark:text-brand-300">
                <Icon name="sparkles" size={22} />
              </span>
              <p className="mt-3 max-w-xs rounded-lg bg-white/80 px-4 py-3 shadow-sm dark:bg-whatsapp-darkBubbleIn/80">
                Escribe un mensaje para probar cómo responde <strong>{botName}</strong> con la
                información de {business?.name}.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <ChatBubble
              key={i}
              content={m.content}
              time={m.time}
              mine={m.role === 'user'}
              images={m.images}
              files={m.files}
            />
          ))}

          {typing && <TypingIndicator />}

          {limitReached && (
            <div className="mx-auto mt-4 max-w-sm rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center text-sm backdrop-blur">
              <p className="font-medium text-amber-800 dark:text-amber-300">Alcanzaste el límite de tokens de tu plan</p>
              <p className="mt-1 text-amber-700 dark:text-amber-300/90">
                Compra un paquete de créditos para seguir probando y atendiendo clientes.
              </p>
              <PlanCta className="mt-3 inline-block" memberText="Pídele al dueño del negocio que compre créditos.">
                <Button size="sm">Comprar créditos</Button>
              </PlanCta>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex items-center gap-2 border-t border-line bg-surface p-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={onPickFile}
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={typing || limitReached}
            aria-label="Adjuntar foto o PDF"
            title={readsFiles ? 'Adjuntar foto o PDF' : 'Adjuntar foto o PDF (el bot los lee en Elite)'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface2 hover:text-fg disabled:opacity-50"
          >
            <Icon name="paperclip" size={18} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={limitReached}
            placeholder={limitReached ? 'Sin créditos disponibles' : 'Escribe un mensaje…'}
            className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-fg outline-none placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:bg-surface2"
          />
          <button
            type="submit"
            disabled={typing || limitReached || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
            aria-label="Enviar"
          >
            <Icon name="send" size={18} />
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-subtle">
        Cada mensaje consume tokens reales de la API de Claude, descontados de tu plan.
        {readsFiles
          ? ' Puedes adjuntar fotos o PDF como lo haría un cliente.'
          : ' Puedes adjuntar fotos o PDF para ver cómo responde: en tu plan el bot pide que se lo escriban; en Elite los lee.'}
      </p>
    </div>
  );
}
