import { useEffect, useState } from 'react';
import { referralApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * "Invita y gana" (Inicio): enlace de invitación y avance hacia el próximo mes de
 * Pro gratis (cada 3 negocios que se registran con el enlace y crean su negocio).
 */
export function ReferralCard() {
  const [r, setR] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    referralApi.get().then(setR).catch(() => setR(null));
  }, []);

  if (!r?.code) return null;

  const link = `${window.location.origin}/registro?ref=${r.code}`;
  const done = r.perReward - r.nextIn; // de 0 a 2 en el grupo actual
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

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
              <Icon name="users" size={18} />
            </span>
            <h2 className="font-semibold text-fg">Invita y gana 1 mes de Pro</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            Por cada <strong className="text-fg">3 negocios</strong> que creen su cuenta con tu enlace, te regalamos un mes de
            Pro. Si ya pagas un plan, te llega como créditos que no caducan.
          </p>

          {/* Avance del grupo actual */}
          <div className="mt-4 flex items-center gap-2" aria-label={`${done} de ${r.perReward} negocios invitados`}>
            {Array.from({ length: r.perReward }).map((_, i) => (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                  i < done ? 'border-brand-500 bg-brand-500 text-white' : 'border-dashed border-line text-subtle'
                }`}
              >
                {i < done ? <Icon name="check" size={14} /> : i + 1}
              </span>
            ))}
            <span className="ml-1 text-sm text-muted">
              {done === 0 ? 'Invita a tu primer negocio' : `Te ${r.nextIn === 1 ? 'falta 1' : `faltan ${r.nextIn}`} para tu mes de Pro`}
            </span>
          </div>
          {(r.rewards > 0 || r.pending > 0) && (
            <p className="mt-2 text-xs text-subtle">
              {r.rewards > 0 && `Has ganado ${r.rewards} ${r.rewards === 1 ? 'mes' : 'meses'} de Pro. `}
              {r.pending > 0 && `${r.pending} ${r.pending === 1 ? 'persona se registró' : 'personas se registraron'} y aún no crea su negocio.`}
            </p>
          )}
        </div>

        <div className="w-full shrink-0 space-y-2 sm:w-72">
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-canvas p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{link.replace(/^https?:\/\//, '')}</span>
            <Button size="sm" variant="secondary" onClick={copy} className="shrink-0">
              <Icon name={copied ? 'check' : 'copy'} size={14} />
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Icon name="whatsapp" size={17} /> Compartir por WhatsApp
          </a>
        </div>
      </div>
    </Card>
  );
}
