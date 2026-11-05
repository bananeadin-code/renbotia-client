/**
 * Plan y forma de pago que eligió el visitante en Precios, para que el
 * onboarding arranque con esa selección (vale 2 días). Solo comodidad: si el
 * navegador no guarda nada, el onboarding empieza en Free como siempre.
 */
const KEY = 'rb_plan_intent';
const TTL = 2 * 24 * 60 * 60 * 1000;

export function savePlanIntent(planKey, cycle = 'mensual') {
  try {
    localStorage.setItem(KEY, JSON.stringify({ planKey, cycle, at: Date.now() }));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export function readPlanIntent() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!d || Date.now() - (d.at || 0) > TTL) return null;
    if (!['free', 'pro', 'elite'].includes(d.planKey)) return null;
    return { planKey: d.planKey, cycle: d.cycle === 'anual' ? 'anual' : 'mensual' };
  } catch {
    return null;
  }
}

export function clearPlanIntent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada */
  }
}
