import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { widgetApi } from '../../api/endpoints.js';
import { compressImageForUpload, fileToBase64 } from '../../lib/image.js';
import { Icon } from '../../components/ui/Icon.jsx';

/**
 * Chat del widget web (vive dentro del iframe que abre /widget.js en el sitio del
 * negocio). Sin sesión de RenBotIA: el visitante se identifica con un id
 * aleatorio guardado en el almacenamiento del iframe. Las respuestas de una
 * persona (modo manual desde la bandeja) llegan por sondeo.
 */

const POLL_MS = 6000;

function randomId() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Id de sesión persistente por negocio (si el navegador bloquea el almacenamiento
// del iframe, vive solo en memoria y la conversación dura lo que la pestaña).
function getSessionId(key) {
  const storageKey = `rb_w_${key}`;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && /^[A-Za-z0-9_-]{16,64}$/.test(saved)) return saved;
    const id = randomId();
    localStorage.setItem(storageKey, id);
    return id;
  } catch {
    return randomId();
  }
}

// Sitio donde está incrustado el chat. En Chrome/Edge/Safari el navegador dice
// el origen real del padre (ancestorOrigins); si no, se usa el que manda el
// snippet en la URL. Vacío = abierto directo en renbotia.com.
function embeddingHost() {
  try {
    const anc = window.location.ancestorOrigins;
    if (anc && anc.length) return new URL(anc[0]).hostname;
  } catch {
    /* sin acceso: cae al parámetro */
  }
  return (new URLSearchParams(window.location.search).get('host') || '').slice(0, 253);
}

const contactKey = (key) => `rb_w_contact_${key}`;
function readContact(key) {
  try {
    const c = JSON.parse(localStorage.getItem(contactKey(key)) || 'null');
    return c?.name && c?.value ? c : null;
  } catch {
    return null;
  }
}
function storeContact(key, c) {
  try {
    if (c) localStorage.setItem(contactKey(key), JSON.stringify(c));
    else localStorage.removeItem(contactKey(key));
  } catch {
    /* sin almacenamiento: vive solo en memoria */
  }
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

// Texto legible sobre el color de marca del negocio.
function textOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 170 ? '#0f172a' : '#ffffff';
}

// El bot escribe con formato de chat (*negrita* / **negrita**): se pinta como
// negrita en lugar de mostrar los asteriscos. Sin HTML crudo (React escapa).
function richText(str) {
  return String(str || '')
    .split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
    .map((part, i) => {
      const m = /^\*\*([^*]+)\*\*$/.exec(part) || /^\*([^*]+)\*$/.exec(part);
      return m ? <strong key={i}>{m[1]}</strong> : part;
    });
}

// ¿Corre dentro del iframe del widget? Abierto directo (enlace "Probar el chat"
// del panel) no hay botón flotante que cerrar, así que se oculta la X.
function isEmbedded() {
  try {
    return window.self !== window.top;
  } catch {
    return true; // acceso al padre bloqueado = estamos en un iframe ajeno
  }
}

const timeOf = (d) =>
  d ? new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';

