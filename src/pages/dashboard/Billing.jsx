import { useEffect, useState } from 'react';
import { planApi, billingApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { PlanCards } from '../../components/PlanCards.jsx';
import { PaymentMethod } from '../../components/billing/PaymentMethod.jsx';
import { CheckoutDialog } from '../../components/billing/CheckoutDialog.jsx';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Badge, Alert, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

/**
 * Facturación: plan actual + gestión (cambiar/cancelar/reactivar), balance,
 * compra de créditos (Stripe test) e historial real de pagos.
 */
export default function Billing() {
  const { subscription, balance, load } = useBusinessStore();
  const [plans, setPlans] = useState([]);
  const [packs, setPacks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChange, setShowChange] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  // Pago embebido (modal). checkout = { kind, planKey|packKey, itemName, amountMXN }.
  const [checkout, setCheckout] = useState(null);
  const [savedCard, setSavedCard] = useState(null);
  // ¿Se pueden comprar planes/créditos? (Stripe live). Beta-seguro: false por defecto.
  const [paidPlansLive, setPaidPlansLive] = useState(false);

  useEffect(() => {
    Promise.all([
      planApi.list(),
      billingApi.payments(),
      billingApi.getPaymentMethod(),
      billingApi.config(),
    ])
      .then(([plansData, payData, pmData, cfg]) => {
        setPlans(plansData.plans);
        setPacks(plansData.creditPacks);
        setPayments(payData.payments);
        setSavedCard(pmData.paymentMethod || null);
        setPaidPlansLive(Boolean(cfg.paidPlansLive));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentKey = subscription?.plan?.key;
  const status = subscription?.status;
  const pendingKey = subscription?.pendingPlanKey || '';
  const pendingName = plans.find((p) => p.key === pendingKey)?.name;
  const renewalStr = subscription
    ? new Date(subscription.renewalDate).toLocaleDateString('es-MX')
    : '—';

  async function refresh() {
    await load();
  }

  // Abre el modal de pago embebido para un paquete de créditos.
  function buyCredits(pack) {
    setError('');
    setMsg('');
    setCheckout({
      kind: 'credits',
      packKey: pack.key,
      itemName: pack.name,
      amountMXN: pack.priceMXN,
    });
  }

  // Tras un pago exitoso: refresca balance, historial y muestra confirmación.
  async function onCheckoutSuccess(result) {
    setCheckout(null);
    await refresh();
    try {
      const payData = await billingApi.payments();
      setPayments(payData.payments);
    } catch {
      /* el historial se refrescará al recargar */
    }
    const okMsg =
      result?.type === 'credits'
        ? '¡Créditos acreditados! Ya están en tu balance.'
        : result?.upgraded
          ? '¡Plan mejorado! Tus nuevas ventajas ya están activas.'
          : '¡Pago confirmado!';
    setMsg(okMsg);
    toast.success(okMsg);
  }

  async function doAction(fn, okMsg) {
    setError('');
    setMsg('');
    setActing(true);
    try {
      const res = await fn();
      await refresh();
      setMsg(res?.message || okMsg || 'Listo.');
      setShowChange(false);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar la acción');
    } finally {
      setActing(false);
    }
  }

  const priceOf = (key) => plans.find((p) => p.key === key)?.priceMXN ?? 0;

  // Selección de plan desde el selector:
  //  - mismo plan → deshace un cambio programado.
  //  - mejora (precio mayor) → pago inmediato por Stripe y se aplica al instante.
  //  - baja (precio menor / a Free) → se programa para la próxima renovación.
  async function onSelectPlan(planKey) {
    if (planKey === currentKey) {
      return doAction(() => billingApi.changePlan(planKey), 'Se mantendrá tu plan actual.');
    }
    const isUpgrade = priceOf(planKey) > priceOf(currentKey);
    if (isUpgrade) {
      setError('');
      setMsg('');
      const plan = plans.find((p) => p.key === planKey);
      setCheckout({
        kind: 'plan',
        planKey,
        itemName: `Plan ${plan?.name || ''}`.trim(),
        amountMXN: plan?.priceMXN ?? 0,
      });
      return;
    }
    // Baja de plan: comportamiento tradicional (aplica en la renovación).
    return doAction(() => billingApi.changePlan(planKey), 'Cambio de plan programado.');
  }

  const onChangePlan = (planKey) =>
    doAction(() => billingApi.changePlan(planKey), 'Cambio de plan programado.');
  const onCancel = () =>
    doAction(() => billingApi.cancel(), 'Renovación cancelada.');
  const onResume = () =>
    doAction(() => billingApi.resume(), 'Renovación reactivada.');

  // Etiqueta del botón por tarjeta según sea el plan actual, mejora o baja.
  const ctaFor = (plan) => {
    if (plan.key === currentKey) return 'Plan actual';
    return priceOf(plan.key) > priceOf(currentKey) ? 'Mejorar ahora' : 'Programar cambio';
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Facturación</h1>
        <p className="text-sm text-muted">Gestiona tu plan y tus créditos.</p>
      </div>

      {msg && <Alert variant="success">{msg}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Avisos de estado del plan */}
      {status === 'cancelada' && (
        <Alert variant="warning">
          Tu plan <strong>no se renovará</strong>. Conservas acceso y tus tokens hasta el{' '}
          <strong>{renewalStr}</strong>; después baja a Free.{' '}
          <button
            onClick={onResume}
            disabled={acting}
            className="font-medium underline underline-offset-2"
          >
            Reactivar renovación
          </button>
        </Alert>
      )}
      {status !== 'cancelada' && pendingKey && (
        <Alert variant="info">
          Cambio programado a <strong>{pendingName || pendingKey}</strong> en tu próxima renovación (
          {renewalStr}).{' '}
          <button
            onClick={() => onChangePlan(currentKey)}
            disabled={acting}
            className="font-medium underline underline-offset-2"
          >
            Deshacer
          </button>
        </Alert>
      )}

      {/* Plan actual */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted">Plan actual</div>
            <div className="text-xl font-bold text-fg">{subscription?.plan?.name || '—'}</div>
          </div>
          <Badge color={status === 'activa' ? 'green' : 'amber'}>{status || '—'}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted">Precio</div>
            <div className="font-medium text-fg">
              {subscription?.plan?.priceMXN === 0
                ? 'Gratis'
                : `$${subscription?.plan?.priceMXN?.toLocaleString('es-MX')} MXN/mes`}
            </div>
          </div>
          <div>
            <div className="text-muted">Renovación</div>
            <div className="font-medium text-fg">{renewalStr}</div>
          </div>
          <div>
            <div className="text-muted">Tokens disponibles</div>
            <div className="font-medium tabular text-brand-700 dark:text-brand-300">
              {balance ? balance.available.toLocaleString('es-MX') : '—'}
            </div>
          </div>
          <div>
            <div className="text-muted">Créditos extra</div>
            <div className="font-medium tabular text-fg">
              {balance ? balance.extraTokens.toLocaleString('es-MX') : '—'}
            </div>
          </div>
        </div>

        {/* Acciones de plan */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowChange((v) => !v)}>
            <Icon name="sliders" size={16} />
            {showChange ? 'Ocultar planes' : 'Cambiar plan'}
          </Button>
          {status === 'cancelada' ? (
            <Button variant="secondary" size="sm" onClick={onResume} disabled={acting}>
              Reactivar renovación
            </Button>
          ) : (
            currentKey !== 'free' && (
              <Button variant="ghost" size="sm" onClick={onCancel} disabled={acting}>
                Cancelar plan
              </Button>
            )
          )}
        </div>
      </Card>

      {/* Selector de cambio de plan */}
      {showChange && (
        <div>
          <h2 className="mb-1 font-semibold text-fg">Cambiar de plan</h2>
          <p className="mb-4 text-sm text-muted">
            Al <strong>mejorar</strong> (a Pro o Elite) pagas ahora y las ventajas se activan al
            instante. Al <strong>bajar</strong> de plan, el cambio aplica en tu próxima renovación (
            {renewalStr}) y conservas tu plan actual hasta entonces.
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-brand-600" />
            </div>
          ) : (
            <PlanCards
              plans={plans}
              selectedKey={currentKey}
              onSelect={onSelectPlan}
              ctaFor={ctaFor}
              paidPlansLive={paidPlansLive}
            />
          )}
        </div>
      )}

      {/* Método de pago guardado + recarga automática (solo cuando hay cobros live) */}
      {paidPlansLive && <PaymentMethod packs={packs} />}

      {/* Paquetes de créditos */}
      <div>
        <h2 className="mb-1 font-semibold text-fg">Comprar créditos adicionales</h2>
        <p className="mb-3 text-sm text-muted">
          {paidPlansLive
            ? 'Se suman a tu balance y no vencen con la renovación. Pago seguro con Stripe.'
            : 'Los créditos adicionales estarán disponibles cuando activemos los pagos. Muy pronto.'}
        </p>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-brand-600" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packs.map((pack) => (
              <Card key={pack.key} className="text-center">
                <div className="text-lg font-bold text-fg">{pack.name}</div>
                <div className="mt-1 text-2xl font-extrabold text-brand-600">
                  ${pack.priceMXN.toLocaleString('es-MX')}
                </div>
                <div className="text-xs text-subtle">
                  {pack.tokens.toLocaleString('es-MX')} tokens
                </div>
                <Button
                  className="mt-4 w-full"
                  variant={paidPlansLive ? 'primary' : 'secondary'}
                  disabled={!paidPlansLive}
                  onClick={() => paidPlansLive && buyCredits(pack)}
                >
                  {paidPlansLive ? 'Comprar' : 'Próximamente'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Historial de facturación (real) */}
      <Card>
        <h2 className="mb-3 font-semibold text-fg">Historial de facturación</h2>
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-subtle">
            Aún no hay movimientos. Tus compras aparecerán aquí.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-subtle">
                <tr>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Concepto</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Monto</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="py-2 text-muted">
                      {new Date(p.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="py-2 text-muted">{p.description}</td>
                    <td className="py-2 text-muted">{p.type === 'plan' ? 'Plan' : 'Créditos'}</td>
                    <td className="py-2 tabular text-muted">
                      ${p.amountMXN?.toLocaleString('es-MX')}
                    </td>
                    <td className="py-2">
                      <Badge color="green">Pagada</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pago embebido (plan o créditos), sin salir del sitio */}
      {checkout && (
        <CheckoutDialog
          open={Boolean(checkout)}
          onClose={() => setCheckout(null)}
          kind={checkout.kind}
          planKey={checkout.planKey}
          packKey={checkout.packKey}
          itemName={checkout.itemName}
          amountMXN={checkout.amountMXN}
          savedCard={savedCard}
          onSuccess={onCheckoutSuccess}
        />
      )}
    </div>
  );
}
