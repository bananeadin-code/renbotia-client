/**
 * Traducción "cupo de IA → conversaciones" para hablarle al cliente en su idioma
 * (no en tokens). Un mensaje del bot consume ~1,200 tokens facturables (con el
 * descuento de caché); una conversación típica ronda varios mensajes, así que
 * usamos ~5,000 tokens por conversación como estimación REDONDA y conservadora.
 * Es una referencia, no un límite exacto: conversaciones más largas gastan más.
 * Ajusta esta constante si cambia el patrón real de uso (verlo en Analíticas).
 */
export const TOKENS_PER_CONVERSATION = 5000;

/** Convierte un cupo de tokens a un número aproximado de conversaciones. */
export function conversationsFor(tokens) {
  if (!tokens || tokens <= 0) return 0;
  return Math.round(tokens / TOKENS_PER_CONVERSATION);
}

/** Texto corto de conversaciones aproximadas (p. ej. "~200"). */
export function fmtConversations(tokens) {
  const n = conversationsFor(tokens);
  if (n >= 1) return `~${n.toLocaleString('es-MX')}`;
  return tokens > 0 ? 'menos de 1' : '0';
}
