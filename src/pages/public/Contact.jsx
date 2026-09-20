import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { Card, Button, Input, Textarea, Select, Alert } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { contactApi } from '../../api/endpoints.js';
import { useSeo } from '../../lib/seo.js';

const TOPICS = ['Conexión de WhatsApp', 'Ventas y planes', 'Facturación', 'Soporte', 'Otro'];

// Prellenado del tema desde ?motivo= (p. ej. el botón "Pedir ayuda" del asistente
// de conexión llega con motivo=conexion).
const MOTIVO_TO_TOPIC = { conexion: 'Conexión de WhatsApp', ventas: 'Ventas y planes', factura: 'Facturación', soporte: 'Soporte' };

export default function Contact() {
  useSeo({
    title: 'Contacto | RenBotIA',
    description: 'Escríbenos: dudas sobre planes, conexión de WhatsApp, facturación o soporte. Te respondemos pronto.',
    path: '/contacto',
  });

  const [params] = useSearchParams();
  const initialTopic = MOTIVO_TO_TOPIC[params.get('motivo')] || TOPICS[0];

  const [form, setForm] = useState({ name: '', email: '', topic: initialTopic, message: '', website: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2 || !form.email.includes('@') || form.message.trim().length < 10) {
      setError('Completa tu nombre, un correo válido y un mensaje de al menos 10 caracteres.');
      return;
    }
    setSending(true);
    try {
      await contactApi.submit(form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar. Intenta de nuevo en un momento.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <Reveal>
          <div className="text-center">
            <span className="eyebrow justify-center">Contacto</span>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
              Hablemos
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              ¿Dudas sobre planes, conexión de WhatsApp o facturación? Escríbenos y te respondemos
              pronto, normalmente el mismo día hábil.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-8">
          {sent ? (
            <Card className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
                <Icon name="checkCircle" size={30} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-fg">¡Mensaje enviado!</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Gracias, {form.name.split(' ')[0]}. Recibimos tu mensaje y te responderemos al correo
                que nos dejaste lo antes posible.
              </p>
            </Card>
          ) : (
            <Card>
              <form onSubmit={onSubmit} className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Tu nombre"
                    name="name"
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Nombre y apellido"
                    maxLength={80}
                    required
                  />
                  <Input
                    label="Tu correo"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="tucorreo@ejemplo.com"
                    maxLength={120}
                    required
                  />
                </div>

                <Select label="Tema" value={form.topic} onChange={set('topic')}>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>

                <Textarea
                  label="Mensaje"
                  name="message"
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Cuéntanos en qué te podemos ayudar…"
                  rows={5}
                  maxLength={2000}
                  required
                />

                {/* Honeypot anti-bots: oculto para personas; los bots lo llenan. */}
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={set('website')}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-subtle">Te responderemos a tu correo.</p>
                  <Button type="submit" disabled={sending}>
                    {sending ? 'Enviando…' : 'Enviar mensaje'}
                    {!sending && <Icon name="send" size={16} />}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </Reveal>

        <p className="mt-6 text-center text-sm text-subtle">
          También puedes escribirnos a{' '}
          <a href="mailto:servicios@renbotia.com" className="font-medium text-brand-600 hover:underline">
            servicios@renbotia.com
          </a>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
