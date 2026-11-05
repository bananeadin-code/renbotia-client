/**
 * Preferencia de cookies de medición y publicidad (las necesarias para la sesión
 * no se pueden apagar). Se guarda en este navegador y se puede cambiar desde
 * el pie de página ("Preferencias de cookies").
 */
const KEY = 'rb_consent';
const listeners = new Set();

/** @returns {{ ads: boolean, at: string } | null} null = aún no decide. */
export function getConsent() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function setConsent(ads) {
  const value = { ads: Boolean(ads), at: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* sin almacenamiento: vale para esta visita */
  }
  listeners.forEach((fn) => fn(value));
  return value;
}

export function onConsentChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Pide volver a mostrar el aviso (enlace del pie de página). */
export function reopenConsent() {
  window.dispatchEvent(new Event('rb:consent-open'));
}
