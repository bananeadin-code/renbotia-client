import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';
import { MESSENGER_LIVE, INSTAGRAM_LIVE } from '../../content/channels.js';

/**
 * Portada: canales donde atiende el bot (estilo "Crea con nosotros"). Los que
 * aún no están disponibles se muestran atenuados con "Próximamente" y sin enlace.
 */
const CHANNELS = [
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    icon: 'whatsapp',
    color: 'text-[#25D366]',
    desc: 'Responde en tu número de WhatsApp Business.',
    available: true,
  },
  {
    key: 'web',
    name: 'Chat de tu sitio web',
    icon: 'globe',
    color: 'text-brand-600 dark:text-brand-400',
    desc: 'Un chat en tu página con una línea de código.',
    available: true,
  },
  {
    key: 'messenger',
    name: 'Facebook Messenger',
    icon: 'messenger',
    color: 'text-[#0866FF]',
    desc: 'Mensajes de tu página de Facebook.',
    available: MESSENGER_LIVE,
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: 'text-[#E1306C]',
    desc: 'Mensajes directos de tu cuenta de Instagram.',
    available: INSTAGRAM_LIVE,
  },
];

function ChannelCard({ c }) {
  const body = (
    <>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface ${c.color} shadow-card`}>
        <Icon name={c.icon} size={28} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-lg font-semibold text-fg">{c.name}</span>
          {c.available ? (
            <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
              Disponible
            </span>
          ) : (
            <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-line">
              Próximamente
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{c.desc}</span>
      </span>
      {c.available && (
        <Icon name="arrowRight" size={22} className="shrink-0 text-fg transition-transform duration-200 group-hover:translate-x-1" />
      )}
    </>
  );
  const base = 'flex items-center gap-4 rounded-2xl bg-surface2 px-5 py-5 ring-1 ring-line sm:px-6';
  return c.available ? (
    <Link
      to="/registro"
      className={`group ${base} transition duration-200 hover:-translate-y-0.5 hover:ring-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
    >
      {body}
    </Link>
  ) : (
    <div className={`${base} opacity-70`} aria-disabled="true">
      {body}
    </div>
  );
}

export function ChannelsShowcase() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-20 text-center">
      <h2 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">Atiende donde ya te escriben</h2>
      <p className="mx-auto mt-3 max-w-2xl text-muted">
        Un solo bot, entrenado una vez, responde en todos tus canales con la misma información.
        {!MESSENGER_LIVE && !INSTAGRAM_LIVE && ' Messenger e Instagram llegan muy pronto.'}
        {MESSENGER_LIVE && !INSTAGRAM_LIVE && ' Instagram llega muy pronto.'}
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <ChannelCard key={c.key} c={c} />
        ))}
      </div>
    </section>
  );
}
