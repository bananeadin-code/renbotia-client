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

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://renbotia.com';
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const today = new Date().toISOString().slice(0, 10);

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

const urls = []; // [{ loc, priority, changefreq }]
const add = (loc, priority, changefreq = 'monthly') => urls.push({ loc, priority, changefreq });

// Estáticas (las mismas que el sitemap anterior).
add('/', '1.0', 'weekly');
add('/precios', '0.8');
add('/blog', '0.7', 'weekly');
add('/soluciones', '0.8');
add('/contacto', '0.5');
add('/privacidad', '0.3', 'yearly');
add('/terminos', '0.3', 'yearly');

let pages = 0;

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
  add(route, '0.7');
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
    add(r, '0.6');
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
  add(r, '0.6');
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
  add(r, '0.6');
  pages++;
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${SITE}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
console.log(`SEO: ${pages} páginas pre-renderizadas y ${urls.length} URLs en el sitemap.`);
