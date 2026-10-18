/**
 * Disponibilidad de los canales de Meta en el texto público (FAQ, ciudades,
 * soluciones). Cada uno se enciende cuando Meta lo aprueba, junto con su
 * variable en Render (FACEBOOK_MESSENGER_ENABLED / FACEBOOK_INSTAGRAM_ENABLED).
 *
 * - Messenger: aprobado por Meta el 18 de octubre de 2026.
 * - Instagram: pendiente de su propia revisión (instagram_manage_messages).
 */
export const MESSENGER_LIVE = true;
export const INSTAGRAM_LIVE = false;

const live = ['WhatsApp', MESSENGER_LIVE && 'Messenger', INSTAGRAM_LIVE && 'Instagram'].filter(Boolean);
const soon = [!MESSENGER_LIVE && 'Messenger', !INSTAGRAM_LIVE && 'Instagram'].filter(Boolean);

// ['A','B','C'] + 'y' → "A, B y C"
const list = (arr, conj) => (arr.length > 1 ? `${arr.slice(0, -1).join(', ')} ${conj} ${arr.at(-1)}` : arr[0] || '');
const soonNote = soon.length ? ` (${list(soon, 'y')}, muy pronto)` : '';

/** Respuesta honesta a "¿atiende mi Instagram?". */
export const INSTAGRAM_ANSWER = INSTAGRAM_LIVE
  ? `Sí. El mismo bot responde ${list([...live, 'el chat de tu sitio web'], 'y')}.`
  : `Muy pronto: la conexión con Instagram ya está lista y en revisión de Meta. Hoy el mismo bot atiende ${list([...live, 'el chat de tu sitio web'], 'y')}, y en cuanto Meta lo habilite podrás sumar Instagram sin volver a entrenarlo.`;

/** Lista de canales que se pueden conectar hoy (para frases como "conectas tu …"). */
export const CHANNELS_TODAY = `tu propio ${list([...live, 'tu sitio web'], 'o')}${soonNote}`;

/** Frase de canales para descripciones ("por WhatsApp, Messenger y tu sitio…"). */
export const CHANNELS_SHORT = list([...live, 'tu sitio web'], 'y');
export const CHANNELS_LONG = `${list([...live, 'tu sitio web'], 'y')}${soonNote}`;
