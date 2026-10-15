/**
 * Disponibilidad de los canales de Meta en el texto público (FAQ, ciudades).
 * Cambia a `true` cuando Meta apruebe Messenger e Instagram para RenBotIA, junto
 * con FACEBOOK_MESSENGER_ENABLED / FACEBOOK_INSTAGRAM_ENABLED en Render.
 */
export const META_CHANNELS_LIVE = false;

/** Respuesta honesta a "¿atiende Instagram/Messenger?". */
export const META_CHANNELS_ANSWER = META_CHANNELS_LIVE
  ? 'Sí. El mismo bot responde WhatsApp, los mensajes directos de Instagram, Messenger y el chat de tu sitio web.'
  : 'Muy pronto: la conexión con Instagram y Messenger ya está lista y en revisión de Meta. Hoy el mismo bot atiende tu WhatsApp y el chat de tu sitio web, y en cuanto Meta lo habilite podrás sumar Instagram y Messenger sin volver a entrenarlo.';

/** Lista de canales que se pueden conectar hoy (para frases como "conectas tu …"). */
export const CHANNELS_TODAY = META_CHANNELS_LIVE
  ? 'tu propio WhatsApp, Instagram, Messenger o tu sitio web'
  : 'tu propio WhatsApp o tu sitio web (Instagram y Messenger, muy pronto)';

/** Frase de canales para descripciones ("por WhatsApp y tu sitio…"). */
export const CHANNELS_SHORT = META_CHANNELS_LIVE ? 'WhatsApp, Instagram y tu sitio' : 'WhatsApp y tu sitio web';
export const CHANNELS_LONG = META_CHANNELS_LIVE
  ? 'WhatsApp, Instagram, Messenger y tu sitio web'
  : 'WhatsApp y tu sitio web (Instagram y Messenger, muy pronto)';
