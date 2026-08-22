import { Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { getLegal } from '../../content/legal.js';
import { useSeo, SITE_URL } from '../../lib/seo.js';

/**
 * Renderiza un documento legal (Aviso de Privacidad o Términos). El documento se
 * elige con la prop `slug` desde la ruta.
 */
export default function Legal({ slug }) {
  const doc = getLegal(slug);

  useSeo({
    title: doc ? `${doc.title} | RenBotIA` : 'Documento no encontrado | RenBotIA',
    description: doc?.description,
    path: `/${slug}`,
    image: `${SITE_URL}/og-cover.png`,
  });

  if (!doc) {
    return (
      <div className="flex min-h-screen flex-col">
        <PublicNav />
        <main className="mx-auto max-w-2xl flex-1 px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-fg">Documento no encontrado</h1>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const other = slug === 'privacidad' ? 'terminos' : 'privacidad';
  const otherLabel = other === 'terminos' ? 'Términos y Condiciones' : 'Aviso de Privacidad';

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        <header className="border-b border-line pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">{doc.title}</h1>
          <p className="mt-2 text-sm text-subtle">Última actualización: {doc.updated}</p>
        </header>

        <p className="mt-6 text-[15px] leading-relaxed text-muted">{doc.intro}</p>

        <div className="mt-8 space-y-8">
          {doc.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-bold text-fg">{s.h}</h2>
              {s.p?.map((para, i) => (
                <p key={i} className="mt-2 text-[15px] leading-relaxed text-fg/90">
                  {para}
                </p>
              ))}
              {s.ul && (
                <ul className="mt-3 space-y-2 pl-1">
                  {s.ul.map((it, i) => (
                    <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-fg/90">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.p2?.map((para, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-fg/90">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm">
          <Link to={`/${other}`} className="font-medium text-brand-600 hover:underline">
            Ver también: {otherLabel}
          </Link>
          <a href="mailto:servicios@renbotia.com" className="text-muted hover:text-fg">
            servicios@renbotia.com
          </a>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
