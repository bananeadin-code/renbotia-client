/**
 * Burbuja de mensaje estilo WhatsApp. `mine` = mensaje del usuario (verde,
 * a la derecha); si no, respuesta del bot (blanco, a la izquierda).
 * `images` = imágenes reales que el bot adjuntó ([{label, url}]).
 */
export function ChatBubble({ content, time, mine, images }) {
  const hasImages = Array.isArray(images) && images.length > 0;
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
          mine
            ? 'bg-whatsapp-bubbleOut dark:bg-whatsapp-darkBubbleOut'
            : 'bg-whatsapp-bubbleIn dark:bg-whatsapp-darkBubbleIn'
        }`}
      >
        {hasImages && (
          <div className="mb-1.5 space-y-1.5">
            {images.map((img, i) => (
              <figure key={i} className="overflow-hidden rounded-md">
                <img
                  src={img.url}
                  alt={img.label || 'imagen'}
                  className="max-h-72 w-full rounded-md bg-black/5 object-contain"
                />
                {img.label && (
                  <figcaption className="mt-0.5 px-0.5 text-[11px] text-slate-500 dark:text-whatsapp-darkTime">
                    {img.label}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
        {content && (
          <p className="whitespace-pre-wrap break-words text-slate-800 dark:text-whatsapp-darkText">
            {content}
          </p>
        )}
        {time && (
          <span className="ml-2 mt-1 block text-right text-[10px] text-slate-400 dark:text-whatsapp-darkTime">
            {time}
          </span>
        )}
      </div>
    </div>
  );
}
