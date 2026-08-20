import { Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { SupportWidget } from '../../components/whatsapp/SupportWidget.jsx';
import { SpotlightCard } from '../../components/ui/SpotlightCard.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { SOLUTIONS } from '../../content/solutions.js';
import { useSeo, SITE_URL } from '../../lib/seo.js';

/** Índice de soluciones por industria (hub de enlazado interno + SEO). */
export default function Solutions() {
  useSeo({
    title: 'Soluciones por industria — Bot de WhatsApp con IA | RenBotIA',
    description:
      'Bots de WhatsApp con IA para despachos legales, contadores, consultoras, agencias y restaurantes en México. Encuentra la solución para tu sector.',
    path: '/soluciones',
    image: `${SITE_URL}/og-cover.svg`,
  });

  return (
    <div className="min-h-screen bg-canvas">
      <PublicNav />

      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-5xl px-4 pb-2 pt-14 text-center sm:pt-20">
          <span className="eyebrow">Soluciones</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-5xl">
            Un bot para tu sector
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Cada negocio recibe preguntas distintas. Mira cómo un asistente de WhatsApp con IA
            resuelve las de tu industria.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOLUTIONS.map((s) => (
            <Link key={s.slug} to={`/soluciones/${s.slug}`}>
              <SpotlightCard className="group h-full p-6">
                <div className="relative z-[2]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 ring-1 ring-inset ring-brand-500/20">
                    <Icon name={s.icon} size={22} />
                  </span>
                  <h2 className="mt-4 text-lg font-bold text-fg group-hover:text-brand-700 dark:group-hover:text-brand-300">
                    {s.industry}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted">{s.lede}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                    Ver solución <Icon name="chevronRight" size={16} />
                  </span>
                </div>
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </main>

      <PublicFooter />
      <SupportWidget />
    </div>
  );
}
