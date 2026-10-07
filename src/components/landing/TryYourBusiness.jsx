import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { demoApi } from '../../api/endpoints.js';
import { DemoChat } from '../whatsapp/DemoChat.jsx';
import { Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Reveal } from '../ui/Reveal.jsx';
import { DEMO_PROFILE_KEY } from '../../lib/demoProfile.js';

/**
 * "Pruébalo con tu negocio": el visitante pega su sitio (o describe su negocio)
 * y en segundos chatea con un bot de SU negocio, sin registrarse. El perfil se
 * guarda en el navegador para que, si crea su cuenta, el registro inicial ya
 * venga lleno con lo que el bot aprendió.
 */


const STEPS = ['Leyendo tu negocio…', 'Identificando tus servicios…', 'Escribiendo respuestas…', 'Entrenando a tu bot…'];

function learnedChips(p) {
  return [
    p.services?.length && `${p.services.length} ${p.services.length === 1 ? 'servicio' : 'servicios'}`,
    p.hours && 'Horario',
    p.location && 'Ubicación',
    p.basePricing && 'Precios',
    p.faqs?.length && `${p.faqs.length} preguntas frecuentes`,
  ].filter(Boolean);
}

export function TryYourBusiness() {
  const [mode, setMode] = useState('url'); // url | text
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { profile, token }

  // Mensajes de progreso mientras se arma el bot (tarda unos segundos).
  useEffect(() => {
    if (!loading) return undefined;
    setStep(0);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200);
    return () => clearInterval(id);
  }, [loading]);

  async function generate(e) {
    e.preventDefault();
    setError('');
    const body = mode === 'url' ? { url: url.trim() } : { description: text.trim() };
    if (mode === 'url' && !body.url) return setError('Pega el enlace de tu sitio.');
    if (mode === 'text' && body.description.length < 20) {
      return setError('Cuéntanos un poco más: qué vendes o qué servicios das, y dónde.');
    }
    setLoading(true);
    try {
      const data = await demoApi.profile(body);
      setResult(data);
      try {
        localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify({ ...data.profile, savedAt: Date.now() }));
      } catch {
        /* sin almacenamiento: el registro empieza vacío */
      }
    } catch (err) {
      const code = err.response?.data?.details?.code;
      setError(err.response?.data?.message || 'No pudimos armar tu demo. Intenta de nuevo.');
      if (['SOCIAL_URL', 'EMPTY_SITE', 'FETCH_FAILED', 'NOT_HTML'].includes(code)) setMode('text');
    } finally {
      setLoading(false);
    }
  }

  const p = result?.profile;

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
      <Reveal>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
          <Icon name="sparkles" size={13} /> Sin registrarte · 30 segundos
        </span>
        <h2 className="mt-4 text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          {p ? `Este es el bot de ${p.name}` : 'Pruébalo con tu propio negocio'}
        </h2>

        {!p ? (
          <>
            <p className="mt-4 max-w-md text-muted">
              Pega el enlace de tu sitio o cuéntanos qué haces. Lo leemos, entrenamos un bot con tu información y lo
              pruebas aquí mismo, como si fueras tu cliente.
            </p>

            <form onSubmit={generate} noValidate className="mt-6 max-w-md space-y-3">
              <div role="tablist" aria-label="Cómo quieres darnos tu información" className="inline-flex rounded-xl border border-line bg-surface p-1">
                {[
                  ['url', 'Tengo sitio web', 'globe'],
                  ['text', 'Lo describo', 'edit'],
                ].map(([val, label, icon]) => (
                  <button
                    key={val}
                    type="button"
                    role="tab"
                    aria-selected={mode === val}
                    onClick={() => {
                      setMode(val);
                      setError('');
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      mode === val ? 'bg-brand-600 text-white' : 'text-muted hover:text-fg'
                    }`}
                  >
                    <Icon name={icon} size={14} /> {label}
                  </button>
                ))}
              </div>

              {mode === 'url' ? (
                <input
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="minegocio.com"
                  maxLength={300}
                  aria-label="Enlace de tu sitio web"
                  disabled={loading}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
                />
              ) : (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  maxLength={1500}
                  placeholder="Ej. Somos una panadería en el centro de Durango. Hacemos pan dulce y pasteles por encargo desde $350. Abrimos de lunes a sábado de 7 a 21."
                  aria-label="Describe tu negocio"
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg outline-none transition placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
                />
              )}

              {error && (
                <p className="flex items-start gap-1.5 text-sm text-red-600" role="alert">
                  <Icon name="alert" size={15} className="mt-0.5 shrink-0" /> {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="shine-cta w-full justify-center sm:w-auto">
                {loading ? (
                  <>
                    <Icon name="spinner" size={17} className="animate-spin" /> {STEPS[step]}
                  </>
                ) : (
                  <>
                    Crear mi bot de prueba <Icon name="arrowRight" size={18} />
                  </>
                )}
              </Button>
              <p className="text-xs text-subtle">No guardamos tu información hasta que crees tu cuenta.</p>
            </form>
          </>
        ) : (
          <div className="animate-fade-up">
            <p className="mt-4 max-w-md text-muted">
              Lo entrenamos con lo que encontramos de tu negocio. Escríbele como si fueras un cliente. En tu cuenta lo
              afinas con tus propias respuestas.
            </p>
            {learnedChips(p).length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Tu bot ya aprendió</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {learnedChips(p).map((c) => (
                    <li
                      key={c}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-sm text-fg"
                    >
                      <Icon name="check" size={14} className="text-brand-600" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/registro?desde=demo">
                <Button className="shine-cta">
                  Activar este bot gratis <Icon name="arrowRight" size={18} />
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setError('');
                }}
                className="text-sm font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
              >
                Probar con otro negocio
              </button>
            </div>
            <p className="mt-3 text-xs text-subtle">
              Al crear tu cuenta, todo lo que aprendió ya viene cargado. Luego lo conectas a tu WhatsApp, Instagram o sitio.
            </p>
          </div>
        )}
      </Reveal>

      <Reveal delay={120}>
        {p ? (
          <DemoChat
            key={result.token}
            className="mx-auto w-full max-w-md"
            heightClass="h-[440px]"
            botName={p.botName}
            welcome={`¡Hola! Soy el asistente de ${p.name}. Pregúntame lo que te preguntaría un cliente.`}
            starters={(p.faqs || []).map((f) => f.question).slice(0, 3)}
            sendFn={(msg, history) => demoApi.send(msg, history, result.token)}
            cta={{ text: 'Este bot ya conoce tu negocio.', to: '/registro?desde=demo', label: 'Activarlo gratis' }}
            inputLabel={`Mensaje para el bot de ${p.name}`}
          />
        ) : (
          <div className="relative">
            <DemoChat className="mx-auto w-full max-w-md" heightClass="h-[440px]" />
            <p className="mx-auto mt-3 max-w-md text-center text-xs text-subtle">
              Mientras tanto, prueba el de un negocio de ejemplo.
            </p>
          </div>
        )}
      </Reveal>
    </div>
  );
}
