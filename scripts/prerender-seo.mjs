/**
 * SEO al compilar (corre después de `vite build`):
 *
 * 1) Genera un HTML propio para cada página pública de contenido (soluciones por
 *    giro, giro × ciudad, páginas por ciudad y artículos del blog) con su
 *    <title>, descripción, canonical, Open Graph, datos estructurados y el
 *    CONTENIDO visible dentro de #root. Así Google y las redes leen cada página
 *    sin ejecutar JavaScript. Al cargar, React reemplaza ese contenido por la app.
 * 2) Escribe dist/sitemap.xml con todas las URLs (estáticas + generadas).
 *
 * Vercel sirve estos archivos antes que la reescritura a index.html de la SPA.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOLUTIONS } from '../src/content/solutions.js';
import { CITIES, nearbyCities, localCopy } from '../src/content/cities.js';
import { POSTS } from '../src/content/blog.js';
import { LEGAL } from '../src/content/legal.js';
import { PAGE_SEO, PRICE_SUMMARY } from '../src/content/pages.js';
import { execFileSync } from 'node:child_process';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://renbotia.com';
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const today = new Date().toISOString().slice(0, 10);

/** Fecha (AAAA-MM-DD) del último commit que tocó estos archivos; si no hay historial, hoy. */
function lastChanged(...files) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { cwd: ROOT, encoding: 'utf8' }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : today;
  } catch {
    return today;
  }
}

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Sustituye title/description/canonical/OG/Twitter del index.html base. */
function withHead(html, { title, description, url, jsonLd }) {
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[\s\S]*?("\s*\/>)/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[\s\S]*?("\s*\/>)/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[\s\S]*?("\s*\/>)/, `$1${esc(description)}$2`);
  if (jsonLd) {
    out = out.replace(
      '</head>',
      `    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n  </head>`
    );
  }
  return out;
}

/** Contenido visible (semántico y legible sin estilos) dentro de #root. */
function withBody(html, inner) {
  const box = `<div style="max-width:760px;margin:0 auto;padding:32px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6">${inner}</div>`;
  return html.replace('<div id="root"></div>', `<div id="root">${box}</div>`);
}

function write(route, html) {
  const dir = path.join(DIST, route.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const links = (items) => `<ul>${items.map(([href, text]) => `<li><a href="${href}">${esc(text)}</a></li>`).join('')}</ul>`;
const faqLd = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
const serviceLd = (name, audience, area, url) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name,
  serviceType: 'Asistente de WhatsApp con inteligencia artificial',
  provider: { '@type': 'Organization', name: 'RenBotIA', url: SITE },
  areaServed: area,
  ...(audience ? { audience: { '@type': 'BusinessAudience', name: audience } } : {}),
  url,
});

const urls = []; // [{ loc, priority, changefreq, lastmod }]
const add = (loc, priority, changefreq = 'monthly', lastmod = today) => urls.push({ loc, priority, changefreq, lastmod });

const CONTENT = {
  solutions: lastChanged('src/content/solutions.js', 'src/content/cities.js', 'src/content/channels.js'),
  cities: lastChanged('src/content/cities.js', 'src/content/solutions.js', 'src/content/channels.js'),
  pages: lastChanged('src/content/pages.js', 'index.html'),
  legal: lastChanged('src/content/legal.js'),
  blog: lastChanged('src/content/blog.js'),
};

let pages = 0;

// Páginas fijas: cada una con su título, descripción, canonical y vista previa propia
// (antes heredaban las del inicio, con canonical hacia "/").
const page = (key, body, { jsonLd } = {}) => {
  const seo = PAGE_SEO[key];
  const head = withHead(template, { title: seo.title, description: seo.description, url: `${SITE}${seo.path}`, jsonLd });
  write(seo.path, body ? withBody(head, body) : head);
  pages++;
};

add('/', '1.0', 'weekly', CONTENT.pages);

page(
  'precios',
  `<nav><a href="/">RenBotIA</a> › Precios</nav>
   <h1>Planes simples y transparentes</h1>
   <p>Elige según cuántas conversaciones atiende tu bot al mes. Precios en pesos mexicanos; cambia o cancela cuando quieras.</p>
   ${PRICE_SUMMARY.map((p) => `<h2>${esc(p.name)} — ${p.price ? `$${p.price} MXN al mes` : 'Gratis'}</h2><p>${esc(p.detail)}</p>`).join('')}
   <p><a href="/registro">Crear mi bot gratis</a></p>`,
  {
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'RenBotIA',
      description: PAGE_SEO.precios.description,
      brand: { '@type': 'Brand', name: 'RenBotIA' },
      offers: PRICE_SUMMARY.map((p) => ({
        '@type': 'Offer',
        name: p.name,
        price: String(p.price),
        priceCurrency: 'MXN',
        url: `${SITE}/precios`,
        availability: 'https://schema.org/InStock',
      })),
    },
  }
);
add('/precios', '0.8', 'monthly', CONTENT.pages);

