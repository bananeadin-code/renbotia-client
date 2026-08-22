import { useEffect } from 'react';

// Dominio público del sitio (definitivo). También aparece en index.html,
// sitemap.xml y robots.txt.
export const SITE_URL = 'https://renbotia.com';
export const SITE_NAME = 'RenBotIA';

// URL de tu Google Business Profile (perfil de empresa en Google/Maps). Pégala
// aquí cuando lo crees; el enlace en el footer aparece solo si está definida.
// Enlazarlo desde el sitio refuerza el SEO local (México/Durango).
export const GOOGLE_BUSINESS_URL = '';

/** Crea o actualiza un <meta name="..."> o <meta property="..."> idempotente. */
function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Crea o actualiza el <link rel="canonical">. */
function setCanonical(href) {
  if (!href) return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Ajusta el <head> para la página actual (SPA). Google ejecuta JS y lee estos
 * cambios; también mejora cómo se comparte cada URL en redes.
 *
 * @param {object} p
 * @param {string} p.title        Título completo (incluye la marca si aplica).
 * @param {string} [p.description]
 * @param {string} [p.path]       Ruta relativa ('/blog', '/precios', …) para canonical/OG.
 * @param {string} [p.type]       og:type ('website' | 'article').
 * @param {string} [p.image]      URL absoluta de la imagen OG.
 * @param {object} [p.jsonLd]     Datos estructurados schema.org para inyectar.
 * @param {boolean}[p.noindex]    Si true, marca la página como noindex (404, utilitarias).
 */
export function useSeo({ title, description, path = '/', type = 'website', image, jsonLd, noindex = false }) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    if (title) document.title = title;
    setMeta('name', 'description', description);
    setCanonical(url);
    // La etiqueta robots del index.html es 'index, follow'; aquí la sobreescribimos
    // por página cuando no debe indexarse, y la restauramos al desmontar.
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', type);
    if (image) setMeta('property', 'og:image', image);

    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    if (image) setMeta('name', 'twitter:image', image);

    // Datos estructurados por página (se limpia al desmontar).
    let script;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-page-jsonld', 'true');
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      if (script) script.remove();
    };
  }, [title, description, path, type, image, jsonLd, noindex]);
}
