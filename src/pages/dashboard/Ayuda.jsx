import { useRef, useState } from 'react';
import { useRevealOnChange } from '../../lib/reveal.js';
import { Link } from 'react-router-dom';
import { supportApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { Button, Card, Select, Textarea } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { CONNECTION_FAQ } from '../../components/business/ConnectionAssistant.jsx';

/**
 * Ayuda: un solo lugar para pedir apoyo dentro del panel.
 *  - Sesión de orientación por videollamada (según su estado).
 *  - Mensaje al equipo (llega con los datos de la cuenta; no hay que repetirlos).
 *  - Preguntas frecuentes (las de conexión son las mismas de Conexiones).
 */

const TOPICS = ['Conexión de WhatsApp', 'Entrenamiento del bot', 'Otra sesión de orientación', 'Facturación', 'Ventas y planes', 'Otro'];

const GENERAL_FAQ = [
  {
    q: '¿Puedo probar mi bot antes de conectarlo?',
    a: (
      <>
        Sí. En <Link to="/dashboard/simulador" className="font-medium text-brand-700 underline dark:text-brand-300">Simulador</Link> escribes
        como si fueras un cliente y ves cómo responde. Lo que ajustes en Entrenamiento se refleja al momento.
      </>
    ),
  },
  {
    q: '¿Quién cobra las conversaciones de WhatsApp?',
    a: 'Meta las cobra directamente a tu cuenta de WhatsApp Business según sus tarifas (incluyen un volumen mensual gratuito). Es independiente de tu plan de RenBotIA.',
  },
  {
    q: '¿Qué son los créditos de IA?',
    a: 'Cada respuesta del bot consume créditos (tokens). Tu plan trae un cupo que se renueva cada mes; los créditos extra que compres se suman y no vencen.',
  },
  {
    q: '¿Cómo cambio o cancelo mi plan?',
    a: (
      <>
        Desde <Link to="/dashboard/facturacion" className="font-medium text-brand-700 underline dark:text-brand-300">Facturación</Link>. Al
        mejorar puedes hacerlo al momento o en tu renovación; si cancelas, conservas tu plan hasta el final del periodo
        pagado y tu bot se queda guardado.
      </>
    ),
  },
  {
    q: '¿Cómo funciona la garantía del plan anual?',
    a: 'Durante los 30 días siguientes a tu primera compra anual puedes pedir el reembolso completo desde Facturación. Tu cuenta pasa a Free y conservas tu bot y tu configuración.',
  },
];

function Faq({ items }) {
  return (
    <div className="space-y-1.5">
      {items.map((f) => (
        <details key={f.q} className="group rounded-lg border border-line bg-surface2/40 px-3 py-2">
          <summary className="flex min-h-[32px] cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-fg">
            {f.q}
            <Icon name="chevronRight" size={15} className="shrink-0 text-subtle transition group-open:rotate-90" />
          </summary>
          <p className="mt-1.5 text-sm text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export default function Ayuda() {
  const { subscription } = useBusinessStore();
  const user = useAuthStore((s) => s.user);
  const orientation = subscription?.orientation;
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState('');
  const sentRef = useRef(null);
  useRevealOnChange(sent, sentRef);

  async function send(e) {
    e.preventDefault();
    if (message.trim().length < 10) return toast.error('Cuéntanos un poco más (mínimo 10 caracteres).');
    setSending(true);
    try {
      const r = await supportApi.message({ topic, message: message.trim() });
      setSent(r?.message || 'Recibimos tu mensaje. Te respondemos pronto.');
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar. Intenta de nuevo en un momento.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Ayuda</h1>
        <p className="text-sm text-muted">Te acompañamos a dejar tu bot funcionando y resolvemos tus dudas.</p>
      </div>

      {/* Sesión de orientación */}
      {orientation?.bookingUrl && (
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Icon name="calendarCheck" size={22} className="mt-0.5 shrink-0 text-brand-600" />
            <div>
              <div className="font-semibold text-fg">Sesión de orientación por videollamada</div>
              <p className="text-sm text-muted">
                {orientation.done
                  ? 'Ya tuviste tu sesión (es una por negocio). Si necesitas otra, pídela con el formulario de abajo y te contactamos.'
                  : 'Gratis, una por negocio. Nuestro equipo te ayuda a conectar tu WhatsApp, entrenar tu bot y resolver tus dudas de planes.'}
              </p>
            </div>
          </div>
          {!orientation.done && (
            <a href={orientation.bookingUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Button size="sm">Agendar sesión</Button>
            </a>
          )}
        </Card>
      )}

      {/* Mensaje al equipo */}
      <Card>
        <h2 className="font-semibold text-fg">Escríbenos</h2>
        <p className="mt-1 text-sm text-muted">
          Te respondemos a <span className="font-medium text-fg">{user?.email}</span>. Ya sabemos cuál es tu cuenta y tu plan,
          no tienes que repetirlos.
        </p>
        {sent ? (
          <div ref={sentRef} className="mt-4 flex items-start gap-2 rounded-xl bg-brand-500/[0.07] px-3.5 py-3 text-sm text-fg">
            <Icon name="checkCircle" size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>
              {sent}{' '}
              <button type="button" onClick={() => setSent('')} className="font-medium text-brand-700 underline dark:text-brand-300">
                Enviar otro mensaje
              </button>
            </span>
          </div>
        ) : (
          <form onSubmit={send} className="mt-4 space-y-3">
            <Select label="Tema" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Textarea
              label="Mensaje"
              rows={5}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Cuéntanos qué necesitas. Si viste un error, copia el mensaje exacto."
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={sending}>
                <Icon name="send" size={15} /> {sending ? 'Enviando…' : 'Enviar mensaje'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Preguntas frecuentes */}
      <Card className="space-y-5">
        <div>
          <h2 className="font-semibold text-fg">Conexión de WhatsApp</h2>
          <div className="mt-2">
            <Faq items={CONNECTION_FAQ} />
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-fg">Preguntas frecuentes</h2>
          <div className="mt-2">
            <Faq items={GENERAL_FAQ} />
          </div>
        </div>
      </Card>
    </div>
  );
}
