import { Link, useParams } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { Button } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs.jsx';
import { getPost, POSTS } from '../../content/blog.js';
import { useSeo, SITE_URL } from '../../lib/seo.js';

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** Artículo del blog. Incluye datos estructurados de tipo Article para SEO. */
export default function BlogPost() {
  const { slug } = useParams();
  const post = getPost(slug);

  useSeo({
    title: post
      ? `${post.title} | RenBotIA`
      : 'Artículo no encontrado | RenBotIA',
    description: post?.description,
    path: post ? `/blog/${post.slug}` : '/blog',
    type: 'article',
    image: `${SITE_URL}/og-cover.png`,
    jsonLd: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          inLanguage: 'es-MX',
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
          image: `${SITE_URL}/og-cover.png`,
          author: { '@type': 'Organization', name: 'RenBotIA' },
          publisher: {
            '@type': 'Organization',
            name: 'RenBotIA',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-cover.png` },
          },
        }
      : undefined,
  });

  if (!post) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicNav />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-fg">Artículo no encontrado</h1>
          <p className="mt-2 text-muted">El artículo que buscas no existe o cambió de dirección.</p>
          <Link to="/blog" className="mt-6 inline-block">
            <Button variant="secondary">Volver al blog</Button>
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-canvas">
      <PublicNav />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <Breadcrumbs
          items={[
            { name: 'Inicio', to: '/' },
            { name: 'Blog', to: '/blog' },
            { name: post.title },
          ]}
        />

        <article className="mt-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
            <span>{fmtDate(post.date)}</span>
            <span aria-hidden="true">·</span>
            <span>{post.readingMin} min de lectura</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-fg sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-lg text-muted">{post.description}</p>

          <div className="mt-8 space-y-5">
            {post.body.map((block, i) => {
              if (block.type === 'h2') {
                return (
                  <h2 key={i} className="pt-2 text-xl font-bold text-fg sm:text-2xl">
                    {block.text}
                  </h2>
                );
              }
              if (block.type === 'ul') {
                return (
                  <ul key={i} className="space-y-2 pl-1">
                    {block.items.map((it, j) => (
                      <li key={j} className="flex gap-2 text-[15px] leading-relaxed text-fg/90">
                        <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-600" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="text-[15px] leading-relaxed text-fg/90">
                  {block.text}
                </p>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-10 rounded-2xl border border-brand-200 bg-brand-50/60 p-6 text-center dark:border-brand-900/60 dark:bg-brand-900/20">
            <h3 className="text-lg font-bold text-fg">Prueba tu asistente de WhatsApp gratis</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              Arma tu bot con la información de tu negocio y pruébalo en un simulador en minutos.
            </p>
            <Link to="/registro" className="mt-4 inline-block">
              <Button>
                Empezar gratis <Icon name="chevronRight" size={16} />
              </Button>
            </Link>
          </div>
        </article>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtle">
              Sigue leyendo
            </h2>
            <div className="space-y-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="block rounded-xl border border-line p-4 transition hover:border-brand-300 hover:bg-surface2/50"
                >
                  <div className="font-semibold text-fg">{r.title}</div>
                  <div className="mt-0.5 text-sm text-muted">{r.description}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
