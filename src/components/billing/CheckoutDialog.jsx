import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { billingApi } from '../../api/endpoints.js';
import { Modal } from '../ui/Modal.jsx';
import { Button, Alert, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { CardSetup } from './CardSetup.jsx';
import { track } from '../../lib/tracking.js';

/**
 * Pago DENTRO del sitio con "tarjeta primero" (como Render): si el negocio aún
 * no tiene tarjeta guardada, primero se agrega; después se cobra con ella. La
 * misma tarjeta queda para la renovación mensual del plan y la recarga
 * automática, así que nunca hay un plan de pago sin forma de renovarse.
 *
 * Sirve para mejorar de plan, comprar créditos o pagar una renovación vencida.
 * Si el banco pide autenticación (3DS), se completa aquí mismo.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {'plan'|'credits'|'renewal'} props.kind
 * @param {string} [props.planKey]
 * @param {'mensual'|'anual'} [props.cycle] Forma de pago del plan.
 * @param {string} [props.packKey]
 * @param {string} props.itemName   Nombre visible del concepto.
 * @param {number} props.amountMXN
 * @param {string} [props.note]     Línea aclaratoria bajo el concepto.
 * @param {(result:any) => void} props.onSuccess
 * @param {(card:object|null) => void} [props.onCardChange]  Avisa si se guardó otra tarjeta.
 */
export function CheckoutDialog({ open, onClose, kind, planKey, cycle = 'mensual', packKey, itemName, amountMXN, note, onSuccess, onCardChange }) {
  const [step, setStep] = useState('loading'); // loading | card | confirm | processing
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');
  const [testMode, setTestMode] = useState(false);
  // Cotización del servidor (monto exacto: anual, fundador o mejora proporcional).
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setStep('loading');
    setQuote(null);
    const quoteReq = kind === 'plan' ? billingApi.quote(planKey, cycle).catch((e) => ({ error: e })) : Promise.resolve(null);
    Promise.all([billingApi.getPaymentMethod(), billingApi.config(), quoteReq])
      .then(([pm, cfg, q]) => {
        setTestMode(String(cfg.publishableKey || '').startsWith('pk_test_'));
        setCard(pm.paymentMethod || null);
        if (q?.error) {
          setError(q.error.response?.data?.message || 'No pudimos calcular el monto. Intenta de nuevo.');
        } else if (q) {
          setQuote(q);
        }
        setStep(pm.paymentMethod ? 'confirm' : 'card');
      })
      .catch((e) => {
        setError(e.response?.data?.message || 'No se pudo cargar tu método de pago.');
        setStep('card');
      });
  }, [open, kind, planKey, cycle]);

  function onCardSaved(result) {
    setCard(result.paymentMethod);
    onCardChange?.(result.paymentMethod);
    setError('');
    setStep('confirm');
  }

  async function pay() {
    setError('');
    setStep('processing');
    try {
      const purchase =
        kind === 'plan' ? { kind, planKey, cycle } : kind === 'credits' ? { kind, packKey } : { kind };
      const data = await billingApi.createIntent(purchase);
      let status = data.status;
      // Autenticación del banco (3DS): se completa en el navegador.
      if (status === 'requires_action' && data.clientSecret) {
        const stripe = await loadStripe(data.publishableKey);
        const { error: actErr, paymentIntent } = await stripe.handleNextAction({ clientSecret: data.clientSecret });
        if (actErr) throw new Error(actErr.message);
        status = paymentIntent?.status;
      }
      if (status !== 'succeeded') throw new Error('Tu banco no aprobó el cargo. Intenta con otra tarjeta.');
      try {
        const result = await billingApi.confirm({ paymentIntentId: data.paymentIntentId });
        if (kind === 'plan' || kind === 'credits') {
          track('purchase', {
            transaction_id: data.paymentIntentId,
            event_id: `pay_${data.paymentIntentId}`,
            value: Number(data.amountMXN ?? total) || 0,
            currency: 'MXN',
            items: [{ item_id: planKey || packKey, item_name: itemName }],
          });
        }
        onSuccess?.(result);
      } catch (e2) {
        // Cobrado pero no entregado (red): reintentar confirm es seguro (idempotente).
        setError(
          e2.response?.data?.message ||
            'El pago se realizó pero no pudimos activarlo todavía. Recarga la página en un momento; si no se refleja, escríbenos.'
        );
        setStep('confirm');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'No se pudo cobrar la tarjeta.');
      setStep('confirm');
    }
  }

  const total = quote?.amountMXN ?? amountMXN;
  const money = `$${Number(total).toLocaleString('es-MX')} MXN`;
  const recurring = kind === 'plan' || kind === 'renewal';
  const annual = kind === 'plan' && cycle === 'anual';
  const startsLater = quote?.startsAt
    ? new Date(quote.startsAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' })
    : '';
  const defaultNote =
    quote?.mode === 'annual_upgrade'
      ? 'Pagas solo la diferencia por los meses que faltan de tu año. Tu fecha de renovación no cambia.'
      : annual
        ? `Cubre 12 meses${startsLater ? `, a partir del ${startsLater} (conservas tu mes ya pagado)` : ''}. Garantía de 30 días con reembolso completo.`
        : quote?.creditMXN > 0
          ? `Descontamos $${Number(quote.creditMXN).toLocaleString('es-MX')} por los días que no usaste de tu plan actual. Tu nuevo mes empieza hoy y se renueva cada mes.`
          : recurring
            ? 'Se renueva cada mes con tu tarjeta. Cancela cuando quieras.'
            : 'Pago único';

  return (
    <Modal open={open} onClose={step === 'processing' ? () => {} : onClose} title="Pago seguro" size="md">
      {/* Resumen del concepto */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface2 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-fg">{quote?.description || itemName}</div>
          <div className="text-xs text-subtle">{note || defaultNote}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-extrabold text-brand-600">{money}</div>
          <div className="text-[11px] text-subtle">IVA incluido</div>
        </div>
      </div>

      {error && (
        <div className="mb-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {(step === 'loading' || step === 'processing') && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner className="text-brand-600" />
          <p className="text-sm text-muted">{step === 'processing' ? 'Procesando tu pago…' : 'Cargando…'}</p>
        </div>
      )}

      {step === 'card' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 rounded-xl bg-brand-500/[0.07] px-3.5 py-3 text-sm text-fg">
            <Icon name="card" size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>
              <strong>{card ? 'Usa otra tarjeta.' : 'Primero agrega una tarjeta.'}</strong>{' '}
              <span className="text-muted">
                {card
                  ? 'Reemplazará a la guardada para tus próximos cobros.'
                  : 'Con ella pagas ahora y se renueva tu plan; puedes cambiarla cuando quieras.'}
              </span>
            </span>
          </div>
          <CardSetup
            onSaved={onCardSaved}
            onCancel={card ? () => setStep('confirm') : onClose}
            submitLabel="Guardar y continuar"
          />
        </div>
      )}

      {step === 'confirm' && card && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <span className="flex items-center gap-3">
              <Icon name="card" size={20} className="text-brand-600" />
              <span>
                <span className="block text-sm font-semibold capitalize text-fg">
                  {card.brand} •••• {card.last4}
                </span>
                <span className="block text-xs text-muted">
                  Vence {String(card.expMonth).padStart(2, '0')}/{card.expYear}
                </span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setStep('card')}
              className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Cambiar
            </button>
          </div>
          <Button className="w-full" onClick={pay} disabled={kind === 'plan' && !quote}>
            Pagar {money}
          </Button>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-subtle">
        <Icon name="card" size={13} /> Pago protegido por Stripe.
        {testMode && ' Modo prueba: 4242 4242 4242 4242.'}
      </p>
    </Modal>
  );
}
