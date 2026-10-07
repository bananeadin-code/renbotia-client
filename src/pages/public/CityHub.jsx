import { Link, useParams } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { SupportWidget } from '../../components/whatsapp/SupportWidget.jsx';
import { SpotlightCard } from '../../components/ui/SpotlightCard.jsx';
import { Reveal } from '../../components/ui/Reveal.jsx';
import { Button } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs.jsx';
import { SOLUTIONS } from '../../content/solutions.js';
import { getCity, nearbyCities } from '../../content/cities.js';
import { useSeo, SITE_URL } from '../../lib/seo.js';

/**
 * Página por ciudad ("bot de WhatsApp en Monterrey"): presenta RenBotIA para los
 * negocios de esa ciudad y enlaza a cada giro en ella y a las ciudades cercanas.
 */
export default function CityHub() {
  const { ciudad } = useParams();
  const city = getCity(ciudad);
  const path = `/bot-whatsapp/${ciudad}`;

  useSeo({
    title: city
      ? `Bot de WhatsApp con IA para negocios en ${city.name} | RenBotIA`
      : 'Ciudad no encontrada | RenBotIA',
    description: city
      ? `Atiende a tus clientes de ${city.name}, ${city.state} por WhatsApp, Instagram y tu sitio las 24 horas con un asistente de IA entrenado con tu negocio. Pruébalo gratis.`
      : undefined,
    path,
    image: `${SITE_URL}/og-cover.png`,
    noindex: !city,
    jsonLd: city
      ? {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: `Bot de WhatsApp con IA para negocios en ${city.name}`,
          serviceType: 'Asistente de WhatsApp con inteligencia artificial',
          provider: { '@type': 'Organization', name: 'RenBotIA', url: SITE_URL },
          areaServed: { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: city.state } },
          url: `${SITE_URL}${path}`,
        }
      : undefined,
  });

  if (!city) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicNav />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-fg">Ciudad no encontrada</h1>
          <Link to="/soluciones" className="mt-6 inline-block">
            <Button variant="secondary">Ver soluciones</Button>
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const nearby = nearbyCities(city, 6);

  return (
    <div className="min-h-screen bg-canvas">
      <PublicNav />
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-4xl px-4 pb-4 pt-14 sm:pt-20">
          <Breadcrumbs
            items={[
              { name: 'Inicio', to: '/' },
              { name: 'Soluciones', to: '/soluciones' },
              { name: city.name },
            ]}
          />
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-tight text-fg sm:text-5xl">
            Tu asistente de WhatsApp con IA en {city.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Responde al instante a tus clientes de {city.name}, {city.state}: precios, horarios, citas y pedidos por
            WhatsApp, Instagram, Messenger y tu sitio web, las 24 horas y con la información de tu negocio.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/#pruebalo">
              <Button size="lg" className="shine-cta w-full sm:w-auto">
                Pruébalo con tu negocio <Icon name="arrowRight" size={18} />
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

      <main className="mx-auto max-w-4xl px-4 py-14">
        <Reveal>
          <h2 className="text-xl font-bold text-fg sm:text-2xl">Para cada tipo de negocio en {city.name}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {SOLUTIONS.map((s) => (
              <Link key={s.slug} to={`/soluciones/${s.slug}/${city.slug}`}>
                <SpotlightCard className="group h-full p-4">
                  <div className="relative z-[2] flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                      <Icon name={s.icon} size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-fg group-hover:text-brand-700 dark:group-hover:text-brand-300">
                        {s.industry}
                      </span>
                      <span className="block truncate text-xs text-muted">en {city.name}</span>
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            ))}
          </div>
        </Reveal>

        {nearby.length > 0 && (
          <Reveal className="mt-12">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">Cerca de {city.name}</h2>
            <div className="flex flex-wrap gap-2">
              {nearby.map((c) => (
                <Link
                  key={c.slug}
                  to={`/bot-whatsapp/${c.slug}`}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-fg transition hover:border-brand-300"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </Reveal>
        )}
      </main>
      <PublicFooter />
      <SupportWidget />
    </div>
  );
}
