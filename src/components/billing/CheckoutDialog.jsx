import { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { billingApi } from '../../api/endpoints.js';
import { Modal } from '../ui/Modal.jsx';
import { Button, Alert, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useThemeStore } from '../../store/themeStore.js';

/**
 * Diálogo de pago EMBEBIDO (sin redirigir a Stripe). Sirve para comprar/mejorar
 * un plan o comprar un paquete de créditos. Dos caminos:
 *  - Tarjeta guardada: cobro en un clic (el backend confirma el PaymentIntent).
 *  - Tarjeta nueva: se captura con <PaymentElement> (iframes de Stripe) y se
 *    confirma en el navegador; los datos de la tarjeta nunca tocan el sitio.
 *
 * Al completarse el pago, llama a onSuccess(result) con la respuesta de confirm.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {'plan'|'credits'} props.kind
 * @param {string} [props.planKey]
 * @param {string} [props.packKey]
 * @param {string} props.itemName   Nombre visible del concepto.
 * @param {number} props.amountMXN
 * @param {{brand:string,last4:string}|null} [props.savedCard]  Tarjeta guardada (si hay).
 * @param {object} [props.onboarding]  Datos de onboarding (solo alta de plan nueva).
 * @param {(result:any) => void} props.onSuccess
 */
export function CheckoutDialog({
  open,
  onClose,
  kind,
  planKey,
  packKey,
  itemName,
  amountMXN,
  savedCard,
  onboarding,
  onSuccess,
}) {
  const isDark = useThemeStore((s) => s.isDark);
  const [step, setStep] = useState('processing'); // processing | choose | newcard
  const [error, setError] = useState('');
  const [intent, setIntent] = useState(null); // { clientSecret, paymentIntentId, publishableKey }
  const [pk, setPk] = useState('');

  const stripePromise = useMemo(() => (pk ? loadStripe(pk) : null), [pk]);
  const purchase = useMemo(
    () => (kind === 'plan' ? { kind, planKey } : { kind, packKey }),
    [kind, planKey, packKey]
  );

  // Al abrir, decide el paso inicial: con tarjeta guardada muestra el atajo;
  // sin tarjeta, prepara directamente el formulario de tarjeta nueva.
  useEffect(() => {
    if (!open) return;
    setError('');
    setIntent(null);
    if (savedCard) setStep('choose');
    else prepareNewCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function prepareNewCard() {
    setError('');
    setStep('processing');
    try {
      const data = await billingApi.createIntent(purchase);
      setPk(data.publishableKey);
      setIntent(data);
      setStep('newcard');
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo iniciar el pago.');
      setStep(savedCard ? 'choose' : 'newcard');
    }
  }

  async function deliver(paymentIntentId) {
    const result = await billingApi.confirm({ paymentIntentId, onboarding });
    onSuccess?.(result);
  }

  async function paySavedCard() {
    setError('');
    setStep('processing');
    try {
      const data = await billingApi.createIntent({ ...purchase, useSavedCard: true });
      if (data.status === 'succeeded') {
        await deliver(data.paymentIntentId);
        return;
      }
      // Autenticación adicional (3DS): completar en el navegador.
      if (data.status === 'requires_action' && data.clientSecret) {
        const stripe = await loadStripe(data.publishableKey);
        const { error: actErr, paymentIntent } = await stripe.handleNextAction({
          clientSecret: data.clientSecret,
        });
        if (actErr) throw new Error(actErr.message);
        if (paymentIntent?.status === 'succeeded') {
          await deliver(data.paymentIntentId);
          return;
        }
      }
      throw new Error('No se pudo completar el cobro con tu tarjeta guardada.');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'No se pudo cobrar la tarjeta.');
      setStep('choose');
    }
  }

  const money = `$${Number(amountMXN).toLocaleString('es-MX')} MXN`;

  return (
    <Modal open={open} onClose={onClose} title="Pago seguro" size="md">
      {/* Resumen del concepto */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface2 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-fg">{itemName}</div>
          <div className="text-xs text-subtle">Pago único · Stripe (modo prueba)</div>
        </div>
        <div className="shrink-0 text-lg font-extrabold text-brand-600">{money}</div>
      </div>

      {error && (
        <div className="mb-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner className="text-brand-600" />
          <p className="text-sm text-muted">Procesando tu pago…</p>
        </div>
      )}

      {step === 'choose' && savedCard && (
        <div className="space-y-3">
          <button
            onClick={paySavedCard}
            className="flex w-full items-center justify-between rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-left transition hover:border-brand-400 dark:border-brand-900/60 dark:bg-brand-900/20"
          >
            <span className="flex items-center gap-3">
              <Icon name="card" size={20} className="text-brand-600" />
              <span>
                <span className="block text-sm font-semibold capitalize text-fg">
                  {savedCard.brand} •••• {savedCard.last4}
                </span>
                <span className="block text-xs text-muted">Pagar en un clic</span>
              </span>
            </span>
            <span className="text-sm font-bold text-brand-600">{money}</span>
          </button>
          <button
            onClick={prepareNewCard}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-muted transition hover:text-fg"
          >
            <Icon name="plus" size={16} /> Usar otra tarjeta
          </button>
        </div>
      )}

      {step === 'newcard' && intent?.clientSecret && stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: intent.clientSecret,
            appearance: { theme: isDark ? 'night' : 'stripe' },
          }}
        >
          <NewCardForm
            amountLabel={money}
            onboarding={onboarding}
            onDone={(result) => onSuccess?.(result)}
            onBack={savedCard ? () => setStep('choose') : null}
          />
        </Elements>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-subtle">
        <Icon name="card" size={13} /> Pago protegido por Stripe. Prueba: 4242 4242 4242 4242, fecha
        futura y cualquier CVC.
      </p>
    </Modal>
  );
}

/** Formulario de tarjeta nueva (Stripe Elements). Confirma el PaymentIntent. */
function NewCardForm({ amountLabel, onboarding, onDone, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');
    // Confirma el pago sin redirigir (las tarjetas sin 3DS se completan aquí).
    const { error: confErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (confErr) {
      setError(confErr.message || 'No se pudo procesar el pago.');
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status !== 'succeeded') {
      setError('El pago no se completó. Intenta de nuevo.');
      setSubmitting(false);
      return;
    }
    try {
      const result = await billingApi.confirm({ paymentIntentId: paymentIntent.id, onboarding });
      onDone(result);
    } catch (e2) {
      setError(
        e2.response?.data?.message ||
          'El pago se realizó pero no pudimos activarlo. Escríbenos para resolverlo.'
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="flex items-center gap-2">
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
            Atrás
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!stripe || submitting}>
          {submitting ? 'Procesando…' : `Pagar ${amountLabel}`}
        </Button>
      </div>
    </form>
  );
}
