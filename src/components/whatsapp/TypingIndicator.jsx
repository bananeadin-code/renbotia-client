/**
 * Indicador "escribiendo..." con tres puntos animados (CSS en index.css).
 */
export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-lg bg-whatsapp-bubbleIn px-4 py-3 shadow-sm dark:bg-whatsapp-darkBubbleIn">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
