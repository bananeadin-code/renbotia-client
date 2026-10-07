import { Link, useParams } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { SupportWidget } from '../../components/whatsapp/SupportWidget.jsx';
import { SpotlightCard } from '../../components/ui/SpotlightCard.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { Button } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs.jsx';
import { getSolution, SOLUTIONS } from '../../content/solutions.js';
import { CITIES, getCity, nearbyCities, localCopy } from '../../content/cities.js';
import { useSeo, SITE_URL } from '../../lib/seo.js';

/**
 * Página por industria (SEO programático) y, con `:ciudad`, por industria en una
 * ciudad de México ("bot de WhatsApp para dentistas en Monterrey"). Incluye
 * FAQPage y el servicio con su área de cobertura para rich results.
 */
export default function Solution() {
  const { slug, ciudad } = useParams();
  const sol = getSolution(slug);
  const city = ciudad ? getCity(ciudad) : null;
  const notFound = !sol || (ciudad && !city);
  const local = sol && city ? localCopy(sol, city) : null;
  const faqs = sol ? (local ? [local.faq, ...sol.faqs] : sol.faqs) : [];
  const path = sol ? `/soluciones/${sol.slug}${city ? `/${city.slug}` : ''}` : '/soluciones';

  useSeo({
    title: notFound ? 'Solución no encontrada | RenBotIA' : local?.title || sol.title,
    description: local?.description || sol?.description,
    path,
    image: `${SITE_URL}/og-cover.png`,
    noindex: notFound,
    jsonLd: notFound
      ? undefined
      : [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: local?.h1 || sol.h1,
            serviceType: 'Asistente de WhatsApp con inteligencia artificial',
            provider: { '@type': 'Organization', name: 'RenBotIA', url: SITE_URL },
            areaServed: city
              ? { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: city.state } }
              : { '@type': 'Country', name: 'México' },
            audience: { '@type': 'BusinessAudience', name: sol.industry },
            url: `${SITE_URL}${path}`,
          },
        ],
  });

  if (notFound) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicNav />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-fg">Solución no encontrada</h1>
          <Link to="/soluciones" className="mt-6 inline-block">
            <Button variant="secondary">Ver todas las soluciones</Button>
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const others = SOLUTIONS.filter((s) => s.slug !== sol.slug).slice(0, city ? 6 : 3);
  const nearby = city ? nearbyCities(city, 6) : [];

  return (
    <div className="min-h-screen bg-canvas">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-4xl px-4 pb-4 pt-14 sm:pt-20">
          <Breadcrumbs
            items={[
              { name: 'Inicio', to: '/' },
              { name: 'Soluciones', to: '/soluciones' },
              city
                ? { name: sol.industry, to: `/soluciones/${sol.slug}` }
                : { name: sol.industry },
              ...(city ? [{ name: city.name }] : []),
            ]}
          />
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-tight text-fg sm:text-5xl">
            {local?.h1 || sol.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{local?.lede || sol.lede}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/registro">
              <Button size="lg" className="shine-cta w-full sm:w-auto">
                Crear mi bot gratis <Icon name="arrowRight" size={18} />
              </Button>
            </Link>
            <Link to="/precios">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Ver planes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-16">
        {/* Dolores → Beneficios */}
        <Reveal className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
              Lo que hoy te quita tiempo
            </h2>
            <ul className="mt-4 space-y-3">
              {sol.pains.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] text-fg/90">
                  <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-amber-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Cómo te ayuda RenBotIA
            </h2>
            <ul className="mt-4 space-y-3">
              {sol.benefits.map((b) => (
                <li key={b} className="flex gap-3 text-[15px] text-fg/90">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Contexto local (solo en la página de ciudad) */}
        {local && (
          <Reveal className="mt-12 rounded-2xl border border-line bg-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
              <Icon name="building" size={18} className="text-brand-600" />
              {sol.industry} en {city.name}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{local.local}</p>
          </Reveal>
        )}

        {/* Ejemplo de conversación */}
        {sol.example && (
          <Reveal className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
              Un ejemplo
            </h2>
            <div className="mt-4 space-y-2 rounded-2xl border border-line bg-surface2/50 p-5">
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-sm text-white">
                  {sol.example.user}
                </p>
              </div>
              <div className="flex justify-start">
                <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-2 text-sm text-fg">
                  {sol.example.bot}
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <Reveal className="mt-12">
            <h2 className="text-xl font-bold text-fg sm:text-2xl">Preguntas frecuentes</h2>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {faqs.map((f) => (
                <div key={f.q} className="py-4">
                  <h3 className="font-medium text-fg">{f.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.a}</p>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* CTA */}
        <Reveal className="mt-12 rounded-2xl border border-brand-200 bg-brand-50/60 p-7 text-center dark:border-brand-900/60 dark:bg-brand-900/20">
          <h2 className="text-xl font-bold text-fg sm:text-2xl">
            Pruébalo con la información de tu negocio
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Crea tu cuenta gratis, entrena tu bot en minutos y pruébalo en el simulador. Sin tarjeta.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/registro">
              <Button size="lg">
                Empezar gratis <Icon name="arrowRight" size={18} />
              </Button>
            </Link>
            <Link to="/#pruebalo" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
              O pruébalo con tu sitio, sin registrarte
            </Link>
          </div>
        </Reveal>

        {/* Ciudades (enlazado interno local) */}
        <Reveal className="mt-14">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">
            {city ? `Cerca de ${city.name}` : `${sol.industry} en tu ciudad`}
          </h2>
          <div className="flex flex-wrap gap-2">
            {(city ? nearby : CITIES).map((c) => (
              <Link
                key={c.slug}
                to={`/soluciones/${sol.slug}/${c.slug}`}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-fg transition hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
              >
                {c.name}
              </Link>
            ))}
            {city && (
              <Link
                to={`/soluciones/${sol.slug}`}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                Todo México
              </Link>
            )}
          </div>
        </Reveal>

        {/* Otras industrias (enlazado interno) */}
        <Reveal className="mt-14">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtle">
            {city ? `Otros negocios en ${city.name}` : 'Para otros sectores'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} to={`/soluciones/${o.slug}${city ? `/${city.slug}` : ''}`}>
                <SpotlightCard className="group h-full p-4">
                  <div className="relative z-[2] flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                      <Icon name={o.icon} size={18} />
                    </span>
                    <span className="text-sm font-semibold text-fg group-hover:text-brand-700 dark:group-hover:text-brand-300">
                      {o.industry}
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            ))}
          </div>
        </Reveal>
      </main>

      <PublicFooter />
      <SupportWidget />
    </div>
  );
}
