import { Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { Button } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { AnimatedChatDemo } from '../../components/whatsapp/AnimatedChatDemo.jsx';
import { DemoChat } from '../../components/whatsapp/DemoChat.jsx';
import { AuroraBackground } from '../../components/ui/AuroraBackground.jsx';
import { SpotlightCard } from '../../components/ui/SpotlightCard.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { AnnouncementBar } from '../../components/landing/AnnouncementBar.jsx';
import { Faq, FAQS } from '../../components/landing/Faq.jsx';
import { StickyMobileCTA } from '../../components/landing/StickyMobileCTA.jsx';
import { useSeo, SITE_URL } from '../../lib/seo.js';

// Datos estructurados FAQPage: Google puede mostrar estas preguntas directo en
// resultados (rich result), subiendo el CTR sin contenido extra.
const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

/**
 * Landing pública. Estructura semántica (h1/h2, section) pensada para SEO local.
 * Diseño alineado a la skill ui-ux-pro-max (íconos SVG, tokens, jerarquía).
 */
const FEATURES = [
  { icon: 'bot', title: 'Entrenado con TU información', desc: 'Cárgale tus FAQs, servicios, horarios y precios. Responde como parte de tu equipo.' },
  { icon: 'clock', title: 'Disponible 24/7', desc: 'Atiende a tus clientes al instante, incluso fuera de horario, sin perder oportunidades.' },
  { icon: 'sliders', title: 'Tono a tu medida', desc: 'Formal para un despacho legal o cercano para una agencia. Tú defines la personalidad.' },
  { icon: 'chart', title: 'Control de consumo', desc: 'Mide cuántas conversaciones atiende y administra tu plan desde un panel claro.' },
];

const SECTORS = ['Despachos legales', 'Contadores', 'Consultoras', 'Agencias de marketing'];

const STEPS = [
  { n: '01', title: 'Configura tu bot', desc: 'Responde 3 pasos: negocio, plan y preguntas frecuentes.' },
  { n: '02', title: 'Entrénalo y pruébalo', desc: 'Ajusta tono e información y pruébalo en el simulador de WhatsApp.' },
  { n: '03', title: 'Atiende sin parar', desc: 'Tu bot responde con tu información, con tu voz, las 24 horas.' },
];

export default function Landing() {
  useSeo({
    title: 'RenBotIA — Bot de WhatsApp con IA para negocios en México',
    description:
      'Automatiza la atención por WhatsApp de tu negocio con un asistente de IA entrenado con tu información. Responde dudas, agenda citas y capta clientes 24/7. Empieza gratis.',
    path: '/',
    image: `${SITE_URL}/og-cover.png`,
    jsonLd: FAQ_JSONLD,
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-500/[0.06] via-canvas to-canvas">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid" />
        <AuroraBackground />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <Icon name="sparkles" size={14} />
              Atención por WhatsApp con IA
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-5xl">
              El asistente de WhatsApp que tu despacho no tiene tiempo de ser
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Automatiza la atención y las preguntas frecuentes de tus clientes. Entrena al bot con
              la información de tu negocio y deja que responda por ti, con tu tono, las 24 horas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/registro">
                <Button size="lg" className="shine-cta w-full sm:w-auto">
                  Empezar gratis
                  <Icon name="arrowRight" size={18} />
                </Button>
              </Link>
              <Link to="/precios">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Ver planes
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-subtle">
              <Icon name="check" size={16} className="text-brand-500" />
              Prueba gratis por uso · Sin tarjeta · Listo en minutos
            </div>
          </div>

          {/* Demo de chat animado (loop). Para usar un video/GIF real grabado en
              WhatsApp a futuro, reemplaza <AnimatedChatDemo/> por, p.ej.:
                <video src="/demo-whatsapp.mp4" autoPlay muted loop playsInline
                       className="mx-auto w-full max-w-sm rounded-2xl shadow-pop" />
              colocando el archivo en client/public/. */}
          <div className="animate-fade-up lg:justify-self-end">
            <AnimatedChatDemo botName="Asistente Legal" />
          </div>
        </div>
      </section>

      {/* Demo interactiva sin registro — el punto de conversión más fuerte */}
      <section className="border-y border-line bg-surface2/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">Pruébalo ahora</span>
            <h2 className="mt-3 text-3xl font-bold text-fg sm:text-4xl">
              Habla con un bot de ejemplo, sin registrarte
            </h2>
            <p className="mt-4 max-w-md text-muted">
              Escríbele como si fueras un cliente. Está entrenado con la información de un negocio de
              ejemplo — el tuyo respondería igual, pero con tus datos, tu tono y tus servicios.
            </p>
            <ul className="mt-6 space-y-2.5">
              {['Responde con información real del negocio', 'Mantiene el contexto de la conversación', 'Se niega a salirse de su rol'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-fg">
                    <Icon name="check" size={17} className="shrink-0 text-brand-600" />
                    {t}
                  </li>
                )
              )}
            </ul>
            <div className="mt-7">
              <Link to="/registro">
                <Button className="shine-cta">
                  Crear mi bot gratis <Icon name="arrowRight" size={18} />
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <DemoChat className="mx-auto w-full max-w-md" heightClass="h-[440px]" />
          </Reveal>
        </div>
      </section>

      {/* Características (bento con glow que sigue el cursor) */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Capacidades</span>
          <h2 className="mt-3 text-3xl font-bold text-fg sm:text-4xl">Todo lo que tu bot necesita</h2>
          <p className="mt-3 text-muted">
            Configúralo una vez y deja que trabaje. Sin código, sin complicaciones.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            // Bento: la 1ª y la 4ª tarjetas ocupan doble ancho en desktop.
            const wide = i === 0 || i === 3 ? 'lg:col-span-2' : 'lg:col-span-1';
            return (
              <Reveal key={f.title} delay={i * 80} className={wide}>
                <SpotlightCard className="group h-full p-6">
                  <div className="relative z-[2] flex h-full flex-col">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 ring-1 ring-inset ring-brand-500/20 dark:text-brand-300">
                      <Icon name={f.icon} size={22} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-fg">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-line bg-surface2/60">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Cómo funciona</span>
            <h2 className="mt-3 text-3xl font-bold text-fg sm:text-4xl">En marcha en minutos</h2>
            <p className="mt-3 text-muted">Tres pasos y tu bot está atendiendo.</p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="h-full rounded-xl border border-line bg-surface p-6 shadow-card">
                  <span className="text-sm font-extrabold tracking-widest text-brand-500">{s.n}</span>
                  <h3 className="mt-3 font-semibold text-fg">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sectores */}
      <Reveal as="section" className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
        <span className="eyebrow">Sectores</span>
        <h2 className="mt-3 text-3xl font-bold text-fg sm:text-4xl">Pensado para tu sector</h2>
        <p className="mt-3 text-muted">
          Ideal para negocios de servicios profesionales que reciben muchas consultas repetidas.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {SECTORS.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-fg shadow-card"
            >
              <Icon name="building" size={16} className="text-brand-500" />
              {s}
            </span>
          ))}
        </div>
        <div className="mt-7">
          <Link to="/soluciones" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
            Ver soluciones por industria <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <Faq />
      </Reveal>

      {/* CTA final */}
      <section className="px-4 py-20">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 px-6 py-16 text-center shadow-pop">
          {/* Glow radial + textura de puntos */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/25 blur-3xl"
          />
          <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Deja de responder las mismas preguntas
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-50">
              Crea tu cuenta, entrena tu bot en minutos y pruébalo en el simulador.
            </p>
            <div className="mt-8">
              <Link to="/registro">
                <Button size="lg" variant="secondary">
                  Crear mi bot ahora
                  <Icon name="arrowRight" size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <PublicFooter />
      <StickyMobileCTA />
    </div>
  );
}
