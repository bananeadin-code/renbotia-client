import { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { billingApi } from '../../api/endpoints.js';
import { Button, Alert, Spinner } from '../ui/index.jsx';
import { useThemeStore } from '../../store/themeStore.js';

/**
 * Guardar (o reemplazar) la tarjeta del negocio con Stripe Elements. Los datos
 * de la tarjeta viven en iframes de Stripe: nunca tocan el sitio ni el servidor.
 * La tarjeta queda lista para cobros futuros (compras, renovación mensual del
 * plan y recarga automática).
 *
 * @param {object} props
 * @param {(result: { paymentMethod: object, renewal?: string|null }) => void} props.onSaved
 * @param {() => void} [props.onCancel]
 * @param {string} [props.submitLabel]
 */
export function CardSetup({ onSaved, onCancel, submitLabel = 'Guardar tarjeta' }) {
  const isDark = useThemeStore((s) => s.isDark);
  const [pk, setPk] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([billingApi.config(), billingApi.setupIntent()])
      .then(([cfg, si]) => {
        if (!alive) return;
        setPk(cfg.publishableKey || '');
        setClientSecret(si.clientSecret);
      })
      .catch((e) => alive && setError(e.response?.data?.message || 'No se pudo iniciar el registro de la tarjeta.'));
    return () => {
      alive = false;
    };
  }, []);

  const stripePromise = useMemo(() => (pk ? loadStripe(pk) : null), [pk]);

  if (error) {
    return (
      <div className="space-y-3">
        <Alert variant="error">{error}</Alert>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Volver
          </Button>
        )}
      </div>
    );
  }
  if (!clientSecret || !stripePromise) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="text-brand-600" />
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: isDark ? 'night' : 'stripe' } }}>
      <SetupForm
        onSaved={onSaved}
        onCancel={onCancel}
        submitLabel={submitLabel}
        testMode={pk.startsWith('pk_test_')}
      />
    </Elements>
  );
}

function SetupForm({ onSaved, onCancel, submitLabel, testMode }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');
    try {
      const { error: confErr, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required', // tarjetas sin 3DS se confirman sin redirigir
      });
      if (confErr) throw new Error(confErr.message || 'No se pudo guardar la tarjeta.');
      const pmId = typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method?.id;
      const result = await billingApi.savePaymentMethod(pmId);
      onSaved(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo guardar la tarjeta.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!stripe || submitting}>
          {submitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
      <p className="text-[11px] text-subtle">
        Procesado por Stripe; RenBotIA nunca ve los datos de tu tarjeta.
        {testMode && ' Prueba: 4242 4242 4242 4242, cualquier fecha futura y CVC.'}
      </p>
    </form>
  );
}
