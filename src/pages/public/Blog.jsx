import { Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { SupportWidget } from '../../components/whatsapp/SupportWidget.jsx';
import { SpotlightCard } from '../../components/ui/SpotlightCard.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { POSTS } from '../../content/blog.js';
import { useSeo, SITE_URL } from '../../lib/seo.js';

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** Índice del blog: recursos sobre atención por WhatsApp e IA para negocios en México. */
export default function Blog() {
  useSeo({
    title: 'Blog — Atención por WhatsApp con IA para negocios | RenBotIA',
    description:
      'Guías y consejos prácticos para automatizar la atención por WhatsApp de tu negocio en México: bots con IA, agendado de citas y experiencia del cliente.',
    path: '/blog',
    image: `${SITE_URL}/og-cover.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog de RenBotIA',
      url: `${SITE_URL}/blog`,
      inLanguage: 'es-MX',
      blogPost: POSTS.map((p) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        description: p.description,
        datePublished: p.date,
        url: `${SITE_URL}/blog/${p.slug}`,
      })),
    },
  });

  return (
    <div className="min-h-screen bg-canvas">
      <PublicNav />
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-3xl px-4 pb-2 pt-12 sm:pt-16">
          <span className="eyebrow">Blog</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Recursos para atender mejor por WhatsApp
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Ideas prácticas para automatizar la atención de tu negocio y darle a tus clientes en
            México una experiencia de primer nivel.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <div className="space-y-4">
          {POSTS.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="block">
              <SpotlightCard className="group p-6">
                <div className="relative z-[2]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
                    <span>{fmtDate(post.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingMin} min de lectura</span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-fg group-hover:text-brand-700 dark:group-hover:text-brand-300 sm:text-xl">
                    {post.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted">{post.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-surface2 px-2.5 py-0.5 text-[11px] font-medium text-muted"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                      Leer <Icon name="chevronRight" size={16} />
                    </span>
                  </div>
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
