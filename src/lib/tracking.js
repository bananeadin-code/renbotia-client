/**
 * Medición de campañas (Google Tag Manager + modo de consentimiento).
 *
 * - Antes de decidir, todo arranca en "denegado": no se cargan etiquetas de
 *   publicidad ni cookies de medición.
 * - Si la persona acepta, se carga GTM (VITE_GTM_ID). Dentro de GTM la agencia
 *   configura el Píxel de Meta y Google Ads usando los eventos de abajo.
 * - Cada evento lleva `event_id`, el mismo que el servidor manda a la API de
 *   Conversiones de Meta: así Meta cuenta una sola conversión.
 *
 * Eventos (dataLayer): sign_up · channel_connected · purchase.
 */
import { getConsent, onConsentChange } from './consent.js';

const GTM_ID = import.meta.env.VITE_GTM_ID || '';
let loaded = false;

function dl() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}
// Mismo formato que gtag(): consent/config se pasan como `arguments`.
function gtag() {
  // eslint-disable-next-line prefer-rest-params
  dl().push(arguments);
}

function applyConsent(c, mode) {
  const v = c?.ads ? 'granted' : 'denied';
  gtag('consent', mode, {
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
    analytics_storage: v,
  });
}

function loadGtm() {
  if (loaded || !GTM_ID || !/^GTM-[A-Z0-9]+$/.test(GTM_ID)) return;
  loaded = true;
  dl().push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
}

/** Llamar una vez al iniciar la app. */
export function initTracking() {
  const c = getConsent();
  applyConsent(c, 'default');
  if (c?.ads) loadGtm();
  onConsentChange((next) => {
    applyConsent(next, 'update');
    if (next?.ads) loadGtm();
  });
}

/** Envía un evento de conversión (solo llega a Meta/Google si hubo consentimiento). */
export function track(event, params = {}) {
  try {
    dl().push({ event, ...params });
  } catch {
    /* sin efecto */
  }
}

/** Conectó un canal real (mismo event_id que la API de Conversiones del servidor). */
export function trackChannelConnected(channel, businessId) {
  if (!businessId) return;
  track('channel_connected', { channel, event_id: `ch_${channel}_${businessId}` });
}