page(
  'blog',
  `<nav><a href="/">RenBotIA</a> › Blog</nav><h1>Blog de RenBotIA</h1><p>${esc(PAGE_SEO.blog.description)}</p>
   ${links(POSTS.map((p) => [`/blog/${p.slug}`, p.title]))}`
);
add('/blog', '0.7', 'weekly', CONTENT.blog);

page(
  'soluciones',
  `<nav><a href="/">RenBotIA</a> › Soluciones</nav><h1>Soluciones por industria</h1><p>${esc(PAGE_SEO.soluciones.description)}</p>
   ${links(SOLUTIONS.map((s) => [`/soluciones/${s.slug}`, s.industry]))}
   <h2>Por ciudad</h2>${links(CITIES.map((c) => [`/bot-whatsapp/${c.slug}`, c.name]))}`
);
add('/soluciones', '0.8', 'monthly', CONTENT.solutions);

page(
  'contacto',
  `<nav><a href="/">RenBotIA</a> › Contacto</nav><h1>Contacto</h1><p>${esc(PAGE_SEO.contacto.description)}</p>
   <p>Correo: <a href="mailto:servicios@renbotia.com">servicios@renbotia.com</a></p>`
);
add('/contacto', '0.5', 'monthly', CONTENT.pages);

// Documentos legales completos (Meta y Google los revisan sin JS).
for (const doc of Object.values(LEGAL)) {
  const route = `/${doc.slug}`;
  const paras = (arr = []) => arr.map((t) => `<p>${esc(t)}</p>`).join('');
  const body = `<nav><a href="/">RenBotIA</a> › ${esc(doc.title)}</nav><article><h1>${esc(doc.title)}</h1>
    <p>Última actualización: ${esc(doc.updated)}</p><p>${esc(doc.intro)}</p>
    ${doc.sections.map((sec) => `<h2>${esc(sec.h)}</h2>${paras(sec.p)}${sec.ul ? list(sec.ul) : ''}${paras(sec.p2)}`).join('')}</article>`;
  write(route, withBody(withHead(template, { title: `${doc.title} | RenBotIA`, description: doc.description, url: `${SITE}${route}` }), body));
  pages++;
  if (doc.slug !== 'eliminar-datos') add(route, '0.3', 'yearly', CONTENT.legal);
}

// Solo cabecera (sin contenido): para que el enlace compartido muestre su propio título.
page('registro');
page('login');
page('status');


// Soluciones por giro y giro × ciudad.
for (const sol of SOLUTIONS) {
  const route = `/soluciones/${sol.slug}`;
  const others = SOLUTIONS.filter((s) => s.slug !== sol.slug);
  write(
    route,
    withBody(
      withHead(template, {
        title: sol.title,
        description: sol.description,
        url: `${SITE}${route}`,
        jsonLd: [faqLd(sol.faqs), serviceLd(sol.h1, sol.industry, { '@type': 'Country', name: 'México' }, `${SITE}${route}`)],
      }),
      `<nav><a href="/">RenBotIA</a> › <a href="/soluciones">Soluciones</a></nav>
       <h1>${esc(sol.h1)}</h1><p>${esc(sol.lede)}</p>
       <h2>Lo que hoy te quita tiempo</h2>${list(sol.pains)}
       <h2>Cómo te ayuda RenBotIA</h2>${list(sol.benefits)}
       <h2>Preguntas frecuentes</h2>${sol.faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}
       <p><a href="/registro">Crear mi bot gratis</a> · <a href="/precios">Ver planes</a></p>
       <h2>${esc(sol.industry)} en tu ciudad</h2>${links(CITIES.map((c) => [`/soluciones/${sol.slug}/${c.slug}`, `${sol.industry} en ${c.name}`]))}
       <h2>Para otros sectores</h2>${links(others.map((o) => [`/soluciones/${o.slug}`, o.industry]))}`
    )
  );
  add(route, '0.7', 'monthly', CONTENT.solutions);
  pages++;

  for (const city of CITIES) {
    const r = `${route}/${city.slug}`;
    const local = localCopy(sol, city);
    const faqs = [local.faq, ...sol.faqs];
    const area = { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: city.state } };
    write(
      r,
      withBody(
        withHead(template, {
          title: local.title,
          description: local.description,
          url: `${SITE}${r}`,
          jsonLd: [faqLd(faqs), serviceLd(local.h1, sol.industry, area, `${SITE}${r}`)],
        }),
        `<nav><a href="/">RenBotIA</a> › <a href="/soluciones">Soluciones</a> › <a href="${route}">${esc(sol.industry)}</a> › ${esc(city.name)}</nav>
         <h1>${esc(local.h1)}</h1><p>${esc(local.lede)}</p>
         <h2>${esc(sol.industry)} en ${esc(city.name)}</h2><p>${esc(local.local)}</p>
         <h2>Lo que hoy te quita tiempo</h2>${list(sol.pains)}
         <h2>Cómo te ayuda RenBotIA</h2>${list(sol.benefits)}
         <h2>Preguntas frecuentes</h2>${faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}
         <p><a href="/registro">Crear mi bot gratis</a> · <a href="/#pruebalo">Pruébalo con tu negocio</a></p>
         <h2>Cerca de ${esc(city.name)}</h2>${links(nearbyCities(city, 6).map((c) => [`${route}/${c.slug}`, `${sol.industry} en ${c.name}`]))}
         <h2>Otros negocios en ${esc(city.name)}</h2>${links(others.map((o) => [`/soluciones/${o.slug}/${city.slug}`, `${o.industry} en ${city.name}`]))}`
      )
    );
    add(r, '0.6', 'monthly', CONTENT.solutions);
    pages++;
  }
}

