/**
 * Cabecera del chat estilo WhatsApp: avatar con inicial, nombre del bot y
 * estado ("en línea" o "escribiendo...").
 */
export function ChatHeader({ botName = 'Asistente', typing }) {
  const initial = botName.trim().charAt(0).toUpperCase() || 'A';
  return (
    <div className="flex items-center gap-3 bg-whatsapp-header px-4 py-3 text-white dark:bg-whatsapp-darkHeader">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 font-semibold">
        {initial}
      </div>
      <div className="leading-tight">
        <div className="font-medium">{botName}</div>
        <div className="text-xs text-white/80">{typing ? 'escribiendo…' : 'en línea'}</div>
      </div>
    </div>
  );
}
