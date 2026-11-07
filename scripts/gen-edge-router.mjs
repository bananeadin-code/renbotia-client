/**
 * Genera la CloudFront Function que hace en AWS lo que hacía vercel.json:
 *  - www.renbotia.com → renbotia.com (301).
 *  - /api/* (salvo media y widget, que CloudFront manda a Render) → api.renbotia.com (302).
 *  - Páginas pregeneradas para Google (las que escribe prerender-seo.mjs) → su index.html.
 *  - Todo lo demás (panel, login, rutas inexistentes) → /app.html (la SPA).
 *
 * Conoce EXACTAMENTE qué páginas existen (desde el mismo contenido que usa el
 * prerender), así no hace falta convertir los errores 403/404 de S3 en la app:
 * eso rompería los 404/403 reales que el widget recibe de Render.
 *
 * Uso: node scripts/gen-edge-router.mjs  →  escribe infra/frontend/edge-router.js
 * (lo corre el despliegue en cada publicación; si cambia el contenido, el
 * enrutador se actualiza solo).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOLUTIONS } from '../src/content/solutions.js';
import { CITIES } from '../src/content/cities.js';
import { POSTS } from '../src/content/blog.js';
import { LEGAL } from '../src/content/legal.js';
import { PAGE_SEO } from '../src/content/pages.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'infra', 'frontend', 'edge-router.js');

const API_ORIGIN = 'https://api.renbotia.com';
const APEX = 'renbotia.com';

const set = (arr) => JSON.stringify(Object.fromEntries([...new Set(arr)].sort().map((k) => [k, 1])));

const pages = [...Object.values(PAGE_SEO).map((p) => p.path), ...Object.values(LEGAL).map((d) => `/${d.slug}`)];

const code = `// GENERADO por scripts/gen-edge-router.mjs — no editar a mano.
// CloudFront Function (cloudfront-js-2.0), evento viewer-request.
var PAGES = ${set(pages)};
var GIROS = ${set(SOLUTIONS.map((s) => s.slug))};
var CIUDADES = ${set(CITIES.map((c) => c.slug))};
var BLOG = ${set(POSTS.map((p) => p.slug))};
var API_ORIGIN = '${API_ORIGIN}';
var APEX = '${APEX}';

function qs(q) {
  var parts = [];
  for (var k in q) {
    var v = q[k];
    if (v.multiValue) {
      for (var i = 0; i < v.multiValue.length; i++) parts.push(k + '=' + v.multiValue[i].value);
    } else {
      parts.push(v.value === '' ? k : k + '=' + v.value);
    }
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function redirect(code, location) {
  return { statusCode: code, statusDescription: code === 301 ? 'Moved Permanently' : 'Found', headers: { location: { value: location } } };
}

function handler(event) {
  var req = event.request;
  var uri = req.uri;
  var host = req.headers.host ? req.headers.host.value : '';

  // www → dominio principal
  if (host.indexOf('www.') === 0) return redirect(301, 'https://' + APEX + uri + qs(req.querystring));

  // API (media y widget los atiende CloudFront con Render como origen)
  if (uri.indexOf('/api/') === 0) return redirect(302, API_ORIGIN + uri + qs(req.querystring));

  // Archivos (tienen extensión): se sirven tal cual desde S3
  var last = uri.substring(uri.lastIndexOf('/') + 1);
  if (last.indexOf('.') !== -1) return req;

  // Sin diagonal final (salvo la raíz)
  var p = uri.length > 1 && uri.charAt(uri.length - 1) === '/' ? uri.slice(0, -1) : uri;
  var seg = p.split('/'); // ['', 'soluciones', 'giro', 'ciudad']

  var pre =
    PAGES[p] ||
    (seg[1] === 'soluciones' && GIROS[seg[2]] && (seg.length === 3 || (seg.length === 4 && CIUDADES[seg[3]]))) ||
    (seg[1] === 'bot-whatsapp' && seg.length === 3 && CIUDADES[seg[2]]) ||
    (seg[1] === 'blog' && seg.length === 3 && BLOG[seg[2]]);

  req.uri = pre ? (p === '/' ? '/index.html' : p + '/index.html') : '/app.html';
  return req;
}
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, code);
console.log(`edge-router.js: ${pages.length} páginas fijas, ${SOLUTIONS.length} giros, ${CITIES.length} ciudades, ${POSTS.length} artículos (${Buffer.byteLength(code)} bytes; límite 10 KB).`);
