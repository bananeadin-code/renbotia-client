/**
 * Lector de chats EXPORTADOS de WhatsApp ("Exportar chat" → sin archivos), en el
 * navegador. Acepta .txt (Android) y .zip (iPhone trae _chat.txt dentro).
 *
 * Formatos que reconoce (con o sin segundos, 12/24 h, "a. m."/"p. m."):
 *   Android: 12/03/24, 10:15 - Nombre: mensaje
 *   iPhone:  [12/03/24, 10:15:32] Nombre: mensaje
 * Las líneas sin encabezado son continuación del mensaje anterior. Los avisos del
 * sistema (cifrado, "Multimedia omitido", etc.) se descartan.
 *
 * Privacidad: antes de mandar algo al servidor, `anonymize` deja solo "Negocio:"
 * y "Cliente:" y borra teléfonos y correos del texto.
 */

const HEADER =
  /^‎?\[?(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[ap]\.?\s?m\.?)?)\]?\s*(?:-|–)?\s*([^:]{1,60}?):\s(.*)$/i;
const SKIP = [
  /multimedia omitid/i,
  /<media omitted>/i,
  /imagen omitida|video omitido|audio omitido|sticker omitido|documento omitido|gif omitido/i,
  /los mensajes y las llamadas están cifrados/i,
  /messages and calls are end-to-end encrypted/i,
  /^este mensaje fue eliminado$/i,
  /^se eliminó este mensaje$/i,
  /^null$/i,
];

/** Texto de un archivo exportado (.txt o .zip). */
export async function readChatFile(file) {
  if (/\.zip$/i.test(file.name) || file.type === 'application/zip') {
    const { unzipSync, strFromU8 } = await import('fflate');
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (f) => /\.txt$/i.test(f.name),
    });
    const names = Object.keys(files);
    if (!names.length) throw new Error(`"${file.name}" no trae el chat (.txt). Exporta el chat "sin archivos".`);
    return names.map((n) => strFromU8(files[n])).join('\n');
  }
  return file.text();
}

/** Mensajes y participantes de un chat exportado. */
export function parseChat(text) {
  const messages = [];
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/[‎  ]/g, ' ').trimEnd();
    if (!line.trim()) continue;
    const m = HEADER.exec(line);
    if (m) {
      messages.push({ author: m[3].trim(), text: m[4].trim() });
    } else if (messages.length) {
      messages[messages.length - 1].text += `\n${line.trim()}`;
    }
  }
  const clean = messages.filter((msg) => msg.text && !SKIP.some((re) => re.test(msg.text.trim())));
  const counts = new Map();
  for (const msg of clean) counts.set(msg.author, (counts.get(msg.author) || 0) + 1);
  const participants = [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  return { messages: clean, participants };
}

/**
 * Adivina quién es el negocio: el participante que aparece en MÁS chats (al
 * subir varios, el dueño está en todos); con un solo chat, el que más escribe.
 */
export function guessBusiness(chats) {
  const presence = new Map();
  for (const c of chats) {
    for (const p of c.participants) {
      const cur = presence.get(p.name) || { chats: 0, count: 0 };
      presence.set(p.name, { chats: cur.chats + 1, count: cur.count + p.count });
    }
  }
  const ranked = [...presence.entries()].sort((a, b) => b[1].chats - a[1].chats || b[1].count - a[1].count);
  return ranked[0]?.[0] || '';
}

const PHONE = /\+?\d[\d\s().-]{7,}\d/g;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

/**
 * Transcripción anónima para el análisis: "Negocio:" / "Cliente:" y sin datos
 * de contacto. Cada chat se separa con una línea "---".
 * @param {Array<{messages:Array<{author:string,text:string}>}>} chats
 * @param {string[]} businessNames  participantes que son el negocio (dueño o equipo)
 */
export function anonymize(chats, businessNames) {
  const mine = new Set(businessNames);
  // Nombres de los clientes (y cada palabra de su nombre) para quitarlos del texto.
  const customerWords = new Set();
  for (const c of chats) {
    for (const p of c.participants) {
      if (mine.has(p.name)) continue;
      for (const w of p.name.split(/\s+/)) if (w.length >= 3 && !/^\+?\d/.test(w)) customerWords.add(w.toLowerCase());
    }
  }
  const escape = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const namesRe = customerWords.size
    ? new RegExp(`(?<![\\p{L}])(${[...customerWords].map(escape).join('|')})(?![\\p{L}])`, 'giu')
    : null;
  return chats
    .map((c) =>
      c.messages
        .map((m) => {
          const who = mine.has(m.author) ? 'Negocio' : 'Cliente';
          let text = m.text.replace(EMAIL, '[correo]').replace(PHONE, '[teléfono]');
          if (namesRe) text = text.replace(namesRe, '[cliente]');
          text = text.slice(0, 600);
          return `${who}: ${text}`;
        })
        .join('\n')
    )
    .join('\n---\n');
}
