/**
 * Atribución de marketing: de qué campaña o anuncio llegó la persona.
 *
 * Al cargar cualquier página se leen utm_*, gclid y fbclid de la URL y se guarda
 * el último origen con campaña (modelo "último clic no directo", el que usan
 * Meta y Google Ads) durante 90 días. Al registrarse, se envía al servidor.
 */
const KEY = 'rb_acq';
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && Date.now() - new Date(v.firstSeenAt).getTime() < TTL_MS) return v;
  } catch {
    /* sin almacenamiento: se trabaja sin atribución */
  }
  return null;
}

/** Llamar una vez al iniciar la app (antes de que el router cambie la URL). */
export function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const pick = (k) => (params.get(k) || '').slice(0, 300);
    const hit = {
      source: pick('utm_source'),
      medium: pick('utm_medium'),
      campaign: pick('utm_campaign'),
      content: pick('utm_content'),
      term: pick('utm_term'),
      gclid: pick('gclid'),
      fbclid: pick('fbclid'),
    };
    const hasCampaign = Object.values(hit).some(Boolean);
    const prev = read();
    if (hasCampaign) {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          ...hit,
          landing: window.location.pathname.slice(0, 300),
          referrer: (document.referrer || '').slice(0, 300),
          firstSeenAt: new Date().toISOString(),
        })
      );
    } else if (!prev) {
      // Primera visita sin campaña: se guarda de dónde vino (búsqueda, redes, directo).
      const ref = document.referrer || '';
      const own = ref && new URL(ref).host === window.location.host;
      localStorage.setItem(
        KEY,
        JSON.stringify({
          landing: window.location.pathname.slice(0, 300),
          referrer: own ? '' : ref.slice(0, 300),
          firstSeenAt: new Date().toISOString(),
        })
      );
    }
  } catch {
    /* sin almacenamiento */
  }
}

const cookie = (name) => {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : '';
};

/** Lo que se manda al registrarse (incluye cookies del Píxel si las hay y el consentimiento). */
export function getAcquisition(adsConsent) {
  const a = read() || {};
  const clean = Object.fromEntries(Object.entries(a).filter(([, v]) => v));
  return {
    ...clean,
    fbp: cookie('_fbp').slice(0, 100) || undefined,
    fbc: cookie('_fbc').slice(0, 400) || undefined,
    adsConsent: Boolean(adsConsent),
  };
}
