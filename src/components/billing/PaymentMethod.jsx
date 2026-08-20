import { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { billingApi } from '../../api/endpoints.js';
import { Card, Button, Select, Input, Alert, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { useThemeStore } from '../../store/themeStore.js';

/**
 * "Método de pago y recarga automática".
 * - La tarjeta se captura con Stripe Elements (iframes de Stripe con tu diseño):
 *   los datos sensibles nunca tocan el server ni se ven; Stripe (PCI) los maneja.
 * - Con la tarjeta guardada, el cliente puede PROGRAMAR la compra automática de
 *   un paquete de créditos cuando su saldo baje del umbral (auto-reload).
 */
export function PaymentMethod({ packs = [] }) {
  const isDark = useThemeStore((s) => s.isDark);
  const [loading, setLoading] = useState(true);
  const [pk, setPk] = useState('');
  const [card, setCard] = useState(null);
  const [autoRecharge, setAutoRecharge] = useState({ enabled: false, packKey: '', threshold: 0 });
  const [adding, setAdding] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [savingAR, setSavingAR] = useState(false);
  const [removing, setRemoving] = useState(false);

  const stripePromise = useMemo(() => (pk ? loadStripe(pk) : null), [pk]);

  async function load() {
    try {
      const [{ publishableKey }, pm] = await Promise.all([
        billingApi.config(),
        billingApi.getPaymentMethod(),
      ]);
      setPk(publishableKey || '');
      setCard(pm.paymentMethod || null);
      setAutoRecharge({
        enabled: pm.autoRecharge?.enabled || false,
        packKey: pm.autoRecharge?.packKey || packs[0]?.key || '',
        threshold: pm.autoRecharge?.threshold ?? 0,
      });
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar el método de pago.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startAdd() {
    setError('');
    setMsg('');
    try {
      const { clientSecret: cs } = await billingApi.setupIntent();
      setClientSecret(cs);
      setAdding(true);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo iniciar el registro de la tarjeta.');
    }
  }

  async function onCardSaved() {
    setAdding(false);
    setClientSecret('');
    setMsg('Tarjeta guardada correctamente.');
    await load();
  }

  async function removeCard() {
    if (!window.confirm('¿Quitar la tarjeta guardada? Esto también desactiva la recarga automática.')) return;
    setRemoving(true);
    setError('');
    try {
      const data = await billingApi.deletePaymentMethod();
      setCard(null);
      setAutoRecharge((a) => ({ ...a, enabled: false }));
      setMsg('Tarjeta eliminada.');
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo quitar la tarjeta.');
    } finally {
      setRemoving(false);
    }
  }

  async function saveAutoRecharge(next) {
    setSavingAR(true);
    setError('');
    setMsg('');
    try {
      const data = await billingApi.updateAutoRecharge(next);
      setAutoRecharge({
        enabled: data.autoRecharge.enabled,
        packKey: data.autoRecharge.packKey || packs[0]?.key || '',
        threshold: data.autoRecharge.threshold ?? 0,
      });
      setMsg('Recarga automática actualizada.');
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar la recarga automática.');
    } finally {
      setSavingAR(false);
    }
  }

  if (loading) {
    return (
      <Card className="flex justify-center py-8">
        <Spinner className="text-brand-600" />
      </Card>
    );
  }

  if (!pk) {
    return (
      <Card>
        <h2 className="mb-1 font-semibold text-fg">Método de pago</h2>
        <Alert variant="warning">
          Falta configurar la clave publicable de Stripe (STRIPE_PUBLISHABLE_KEY) en el servidor
          para habilitar la tarjeta guardada y la recarga automática.
        </Alert>
      </Card>
    );
  }

  const selectedPack = packs.find((p) => p.key === autoRecharge.packKey);

  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <Icon name="card" size={18} className="text-brand-600" />
        <h2 className="font-semibold text-fg">Método de pago y recarga automática</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        Guarda una tarjeta de forma segura (la procesa Stripe; el sitio nunca ve tus datos) y
        programa la compra automática de créditos para no quedarte sin servicio.
      </p>

      {msg && (
        <div className="mb-3">
          <Alert variant="success">{msg}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Tarjeta */}
      {card ? (
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface2 px-4 py-3">
          <div className="flex items-center gap-3">
            <Icon name="card" size={20} className="text-fg" />
            <div>
              <div className="text-sm font-medium capitalize text-fg">
                {card.brand} •••• {card.last4}
              </div>
              <div className="text-xs text-subtle">
                Vence {String(card.expMonth).padStart(2, '0')}/{card.expYear}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={removeCard} disabled={removing}>
            {removing ? 'Quitando…' : 'Quitar'}
          </Button>
        </div>
      ) : adding && clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: isDark ? 'night' : 'stripe' },
          }}
        >
          <AddCardForm onSaved={onCardSaved} onCancel={() => setAdding(false)} onError={setError} />
        </Elements>
      ) : (
        <div className="rounded-lg border border-dashed border-line p-5 text-center">
          <p className="mb-3 text-sm text-muted">Aún no tienes una tarjeta guardada.</p>
          <Button onClick={startAdd}>
            <Icon name="plus" size={16} /> Agregar tarjeta
          </Button>
        </div>
      )}

      {/* Recarga automática (requiere tarjeta) */}
      <div className="mt-5 border-t border-line pt-4">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-fg">Recarga automática</div>
            <div className="text-sm text-muted">
              Compra un paquete de créditos automáticamente cuando tu saldo baje del umbral, para
              no cortar el servicio.
            </div>
          </div>
          <Toggle
            checked={autoRecharge.enabled}
            disabled={!card || savingAR}
            onChange={(v) =>
              saveAutoRecharge({
                enabled: v,
                packKey: autoRecharge.packKey,
                threshold: autoRecharge.threshold,
              })
            }
          />
        </label>

        {!card && (
          <p className="mt-2 text-xs text-subtle">Agrega una tarjeta para poder activarla.</p>
        )}

        {card && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Select
              label="Paquete a comprar"
              value={autoRecharge.packKey}
              onChange={(e) => setAutoRecharge((a) => ({ ...a, packKey: e.target.value }))}
            >
              {packs.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name} — ${p.priceMXN} MXN
                </option>
              ))}
            </Select>
            <Input
              label="Recargar cuando el saldo baje de (créditos)"
              type="number"
              min="0"
              value={autoRecharge.threshold}
              onChange={(e) => setAutoRecharge((a) => ({ ...a, threshold: e.target.value }))}
            />
            <div className="sm:col-span-2 flex items-center justify-between">
              <p className="text-xs text-subtle">
                {selectedPack
                  ? `Se cobrará $${selectedPack.priceMXN} MXN por ${selectedPack.tokens.toLocaleString(
                      'es-MX'
                    )} créditos.`
                  : ''}
              </p>
              <Button
                size="sm"
                variant="secondary"
                disabled={savingAR}
                onClick={() =>
                  saveAutoRecharge({
                    enabled: autoRecharge.enabled,
                    packKey: autoRecharge.packKey,
                    threshold: Number(autoRecharge.threshold) || 0,
                  })
                }
              >
                {savingAR ? 'Guardando…' : 'Guardar ajustes'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/** Formulario de tarjeta con Stripe Elements (iframes). Confirma el SetupIntent. */
function AddCardForm({ onSaved, onCancel, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    onError('');
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required', // tarjetas sin 3DS se confirman sin redirigir
      });
      if (error) {
        onError(error.message || 'No se pudo guardar la tarjeta.');
        setSubmitting(false);
        return;
      }
      await billingApi.savePaymentMethod(setupIntent.payment_method);
      onSaved();
    } catch (err) {
      onError(err.response?.data?.message || 'No se pudo guardar la tarjeta.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line p-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={!stripe || submitting}>
          {submitting ? 'Guardando…' : 'Guardar tarjeta'}
        </Button>
      </div>
      <p className="text-[11px] text-subtle">
        Pago seguro con Stripe. Prueba (modo test): 4242 4242 4242 4242, cualquier fecha futura y CVC.
      </p>
    </form>
  );
}

/** Toggle accesible reutilizable. */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-40 ${
        checked ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