// Páginas por ciudad.
for (const city of CITIES) {
  const r = `/bot-whatsapp/${city.slug}`;
  const title = `Bot de WhatsApp con IA para negocios en ${city.name} | RenBotIA`;
  const description = `Atiende a tus clientes de ${city.name}, ${city.state} por WhatsApp, Instagram y tu sitio las 24 horas con un asistente de IA entrenado con tu negocio. Pruébalo gratis.`;
  const area = { '@type': 'City', name: city.name, containedInPlace: { '@type': 'State', name: city.state } };
  write(
    r,
    withBody(
      withHead(template, {
        title,
        description,
        url: `${SITE}${r}`,
        jsonLd: serviceLd(`Bot de WhatsApp con IA para negocios en ${city.name}`, null, area, `${SITE}${r}`),
      }),
      `<nav><a href="/">RenBotIA</a> › <a href="/soluciones">Soluciones</a> › ${esc(city.name)}</nav>
       <h1>Tu asistente de WhatsApp con IA en ${esc(city.name)}</h1>
       <p>Responde al instante a tus clientes de ${esc(city.name)}, ${esc(city.state)}: precios, horarios, citas y pedidos por WhatsApp, Instagram, Messenger y tu sitio web, las 24 horas y con la información de tu negocio.</p>
       <h2>Para cada tipo de negocio en ${esc(city.name)}</h2>${links(SOLUTIONS.map((s) => [`/soluciones/${s.slug}/${city.slug}`, `${s.industry} en ${city.name}`]))}
       <h2>Cerca de ${esc(city.name)}</h2>${links(nearbyCities(city, 6).map((c) => [`/bot-whatsapp/${c.slug}`, c.name]))}`
    )
  );
  add(r, '0.6', 'monthly', CONTENT.cities);
  pages++;
}

// Blog.
for (const post of POSTS) {
  const r = `/blog/${post.slug}`;
  const body = (post.body || [])
    .map((b) =>
      b.type === 'h2' ? `<h2>${esc(b.text)}</h2>` : b.type === 'ul' ? list(b.items || []) : `<p>${esc(b.text)}</p>`
    )
    .join('');
  write(
    r,
    withBody(
      withHead(template, {
        title: `${post.title} | RenBotIA`,
        description: post.description,
        url: `${SITE}${r}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { '@type': 'Organization', name: 'RenBotIA' },
          publisher: { '@type': 'Organization', name: 'RenBotIA' },
          mainEntityOfPage: `${SITE}${r}`,
        },
      }),
      `<nav><a href="/">RenBotIA</a> › <a href="/blog">Blog</a></nav><article><h1>${esc(post.title)}</h1>${body}</article>`
    )
  );
  add(r, '0.6', 'monthly', post.updated || post.date || CONTENT.blog);
  pages++;
}

// Respaldo de la SPA (vercel.json reescribe aquí lo que no es un archivo): panel,
// login, rutas inexistentes… Sin canonical y con noindex, para que Google no
// indexe URLs inventadas como copias del inicio (soft 404).
fs.writeFileSync(
  path.join(DIST, 'app.html'),
  template
    .replace(/\s*<link rel="canonical"[^>]*>/, '')
    .replace(/(<meta name="robots" content=")[^"]*(")/, '$1noindex, follow$2')
);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${SITE}${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
console.log(`SEO: ${pages} páginas pre-renderizadas y ${urls.length} URLs en el sitemap.`);
