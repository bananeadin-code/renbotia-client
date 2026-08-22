import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../ui/Logo.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Interfaz moderna de "Ren" (asistente del sitio). Diseño PROPIO, distinto del
 * chat tipo WhatsApp del demo: panel que flota, cabecera de marca con gradiente,
 * burbujas modernas sobre un fondo limpio con resplandor. Stateless (reenvía el
 * historial corto). El envío al backend llega por `sendFn`.
 *
 * @param {object} p
 * @param {string} p.name       Nombre del asistente (ej. "Ren").
 * @param {string} p.welcome    Mensaje inicial.
 * @param {string[]} p.starters Sugerencias (chips).
 * @param {(msg:string, history:any[])=>Promise<{reply:string}>} p.sendFn
 * @param {{text:string,to:string,label:string}} [p.cta] CTA tras 2 turnos.
 * @param {()=>void} p.onClose
 * @param {string} [p.heightClass]
 */
const now = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

// La conversación con Ren persiste en el navegador para que CONTINÚE al cambiar
// de página o recargar. Solo se restaura si hubo conversación real (algún mensaje
// del usuario); así un cambio en el mensaje de bienvenida no queda "atrapado".
const STORAGE_KEY = 'ren:conversation';
function loadConversation() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(arr) && arr.some((m) => m.role === 'user')) return arr;
  } catch {
    /* sin persistencia disponible */
  }
  return null;
}

export function RenChat({
  name = 'Ren',
  welcome,
  starters = [],
  sendFn,
  cta,
  onClose,
  // Altura del PANEL (no del área de mensajes): siempre cabe en la pantalla para
  // que no se desborde hacia arriba. El área de mensajes flexiona y hace scroll.
  // (Tailwind: los espacios dentro de calc() se escriben con guion bajo.)
  heightClass = 'h-[min(560px,calc(100dvh_-_7rem))]',
}) {
  const [messages, setMessages] = useState(
    () => loadConversation() || [{ role: 'assistant', content: welcome, time: now() }]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  // Cuántos mensajes ha enviado el usuario (deriva de los mensajes → sirve para
  // mostrar las sugerencias iniciales y el CTA; funciona bien con la persistencia).
  const userTurns = messages.filter((m) => m.role === 'user').length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Guarda la conversación (acotada a los últimos 40 mensajes) ante cada cambio.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* noop */
    }
  }, [messages]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setError('');
    setInput('');
    const userMsg = { role: 'user', content: msg, time: now() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const data = await sendFn(msg, history.slice(-8));
      setMessages((m) => [...m, { role: 'assistant', content: data.reply, time: now() }]);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo enviar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)] ring-1 ring-black/5 ${heightClass}`}
    >
      {/* Cabecera de marca (identidad de Ren) */}
      <div className="flex items-center gap-3 bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-3 text-white">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
          <LogoMark size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold leading-none">{name}</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              IA
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Asistente de RenBotIA · En línea
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Mensajes (burbujas modernas sobre fondo limpio con resplandor) */}
      <div ref={scrollRef} className="ren-chat-bg flex-1 min-h-0 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => {
          const mine = m.role === 'user';
          return (
            <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  mine
                    ? 'rounded-2xl rounded-br-md bg-brand-600 text-white'
                    : 'rounded-2xl rounded-bl-md border border-line bg-surface text-fg'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <span className={`mt-1 block text-right text-[10px] ${mine ? 'text-white/60' : 'text-subtle'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-subtle [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-subtle [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-subtle" />
            </div>
          </div>
        )}

        {userTurns === 0 && !loading && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg shadow-sm transition hover:border-brand-400 hover:text-brand-600"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA tras 2 turnos */}
      {userTurns >= 2 && cta && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface2 px-3.5 py-2.5">
          <span className="text-xs text-muted">{cta.text}</span>
          <Link to={cta.to}>
            <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700">
              {cta.label}
            </button>
          </Link>
        </div>
      )}

      {error && <p className="bg-red-500/10 px-3.5 py-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {/* Entrada moderna */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-line bg-surface p-2.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Escríbele a ${name}…`}
          maxLength={500}
          className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-fg outline-none placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
          aria-label={`Mensaje para ${name}`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
          aria-label="Enviar"
        >
          <Icon name="arrowRight" size={18} />
        </button>
      </form>
    </div>
  );
}
