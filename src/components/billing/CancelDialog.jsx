import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Button, Textarea } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/** Mismos motivos que el servidor (CANCEL_REASONS). */
export const CANCEL_REASONS = {
  precio: 'Es muy caro para mí',
  no_lo_uso: 'No lo estoy usando',
  no_pude_conectar: 'No pude conectar o configurar mi WhatsApp',
  falta_funcion: 'Le falta algo que necesito',
  otro_servicio: 'Me cambio a otro servicio',
  temporal: 'Es temporal (cierre o pausa del negocio)',
  otro: 'Otro motivo',
};

const money = (n) => `$${Number(n || 0).toLocaleString('es-MX')}`;

/**
 * Cancelar con encuesta: primero el motivo y, según el motivo, una alternativa
 * (bajar de plan, pasar a anual, videollamada de ayuda). Siempre se puede
 * cancelar de todos modos; nunca se bloquea.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(reason:string, comment:string) => void} props.onConfirm
 * @param {string} props.currentKey
 * @param {object} [props.currentPlan]   Plan actual (con .annual).
 * @param {boolean} props.annualActive
 * @param {string} props.accessUntil     Fecha hasta la que conserva su plan.
 * @param {string} [props.bookingUrl]
 * @param {(planKey:string) => void} props.onDowngrade
 * @param {() => void} props.onAnnual
 * @param {boolean} [props.busy]
 */
export function CancelDialog({ open, onClose, onConfirm, currentKey, currentPlan, annualActive, accessUntil, bookingUrl, onDowngrade, onAnnual, busy }) {
  const [step, setStep] = useState('reason');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (open) {
      setStep('reason');
      setReason('');
      setComment('');
    }
  }, [open]);

  // Alternativas según el motivo.
  const offers = [];
  if (reason === 'precio') {
    if (currentKey === 'elite') {
      offers.push({
        icon: 'sliders',
        title: 'Baja a Pro por $479 al mes',
        text: 'Conservas tu bot, el chat de tu sitio y el seguimiento automático, a menos de la mitad del precio. El cambio aplica en tu renovación.',
        cta: 'Bajar a Pro',
        onClick: () => onDowngrade('pro'),
      });
    }
    if (!annualActive && currentPlan?.annual) {
      offers.push({
        icon: 'card',
        title: `Paga anual: ${money(currentPlan.annual.perMonthMXN)} al mes`,
        text: `${currentPlan.name} anual por ${money(currentPlan.annual.priceMXN)}: ahorras ${money(currentPlan.annual.savingsMXN)} y no pierdes los días que ya pagaste. Garantía de 30 días.`,
        cta: 'Ver plan anual',
        onClick: onAnnual,
      });
    }
  }
  if (['no_pude_conectar', 'no_lo_uso', 'falta_funcion'].includes(reason) && bookingUrl) {
    offers.push({
      icon: 'calendarCheck',
      title: 'Te ayudamos gratis por videollamada',
      text:
        reason === 'no_pude_conectar'
          ? 'En una llamada corta dejamos tu WhatsApp conectado y tu bot respondiendo.'
          : reason === 'falta_funcion'
            ? 'Cuéntanos qué necesitas: muchas veces ya se puede con la configuración correcta.'
            : 'Revisamos juntos cómo sacarle provecho a tu bot en tu negocio.',
      cta: 'Agendar videollamada',
      href: bookingUrl,
    });
  }

  function next() {
    if (offers.length) setStep('offer');
    else onConfirm(reason, comment);
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Cancelar plan" size="md">
      {step === 'reason' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Antes de cancelar, ¿nos cuentas por qué? Nos ayuda a mejorar. Conservas tu plan hasta el{' '}
            <strong className="text-fg">{accessUntil}</strong>; después tu cuenta pasa a Free con tu bot y tu configuración.
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="Motivo de cancelación">
            {Object.entries(CANCEL_REASONS).map(([k, label]) => (
              <label
                key={k}
                className={`flex min-h-[40px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                  reason === k ? 'border-brand-600 bg-brand-500/5 text-fg' : 'border-line text-fg hover:bg-surface2'
                }`}
              >
                <input type="radio" name="cancel-reason" className="h-4 w-4 accent-brand-700" checked={reason === k} onChange={() => setReason(k)} />
                {label}
              </label>
            ))}
          </div>
          <Textarea
            label="Comentario (opcional)"
            rows={3}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué podríamos mejorar?"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
              Mantener mi plan
            </Button>
            <Button variant="secondary" size="sm" onClick={next} disabled={!reason || busy}>
              Continuar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">Antes de irte, esto podría servirte:</p>
          {offers.map((o) => (
            <div key={o.title} className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Icon name={o.icon} size={20} className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <div className="font-semibold text-fg">{o.title}</div>
                  <p className="text-sm text-muted">{o.text}</p>
                </div>
              </div>
              {o.href ? (
                <a href={o.href} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button size="sm">{o.cta}</Button>
                </a>
              ) : (
                <Button size="sm" className="shrink-0" onClick={o.onClick} disabled={busy}>
                  {o.cta}
                </Button>
              )}
            </div>
          ))}
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
              Mantener mi plan
            </Button>
            <Button variant="danger" size="sm" onClick={() => onConfirm(reason, comment)} disabled={busy}>
              Cancelar de todos modos
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
