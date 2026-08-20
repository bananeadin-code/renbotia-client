import { useEffect, useRef, useState } from 'react';
import { ChatHeader } from './ChatHeader.jsx';
import { ChatBubble } from './ChatBubble.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';

/**
 * Mockup animado del chat para el hero: reproduce una conversación en loop
 * (aparecen mensajes uno a uno, con indicador "escribiendo…" antes de las
 * respuestas del bot), luego se reinicia. Es como un GIF pero nítido, ligero y
 * adaptado al tema (claro/oscuro estilo WhatsApp).
 *
 * Respeta prefers-reduced-motion: si el usuario lo pide, muestra todo estático.
 *
 * A futuro, si quieres un video/GIF real grabado en WhatsApp, cambia este
 * componente por <video>/<img> (ver nota en Landing.jsx).
 */
const SCRIPT = [
  { mine: true, content: 'Hola, ¿cuánto cuesta una consulta?', time: '10:24' },
  {
    mine: false,
    content:
      'La consulta inicial cuesta $500 MXN, deducible si contratas nuestros servicios. ¿Quieres agendar una cita?',
    time: '10:24',
  },
  { mine: true, content: 'Sí, para el jueves por la tarde.', time: '10:25' },
  {
    mine: false,
    content: 'Perfecto, te agendo el jueves a las 5 pm. ¿Me confirmas tu nombre?',
    time: '10:25',
  },
];

const TYPING_MS = 1300; // duración del "escribiendo…" antes de una respuesta
const AFTER_USER_MS = 1000; // pausa tras un mensaje del usuario
const AFTER_REPLY_MS = 800; // pausa tras una respuesta del bot
const LOOP_PAUSE_MS = 3200; // pausa antes de reiniciar el loop
const START_MS = 600;

export function AnimatedChatDemo({ botName = 'Asistente Legal' }) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(SCRIPT.length);
      return;
    }

    let cancelled = false;
    const timers = [];
    const wait = (fn, ms) => timers.push(setTimeout(() => !cancelled && fn(), ms));

    const step = (i) => {
      if (cancelled) return;
      if (i >= SCRIPT.length) {
        wait(() => {
          setShown(0);
          setTyping(false);
          step(0);
        }, LOOP_PAUSE_MS);
        return;
      }
      const msg = SCRIPT[i];
      if (msg.mine) {
        setShown(i + 1);
        wait(() => step(i + 1), AFTER_USER_MS);
      } else {
        setTyping(true);
        wait(() => {
          setTyping(false);
          setShown(i + 1);
          wait(() => step(i + 1), AFTER_REPLY_MS);
        }, TYPING_MS);
      }
    };

    wait(() => step(0), START_MS);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [shown, typing]);

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
      <ChatHeader botName={botName} typing={typing} />
      <div ref={scrollRef} className="wa-chat-bg h-[22rem] space-y-2 overflow-hidden p-4">
        {SCRIPT.slice(0, shown).map((m, i) => (
          <ChatBubble key={i} content={m.content} time={m.time} mine={m.mine} />
        ))}
        {typing && <TypingIndicator />}
      </div>
    </div>
  );
}
