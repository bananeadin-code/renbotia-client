/**
 * Código de referido del enlace de invitación (?ref=CODIGO). Se guarda al llegar a
 * cualquier página y se manda al crear la cuenta (correo o Google). Dura 30 días.
 */
const KEY = 'renbotia:ref';
const TTL = 30 * 24 * 60 * 60 * 1000;

export function captureReferral() {
  try {
    const code = new URLSearchParams(window.location.search).get('ref');
    if (code && /^[A-Za-z0-9]{5,12}$/.test(code)) {
      localStorage.setItem(KEY, JSON.stringify({ code: code.toUpperCase(), at: Date.now() }));
    }
  } catch {
    /* sin almacenamiento: el referido no se registra */
  }
}

export function getReferral() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || 'null');
    return r?.code && Date.now() - r.at < TTL ? r.code : undefined;
  } catch {
    return undefined;
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
