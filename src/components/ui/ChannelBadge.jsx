import { Icon } from './Icon.jsx';

/** Canales de origen: etiqueta, ícono y color de marca de cada uno. */
export const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', icon: 'whatsapp', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  facebook: { label: 'Messenger', icon: 'messenger', cls: 'bg-[#0866FF]/10 text-[#0866FF] dark:text-[#5B9BFF]' },
  instagram: { label: 'Instagram', icon: 'instagram', cls: 'bg-[#E1306C]/10 text-[#E1306C] dark:text-[#F06A97]' },
  web: { label: 'Sitio web', icon: 'globe', cls: 'bg-brand-500/10 text-brand-600 dark:text-brand-300' },
  simulator: { label: 'Simulador', icon: 'message', cls: 'bg-surface2 text-muted' },
};

/** Etiqueta del canal de donde vino algo (conversación, registro captado…). */
export function ChannelBadge({ channel, size = 'sm', className = '' }) {
  const m = CHANNEL_META[channel];
  if (!m) return null;
  const s = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${s} ${m.cls} ${className}`} title={`Llegó por ${m.label}`}>
      <Icon name={m.icon} size={size === 'xs' ? 10 : 12} /> {m.label}
    </span>
  );
}
