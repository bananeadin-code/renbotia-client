import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demoApi } from '../../api/endpoints.js';
import { ChatHeader } from './ChatHeader.jsx';
import { ChatBubble } from './ChatBubble.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';
import { Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

const STARTERS = ['¿Cuánto cuesta una consulta?', '¿Qué áreas manejan?', '¿Cómo agendo una cita?'];
const WELCOME =
  'Hola, soy un asistente de ejemplo entrenado con la info de un negocio. Pregúntame lo que le preguntarías a un despacho.';
const DEMO_CTA = {
  text: 'Este es un ejemplo. Arma el tuyo con tu info.',
  to: '/registro',
  label: 'Crear mi bot gratis',
};

const now = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

/**
 * Chat reutilizable. Por defecto es la DEMO pública de la landing (bot de ejemplo
 * de un negocio). Parametrizándolo sirve también como asistente del SITIO en el
 * widget flotante (soporte/guía), enviando a otro endpoint y con su propio
 * mensaje de bienvenida, sugerencias y CTA. Es stateless (reenvía el historial).
 *
 * @param {object} p
 * @param {string} [p.botName]   Nombre mostrado en la cabecera.
 * @param {string} [p.welcome]   Mensaje inicial del asistente.
 * @param {string[]} [p.starters] Sugerencias de arranque (chips).
 * @param {(msg:string, history:any[])=>Promise<{reply:string}>} [p.sendFn] Envío al backend.
 * @param {{text:string,to:string,label:string}} [p.cta] CTA que aparece tras 2 turnos.
 */
export function DemoChat({
  className = '',
  heightClass = 'h-[420px]',
  botName = 'Asistente de ejemplo',
  welcome = WELCOME,
  starters = STARTERS,
  sendFn = demoApi.send,
  cta = DEMO_CTA,
}) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: welcome, time: now() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTurns, setUserTurns] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setError('');
    setInput('');
    const userMsg = { role: 'user', content: msg, time: now() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setUserTurns((c) => c + 1);
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
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop ${className}`}>
      <ChatHeader botName={botName} typing={loading} />

      <div ref={scrollRef} className={`wa-chat-bg flex-1 space-y-2 overflow-y-auto p-4 ${heightClass}`}>
        {messages.map((m, i) => (
          <ChatBubble key={i} content={m.content} time={m.time} mine={m.role === 'user'} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
        {userTurns === 0 && !loading && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-line bg-surface/90 px-3 py-1 text-xs font-medium text-fg transition hover:border-brand-400"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {userTurns >= 2 && cta && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-brand-50/70 px-3 py-2 dark:bg-brand-900/20">
          <span className="text-xs text-muted">{cta.text}</span>
          <Link to={cta.to}>
            <Button size="sm">{cta.label}</Button>
          </Link>
        </div>
      )}

      {error && (
        <p className="bg-red-50 px-3 py-1.5 text-xs text-red-600 dark:bg-red-900/20">{error}</p>
      )}

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
          placeholder="Escribe un mensaje…"
          maxLength={500}
          className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 py-2 text-sm text-fg outline-none placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
          aria-label="Mensaje para el bot de ejemplo"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
          aria-label="Enviar"
        >
          <Icon name="arrowRight" size={18} />
        </button>
      </form>
    </div>
  );
}