export default function WidgetChat() {
  const { key } = useParams();
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | unavailable
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  // Captura de prospectos (si el negocio la activó).
  const [hasContact, setHasContact] = useState(false);
  const [contact, setContact] = useState(() => readContact(key));
  const [contactForm, setContactForm] = useState({ name: '', value: '' });
  const [contactError, setContactError] = useState('');
  const hostRef = useRef(embeddingHost());

  const sessionRef = useRef(null);
  const serverCount = useRef(0); // mensajes que el servidor ya confirmó
  const busy = useRef(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  if (!sessionRef.current) sessionRef.current = getSessionId(key);

  // Carga: apariencia + conversación previa de esta sesión (si la hay).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cfg = await widgetApi.publicConfig(key, hostRef.current);
        if (!alive) return;
        setConfig(cfg);
        const t = await widgetApi.thread(key, sessionRef.current, 0, hostRef.current).catch(() => null);
        if (!alive) return;
        if (t?.messages) {
          setMessages(t.messages);
          serverCount.current = t.total || t.messages.length;
          setHasContact(Boolean(t.hasContact));
        }
        setStatus('ready');
      } catch {
        if (alive) setStatus('unavailable');
      }
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  // Sondeo: trae respuestas que llegan sin que el visitante escriba (una persona
  // tomó la conversación). Solo con la pestaña visible y si ya hay conversación.
  useEffect(() => {
    if (status !== 'ready') return undefined;
    const id = setInterval(async () => {
      if (busy.current || document.hidden || serverCount.current === 0) return;
      try {
        const t = await widgetApi.thread(key, sessionRef.current, serverCount.current, hostRef.current);
        if (busy.current || !t || t.total <= serverCount.current) return;
        const base = serverCount.current;
        setMessages((prev) => [...prev.slice(0, base), ...t.messages]);
        serverCount.current = t.total;
      } catch {
        /* reintenta en el siguiente ciclo */
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [status, key]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Adjuntar foto o PDF (solo si el negocio lo permite: plan con lectura de archivos).
  const fileRef = useRef(null);
  async function onPickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || sending) return;
    try {
      if (f.type.startsWith('image/')) {
        const img = await compressImageForUpload(f);
        await send(null, null, { kind: 'image', mediaType: img.mediaType, data: img.data, preview: img.preview });
      } else if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) {
        if (f.size > 5 * 1024 * 1024) return setNotice('El PDF pesa demasiado (máximo 5 MB).');
        const data = await fileToBase64(f);
        await send(null, null, { kind: 'pdf', mediaType: 'application/pdf', data, name: f.name });
      } else {
        setNotice('Puedes adjuntar una foto o un PDF.');
      }
    } catch (err) {
      setNotice(err.message || 'No se pudo leer el archivo.');
    }
  }

  async function send(e, preset, file) {
    e?.preventDefault();
    const msg = (preset ?? text).trim();
    if ((!msg && !file) || sending) return;
    setText('');
    setNotice('');
    setSending(true);
    busy.current = true;
    const base = serverCount.current;
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: msg,
        images: file?.preview ? [{ url: file.preview, label: 'Tu foto' }] : undefined,
        files: file?.kind === 'pdf' ? [{ name: file.name }] : undefined,
        at: new Date().toISOString(),
        pending: true,
      },
    ]);
    try {
      const res = await widgetApi.send(key, {
        sessionId: sessionRef.current,
        message: msg,
        ...(file ? { file: { kind: file.kind, mediaType: file.mediaType, data: file.data, name: file.name || '' } } : {}),
        after: base,
        host: hostRef.current,
        ...(config?.requireContact && !hasContact && contact ? { contact } : {}),
      });
      if (contact) setHasContact(true);
      if (res.messages) {
        setMessages((prev) => [...prev.slice(0, base), ...res.messages]);
        serverCount.current = res.total;
      } else if (res.reply) {
        // Respuesta sin persistir (servicio no disponible): se muestra localmente.
        setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, at: new Date().toISOString() }]);
      }
      if (res.paused) setNotice('Una persona del equipo te responderá por aquí en breve.');
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m.pending));
      setText(msg);
      if (err.response?.data?.details?.code === 'CONTACT_REQUIRED') {
        // El negocio pide datos y aún no los tenemos: vuelve al formulario.
        storeContact(key, null);
        setContact(null);
        setHasContact(false);
      } else {
        setNotice(err.response?.data?.message || 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.');
      }
    } finally {
      busy.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const embedded = isEmbedded();

  function submitContact(e) {
    e.preventDefault();
    const name = contactForm.name.trim();
    const value = contactForm.value.trim();
    if (name.length < 2) return setContactError('Escribe tu nombre.');
    if (!EMAIL_RE.test(value) && !PHONE_RE.test(value)) {
      return setContactError('Escribe un correo o un número de WhatsApp válido.');
    }
    const c = { name, value };
    storeContact(key, c);
    setContact(c);
    setContactError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const askContact = Boolean(config?.requireContact) && !hasContact && !contact;
  const showSuggestions = !askContact && messages.length === 0 && !sending && (config?.suggestions || []).length > 0;

  function close() {
    window.parent?.postMessage({ type: 'renbotia:close' }, '*');
  }

  const color = config?.color || '#4f46e5';
  const fg = textOn(color);
  const initial = (config?.businessName || 'R').trim().charAt(0).toUpperCase();

  if (status === 'loading') {
    return (
      <div className="flex h-dvh items-center justify-center bg-surface">
        <Icon name="spinner" size={22} className="animate-spin text-subtle" />
      </div>
    );
  }

  if (status === 'unavailable') {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface2 text-subtle">
          <Icon name="message" size={20} />
        </span>
        <p className="text-sm font-medium text-fg">Este chat no está disponible por ahora.</p>
        {embedded && (
          <button type="button" onClick={close} className="text-xs font-medium text-muted hover:text-fg">
            Cerrar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-surface">
      {/* Encabezado con la marca del negocio */}
      <header className="flex shrink-0 items-center gap-3 px-4 py-3" style={{ background: color, color: fg }}>
        {config.photo ? (
          <img src={config.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/30" />
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 ring-white/30"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{config.businessName}</p>
          <p className="truncate text-xs opacity-80">{config.botName} · responde al instante</p>
        </div>
        {embedded ? (
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar chat"
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-black/10"
          >
            <Icon name="close" size={18} />
          </button>
        ) : (
          <span className="shrink-0 rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold">Vista de prueba</span>
        )}
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-canvas px-3 py-4">
        {(config.greeting || messages.length === 0) && (
          <Bubble mine={false}>
            {config.greeting || `¡Hola! Soy ${config.botName}. ¿En qué te puedo ayudar?`}
          </Bubble>
        )}
        {messages.map((m, i) => {
          const mine = m.role === 'user';
          return (
            <div key={i}>
              {!mine && m.via === 'agent' && (
                <p className="mb-0.5 ml-1 text-[10px] font-medium text-subtle">Equipo de {config.businessName}</p>
              )}
              <Bubble mine={mine} color={color} fg={fg} time={timeOf(m.at)} faded={m.pending}>
                {m.images?.map((img, k) => (
                  <img key={k} src={img.url} alt={img.label || 'imagen'} className="mb-1 max-h-56 w-full rounded-md object-cover" />
                ))}
                {m.files?.map((f, k) => (
                  <span key={k} className="mb-1 flex items-center gap-1.5 rounded-md bg-black/10 px-2 py-1.5 text-xs font-medium">
                    <Icon name="file" size={14} className="shrink-0" />
                    <span className="min-w-0 truncate">{f.name || 'documento.pdf'}</span>
                  </span>
                ))}
                {richText(m.content)}
              </Bubble>
            </div>
          );
        })}
        {sending && (
          <div className="flex justify-start">
            <span className="inline-flex gap-1 rounded-2xl rounded-bl-md bg-surface px-3 py-3 shadow-sm">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle"
                  style={{ animationDelay: `${d * 140}ms` }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      {notice && (
        <p className="shrink-0 border-t border-line bg-surface px-4 py-2 text-xs text-muted" role="status">
          {notice}
        </p>
      )}

      {askContact ? (
        // Captura de prospectos: nombre + correo o WhatsApp antes de chatear.
        <form onSubmit={submitContact} noValidate className="shrink-0 space-y-2 border-t border-line bg-surface p-3">
          <p className="text-xs font-medium text-fg">Antes de empezar, ¿cómo te contactamos?</p>
          <input
            value={contactForm.name}
            onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Tu nombre"
            maxLength={60}
            autoComplete="name"
            aria-label="Tu nombre"
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
          />
          <input
            value={contactForm.value}
            onChange={(e) => setContactForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="Correo o WhatsApp"
            maxLength={120}
            autoComplete="email"
            aria-label="Correo o WhatsApp"
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
          />
          {contactError && (
            <p className="text-xs text-red-500" role="alert">
              {contactError}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition hover:opacity-90"
            style={{ background: color, color: fg }}
          >
            Empezar a chatear
          </button>
          <p className="text-center text-[10px] text-subtle">Solo para responderte. No enviamos publicidad.</p>
        </form>
      ) : (
      <>
      {/* Preguntas sugeridas (antes del primer mensaje) */}
      {showSuggestions && (
        <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-line bg-surface px-2.5 pt-2.5">
          {config.suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(null, q)}
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
              style={{ borderColor: color, color }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Entrada */}
      <form
        onSubmit={send}
        className={`flex shrink-0 items-center gap-2 bg-surface p-2.5 ${showSuggestions ? '' : 'border-t border-line'}`}
      >
        {config?.allowFiles && (
          <>
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
              disabled={sending}
              aria-label="Adjuntar foto o PDF"
              title="Adjuntar foto o PDF"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface2 hover:text-fg disabled:opacity-40"
            >
              <Icon name="paperclip" size={18} />
            </button>
          </>
        )}
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu mensaje…"
          maxLength={1000}
          aria-label="Mensaje"
          className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 py-2.5 text-sm text-fg outline-none transition focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Enviar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:opacity-90 disabled:opacity-40"
          style={{ background: color, color: fg }}
        >
          <Icon name="send" size={17} />
        </button>
      </form>
      </>
      )}
      <a
        href="https://renbotia.com/?ref=widget"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 bg-surface pb-2 text-center text-[10px] text-subtle hover:text-muted"
      >
        Con tecnología de <span className="font-semibold">RenBotIA</span>
      </a>
    </div>
  );
}

function Bubble({ mine, color, fg, time, faded, children }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm shadow-sm transition-opacity ${
          mine ? 'rounded-br-md' : 'rounded-bl-md bg-surface text-fg'
        } ${faded ? 'opacity-70' : ''}`}
        style={mine ? { background: color, color: fg } : undefined}
      >
        {children}
        {time && <span className="mt-0.5 block text-right text-[10px] opacity-60">{time}</span>}
      </div>
    </div>
  );
}
