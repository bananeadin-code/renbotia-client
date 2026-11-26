import { useEffect, useState } from 'react';
import { ChatHeader } from './ChatHeader.jsx';
import { ChatBubble } from './ChatBubble.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';

/**
 * Mockup animado del chat para el hero: reproduce una conversación en loop
 * (aparecen mensajes uno a uno, con "escribiendo…" antes de cada respuesta del
 * bot), luego se desvanece y vuelve a empezar. Es como un GIF pero nítido,
 * ligero y adaptado al tema (claro/oscuro estilo WhatsApp).
 *
 * Tamaño FIJO: los mensajes se apilan desde abajo, como en WhatsApp; cada uno
 * nuevo abre su espacio poco a poco (.chat-msg-in) y empuja a los anteriores
 * hacia arriba, donde se difuminan. Nada cambia de tamaño ni brinca.
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
      'La consulta inicial cuesta $500 MXN, deducible si contratas nuestros servicios. ¿Te comparto los requisitos?',
    time: '10:24',
  },
  { mine: true, content: 'Sí, por favor.', time: '10:25' },
  {
    mine: false,
    content: 'Claro: tu identificación y los documentos de tu caso. ¿Me compartes tu nombre para que un abogado te contacte?',
    time: '10:25',
  },
  { mine: true, content: 'Alexander Gaytan', time: '10:26' },
  {
    mine: false,
    content: 'Gracias, Alexander. Un abogado del equipo te escribe hoy por aquí para confirmar tu cita. 🙌',
    time: '10:26',
  },
];

const START_MS = 700;
const AFTER_USER_MS = 650; // el bot "lee" antes de empezar a escribir
const AFTER_REPLY_MS = 1900; // tiempo para leer la respuesta antes del siguiente mensaje
const LOOP_HOLD_MS = 3800; // la conversación completa se queda a la vista
const FADE_MS = 500; // desvanecido antes de reiniciar (igual que la transición CSS)

/** "Escribiendo…" proporcional al largo de la respuesta, como una persona. */
const typingMs = (text) => Math.min(2600, Math.max(1100, 700 + text.length * 14));

export function AnimatedChatDemo({ botName = 'Asistente Legal' }) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [fading, setFading] = useState(false);
  const [round, setRound] = useState(0); // cambia la key para que las animaciones de entrada se repitan

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(SCRIPT.length);
      return;
    }

    let cancelled = false;
    const timers = [];
    const wait = (fn, ms) => timers.push(setTimeout(() => !cancelled && fn(), ms));

    const step = (i) => {
      if (i >= SCRIPT.length) {
        wait(() => {
          setFading(true);
          wait(() => {
            setShown(0);
            setRound((r) => r + 1);
            setFading(false);
            wait(() => step(0), START_MS);
          }, FADE_MS);
        }, LOOP_HOLD_MS);
        return;
      }
      const msg = SCRIPT[i];
      if (msg.mine) {
        setShown(i + 1);
        wait(() => step(i + 1), AFTER_USER_MS);
        return;
      }
      setTyping(true);
      wait(() => {
        setTyping(false);
        setShown(i + 1);
        wait(() => step(i + 1), AFTER_REPLY_MS);
      }, typingMs(msg.content));
    };

    wait(() => step(0), START_MS);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[24rem] overflow-hidden rounded-2xl lg:w-[24rem] 2xl:w-[30rem] 2xl:max-w-[30rem] border border-line bg-surface shadow-pop">
      <ChatHeader botName={botName} typing={typing} />
      {/* Alto fijo; la columna se alinea abajo y lo que sobra arriba se difumina. */}
      <div
        className="wa-chat-bg relative flex h-[24rem] flex-col 2xl:h-[30rem] justify-end overflow-hidden px-4 pb-4"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 3.5rem)',
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 3.5rem)',
        }}
        aria-label="Ejemplo de conversación con el asistente"
        role="img"
      >
        <div
          key={round}
          className="transition-opacity ease-out"
          style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
        >
          {/* El "escribiendo…" ocupa el mismo lugar (misma key) que la respuesta que
              lo sustituye: la burbuja cambia de contenido sin que nada brinque. */}
          {SCRIPT.slice(0, shown).map((m, i) => (
            <div key={i} className="chat-msg-in pt-2">
              <div className={m.mine ? undefined : 'animate-fade-up'}>
                <ChatBubble content={m.content} time={m.time} mine={m.mine} />
              </div>
            </div>
          ))}
          {typing && (
            <div key={shown} className="chat-msg-in pt-2">
              <TypingIndicator />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
