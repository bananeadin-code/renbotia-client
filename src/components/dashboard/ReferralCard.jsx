import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { referralApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Icon } from '../ui/Icon.jsx';

/**
 * "Invita y gana 1 mes de Pro" (Inicio, arriba). Es un regalo ÚNICO: al llegar a
 * 3 negocios registrados con tu enlace se entrega y la tarjeta pasa a un estado
 * compacto de agradecimiento.
 */
export function ReferralCard() {
  const [r, setR] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    referralApi
      .get()
      .then((d) => {
        setR(d);
        // Desde Facturación o la landing se llega con #invita: llevarlo a la tarjeta.
        if (window.location.hash === '#invita') {
          setTimeout(() => document.getElementById('invita')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
        }
      })
      .catch(() => setR(null));
  }, []);

  if (!r?.code) return null;

  const link = `${window.location.origin}/registro?ref=${r.code}`;
  const done = r.progress ?? 0;
  const message = `Te recomiendo RenBotIA: un asistente con IA que contesta WhatsApp, Instagram y tu sitio por ti, las 24 horas. Pruébalo gratis: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('No se pudo copiar. Selecciona el enlace y cópialo.');
    }
  }

  // Regalo ya entregado: agradecimiento compacto (sin empujar más).
  if (r.claimed) {
    return (
      <div id="invita" className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
          <Icon name="gift" size={18} />
        </span>
        <p className="min-w-0 flex-1 text-sm text-fg">
          <strong>Ganaste tu mes de Pro.</strong>{' '}
          <span className="text-muted">Gracias por recomendarnos: tu enlace sigue activo para que más negocios nos conozcan.</span>
        </p>
        <button type="button" onClick={copy} className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
          {copied ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>
    );
  }

  return (
    <section
      id="invita"
      className="relative scroll-mt-20 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-emerald-500 p-5 text-white shadow-pop sm:p-6"
    >
      {/* Brillo decorativo */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
            <Icon name="gift" size={14} /> Regalo de bienvenida
          </span>
          <h2 className="mt-3 text-xl font-extrabold leading-tight sm:text-2xl">Invita a 3 negocios y gana 1 mes de Pro gratis</h2>
          <p className="mt-1.5 max-w-xl text-sm text-white/85">
            Cuando 3 negocios creen su cuenta con tu enlace, activamos tu mes de Pro. Si ya pagas un plan, te llega como
            créditos que no caducan. Es un regalo único.
          </p>

          {/* Avance hacia el regalo */}
          <div className="mt-4 flex items-center gap-2" aria-label={`${done} de ${r.perReward} negocios invitados`}>
            {Array.from({ length: r.perReward }).map((_, i) => (
              <span
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                  i < done ? 'bg-white text-brand-700' : 'border-2 border-dashed border-white/50 text-white/80'
                }`}
              >
                {i < done ? <Icon name="check" size={16} /> : i + 1}
              </span>
            ))}
            <span className="ml-1 text-sm font-medium text-white/90">
              {done === 0 ? 'Invita a tu primer negocio' : `¡Vas ${done} de ${r.perReward}! Te ${r.nextIn === 1 ? 'falta 1' : `faltan ${r.nextIn}`}`}
            </span>
          </div>
          {r.pending > 0 && (
            <p className="mt-2 text-xs text-white/75">
              {r.pending} {r.pending === 1 ? 'persona se registró' : 'personas se registraron'} y aún no termina de crear su negocio.
            </p>
          )}
        </div>

        <div className="w-full shrink-0 space-y-2 lg:w-80">
          <div className="flex items-center gap-1.5 rounded-xl bg-white/15 p-1.5 pl-3 backdrop-blur">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-white">{link.replace(/^https?:\/\//, '')}</span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-white/90"
            >
              <Icon name={copied ? 'check' : 'copy'} size={14} />
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Icon name="whatsapp" size={17} /> Compartir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Anuncio pequeño del regalo (Facturación). Solo aparece si aún no se reclama.
 */
export function ReferralTeaser() {
  const [r, setR] = useState(null);
  useEffect(() => {
    referralApi.get().then(setR).catch(() => setR(null));
  }, []);
  if (!r?.code || r.claimed) return null;
  return (
    <Link
      to="/dashboard#invita"
      className="group flex items-center gap-3 rounded-2xl border border-brand-400/40 bg-brand-500/[0.06] px-4 py-3 transition hover:border-brand-500"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
        <Icon name="gift" size={18} />
      </span>
      <p className="min-w-0 flex-1 text-sm text-fg">
        <strong>¿Un mes de Pro gratis?</strong>{' '}
        <span className="text-muted">
          Invita a 3 negocios con tu enlace{r.progress ? ` (llevas ${r.progress} de ${r.perReward})` : ''}.
        </span>
      </p>
      <Icon name="arrowRight" size={16} className="shrink-0 text-brand-600 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
