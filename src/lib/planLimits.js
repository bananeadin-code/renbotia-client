/**
 * Espejo de las capacidades por plan (fuente de verdad: backend
 * config/constants.js PLAN_LIMITS). Se usa para mostrar/ocultar campos en el
 * panel de entrenamiento y onboarding. El backend igual sanea al guardar.
 */
export const PLAN_LIMITS = {
  free: { maxFaqs: 2, personality: false, tone: false, extraContext: false, maxImages: 0, management: false, multiUser: false, multiChannel: false },
  pro: { maxFaqs: 10, personality: true, tone: true, extraContext: true, maxImages: 0, management: false, multiUser: true, multiChannel: true },
  elite: { maxFaqs: null, personality: true, tone: true, extraContext: true, maxImages: 15, management: true, multiUser: true, multiChannel: true },
};

export function limitsFor(planKey) {
  return PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
}
