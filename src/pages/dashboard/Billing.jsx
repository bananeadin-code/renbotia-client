import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { planApi, billingApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { PlanCards, CycleToggle } from '../../components/PlanCards.jsx';
import { PaymentMethod } from '../../components/billing/PaymentMethod.jsx';
import { CheckoutDialog } from '../../components/billing/CheckoutDialog.jsx';
import { CancelDialog } from '../../components/billing/CancelDialog.jsx';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Badge, Alert, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { fmtConversations } from '../../lib/usage.js';
import { ReferralTeaser } from '../../components/dashboard/ReferralCard.jsx';

/**
 * Facturación: plan actual + gestión (cambiar/cancelar/reactivar), balance,
 * compra de créditos (Stripe test) e historial real de pagos.
 */
export default function Billing() {
  const { subscription, balance, load } = useBusinessStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [packs, setPacks] = useState([]);
  // Forma de pago que se muestra en el selector de planes.
  const [cycle, setCycle] = useState(null);
  // Confirmación en dos pasos del reembolso de la garantía.
  const [confirmRefund, setConfirmRefund] = useState(false);
  // Encuesta al cancelar.
  const [cancelOpen, setCancelOpen] = useState(false);
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
        setPricing(plansData.pricing || null);
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
  // Renovación con cobro: plan que sigue y monto; vencida = cobro pendiente.
  const nextPlanKey = subscription?.nextPlanKey || currentKey;
  const nextPlanName = plans.find((p) => p.key === nextPlanKey)?.name || nextPlanKey;
  const renewalAmount = subscription?.renewalAmountMXN || 0;
  const pastDue = status === 'vencida' || Boolean(subscription?.renewalDue);
  const graceStr = subscription?.graceEndsAt
    ? new Date(subscription.graceEndsAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    : '';
  const money = (n) => `$${Number(n || 0).toLocaleString('es-MX')} MXN`;
  const longDate = (d) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' }) : '';

  // Plan anual.
  const annualActive = Boolean(subscription?.annualActive);
  const termEndStr = longDate(subscription?.termEndsAt);
  const nextChargeStr = longDate(subscription?.nextChargeAt);
  const guaranteeStr = longDate(subscription?.guaranteeEndsAt);
  const pendingCycle = subscription?.pendingCycle || '';
  const accessUntilStr = annualActive ? termEndStr : renewalStr;
  const shownCycle = cycle || (annualActive ? 'anual' : 'mensual');
  const isPaidPlan = (key) => (plans.find((p) => p.key === key)?.priceMXN ?? 0) > 0;
  const currentPlan = plans.find((p) => p.key === currentKey);
  // Invitación a pasarse al anual: paga mensual, sin cortesía ni pagos pendientes.
  const annualOffer =
    paidPlansLive && !annualActive && isPaidPlan(currentKey) && !subscription?.complimentary && !pastDue && currentPlan?.annual;
  const orientation = subscription?.orientation;

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
        : result?.type === 'renewal'
          ? '¡Renovación pagada! Tu plan ya está al corriente.'
          : result?.upgraded
            ? '¡Plan mejorado! Tus nuevas ventajas ya están activas.'
            : '¡Pago confirmado!';
    setMsg(okMsg);
    toast.success(okMsg);
  }

  // La tarjeta cambió (módulo de método de pago o dentro del pago): refresca.
  async function onCardChange(card) {
    setSavedCard(card);
    await refresh();
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

  // Abre el pago de un plan (mensual, anual o mejora proporcional a mitad del año).
  function openPlanCheckout(planKey, planCycle) {
    setError('');
    setMsg('');
    const plan = plans.find((p) => p.key === planKey);
    setCheckout({
      kind: 'plan',
      planKey,
      cycle: planCycle,
      itemName: `Plan ${plan?.name || ''}${planCycle === 'anual' ? ' anual' : ''}`.trim(),
      amountMXN: planCycle === 'anual' ? plan?.annual?.priceMXN ?? 0 : plan?.priceMXN ?? 0,
    });
  }

  // Selección de plan desde el selector:
  //  - mismo plan → deshace un cambio programado.
  //  - mejora (precio mayor) → pago inmediato por Stripe y se aplica al instante.
  //  - baja (precio menor / a Free) → se programa para la próxima renovación.
  //  - anual: con un año vigente, mejorar paga la diferencia proporcional y los
  //    demás cambios aplican al terminar el año; sin año vigente, se paga el año.
  async function onSelectPlan(planKey) {
    if (annualActive) {
      if (shownCycle === 'mensual') {
        return doAction(() => billingApi.changePlan(planKey, 'mensual'), 'Cambio programado para el fin de tu año.');
      }
      if (planKey !== currentKey && priceOf(planKey) > priceOf(currentKey)) return openPlanCheckout(planKey, 'anual');
      return doAction(() => billingApi.changePlan(planKey), 'Cambio programado para el fin de tu año.');
    }
    if (shownCycle === 'anual' && isPaidPlan(planKey)) return openPlanCheckout(planKey, 'anual');
    if (planKey === currentKey) {
      return doAction(() => billingApi.changePlan(planKey), 'Se mantendrá tu plan actual.');
    }
    const isUpgrade = priceOf(planKey) > priceOf(currentKey);
    if (isUpgrade) return openPlanCheckout(planKey, 'mensual');
    // Baja de plan: comportamiento tradicional (aplica en la renovación).
    return doAction(() => billingApi.changePlan(planKey), 'Cambio de plan programado.');
  }

  // Pagar ahora una renovación vencida (p. ej. el banco pidió confirmar el pago).
  function payRenewal() {
    setError('');
    setMsg('');
    setCheckout({
      kind: 'renewal',
      itemName: `Renovación Plan ${nextPlanName}`,
      amountMXN: renewalAmount,
      note: 'Paga ahora para mantener tu plan.',
    });
  }

  const onChangePlan = (planKey) =>
    doAction(() => billingApi.changePlan(planKey), 'Cambio de plan programado.');
  const onCancel = () => {
    setError('');
    setMsg('');
    setCancelOpen(true);
  };
  async function confirmCancel(reason, comment) {
    await doAction(() => billingApi.cancel({ reason, comment }), 'Renovación cancelada.');
    setCancelOpen(false);
  }
  const onResume = () =>
    doAction(() => billingApi.resume(), 'Renovación reactivada.');

  // Garantía de 30 días: reembolso completo y la cuenta pasa a Free.
  async function onGuaranteeRefund() {
    setConfirmRefund(false);
    await doAction(() => billingApi.guaranteeRefund(), 'Reembolso procesado.');
    try {
      const payData = await billingApi.payments();
      setPayments(payData.payments);
    } catch {
      /* se verá al recargar */
    }
  }

  // Etiqueta del botón por tarjeta según el plan actual, el ciclo mostrado y si es mejora o baja.
  const ctaFor = (plan) => {
    const up = priceOf(plan.key) > priceOf(currentKey);
    if (annualActive) {
      if (shownCycle === 'mensual') {
        return plan.key === currentKey ? 'Pasar a mensual al terminar el año' : 'Programar para el fin de tu año';
      }
      if (plan.key === currentKey) return 'Plan actual';
      return up ? 'Mejorar: pagas la diferencia' : 'Programar para el fin de tu año';
    }
    if (shownCycle === 'anual' && plan.priceMXN > 0) {
      return plan.key === currentKey ? 'Pasar a anual' : 'Pagar anual';
    }
    if (plan.key === currentKey) return 'Plan actual';
    return up ? 'Mejorar ahora' : 'Programar cambio';
  };
  // Mejora mensual: además de "Mejorar ahora", se puede programar para la renovación
  // (sigue con su plan hasta que terminen sus días y ahí se cobra el nuevo).
  const secondaryFor = (plan) => {
    const canSchedule =
      !annualActive &&
      shownCycle === 'mensual' &&
      isPaidPlan(currentKey) &&
      !subscription?.complimentary &&
      status !== 'vencida' &&
      plan.key !== currentKey &&
      priceOf(plan.key) > priceOf(currentKey);
    if (!canSchedule) return null;
    if (pendingKey === plan.key) return { label: `Programado para el ${renewalStr}`, disabled: true, onClick: () => {} };
    return {
      label: `Cambiar en mi renovación (${renewalStr})`,
      disabled: acting,
      onClick: () => doAction(() => billingApi.changePlan(plan.key), 'Cambio programado para tu renovación.'),
    };
  };

  // El plan actual queda inerte solo cuando la tarjeta coincide en plan Y ciclo.
  const selectedForCycle =
    (annualActive && shownCycle === 'anual') || (!annualActive && (shownCycle === 'mensual' || !isPaidPlan(currentKey)))
      ? currentKey
      : undefined;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Facturación</h1>
        <p className="text-sm text-muted">Gestiona tu plan y tus créditos.</p>
      </div>

      {/* Regalo de referidos (solo si aún no se reclama) */}
      <ReferralTeaser />

      {msg && <Alert variant="success">{msg}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Avisos de estado del plan */}
      {pastDue && renewalAmount > 0 && (
        <Alert variant="error">
          No pudimos cobrar la renovación de tu plan <strong>{nextPlanName}</strong> ({money(renewalAmount)})
          {subscription?.lastRenewalError === 'no_card'
            ? ' porque no hay una tarjeta guardada.'
            : subscription?.lastRenewalError === 'authentication_required'
              ? ' porque tu banco pide confirmar el pago.'
              : '.'}{' '}
          {graceStr
            ? <>Tienes hasta el <strong>{graceStr}</strong>; después tu cuenta pasará a Free. </>
            : 'Resuélvelo para mantener tu plan. '}
          {paidPlansLive && (
            <button onClick={payRenewal} className="font-semibold underline underline-offset-2">
              Pagar ahora
            </button>
          )}
        </Alert>
      )}
      {!pastDue && renewalAmount > 0 && !savedCard && paidPlansLive && (
        <Alert variant="warning">
          Tu plan se renueva el <strong>{annualActive ? nextChargeStr : renewalStr}</strong> por {money(renewalAmount)}. Agrega una tarjeta abajo
          para no perder tus ventajas.
        </Alert>
      )}
      {status === 'cancelada' && (
        <Alert variant="warning">
          Tu plan <strong>no se renovará</strong>. Conservas acceso y tus tokens hasta el{' '}
          <strong>{accessUntilStr}</strong>; después baja a Free.{' '}
          <button
            onClick={onResume}
            disabled={acting}
            className="font-medium underline underline-offset-2"
          >
            Reactivar renovación
          </button>
        </Alert>
      )}
      {status !== 'cancelada' && (pendingKey || pendingCycle) && (
        <Alert variant="info">
          Cambio programado a{' '}
          <strong>
            {pendingName || currentPlan?.name || pendingKey}
            {pendingCycle === 'mensual' ? ' mensual' : ''}
          </strong>{' '}
          {annualActive ? `al terminar tu año (${termEndStr})` : `en tu próxima renovación (${renewalStr})`}.{' '}
          <button
            onClick={() => onChangePlan(currentKey)}
            disabled={acting}
            className="font-medium underline underline-offset-2"
          >
            Deshacer
          </button>
        </Alert>
      )}

      {/* Garantía de 30 días del plan anual */}
      {subscription?.guaranteeEndsAt && (
        <Alert variant="info">
          Tu plan anual tiene <strong>garantía de 30 días</strong> hasta el <strong>{guaranteeStr}</strong>: si
          RenBotIA no te funciona, te devolvemos todo lo que pagaste y tu cuenta pasa a Free.{' '}
          {confirmRefund ? (
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-medium">¿Confirmas el reembolso? Tu plan termina al instante.</span>
              <Button size="sm" variant="danger" onClick={onGuaranteeRefund} disabled={acting}>
                Sí, reembolsar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmRefund(false)} disabled={acting}>
                No, conservar mi plan
              </Button>
            </span>
          ) : (
            <button onClick={() => setConfirmRefund(true)} className="font-semibold underline underline-offset-2">
              Solicitar reembolso
            </button>
          )}
        </Alert>
      )}

      {/* Invitación a pasarse al anual (paga mensual) */}
      {annualOffer && (
        <Card className="flex flex-col gap-3 border-brand-500/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-fg">
              Paga anual y ahorra {money(currentPlan.annual.savingsMXN)}
            </div>
            <p className="text-sm text-muted">
              {currentPlan.name} anual por {money(currentPlan.annual.priceMXN)}: pagas {currentPlan.annual.monthsPaid} meses y
              recibes 12{pricing?.annual?.founder ? ' (precio de fundador, lo conservas mientras renueves)' : ''}. Empieza al
              terminar tu mes ya pagado y tiene garantía de 30 días.
            </p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => openPlanCheckout(currentKey, 'anual')}>
            Pasar a anual
          </Button>
        </Card>
      )}

      {/* Plan actual */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted">Plan actual</div>
            <div className="flex items-center gap-2 text-xl font-bold text-fg">
              {subscription?.plan?.name || '—'}
              {annualActive && <Badge color="green">Anual</Badge>}
              {subscription?.founder && <Badge color="slate">Fundador</Badge>}
            </div>
          </div>
          <Badge color={status === 'activa' ? 'green' : status === 'vencida' ? 'red' : 'amber'}>
            {status === 'vencida' ? 'pago pendiente' : status || '—'}
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted">Precio</div>
            <div className="font-medium text-fg">
              {subscription?.complimentary
                ? 'Cortesía (sin cobro)'
                : subscription?.plan?.priceMXN === 0
                  ? 'Gratis'
                  : annualActive
                    ? `Pagado hasta el ${termEndStr}`
                    : `$${subscription?.plan?.priceMXN?.toLocaleString('es-MX')} MXN/mes`}
            </div>
            {annualActive && <div className="text-[11px] text-subtle">Plan anual · tus créditos se renuevan cada mes</div>}
          </div>
          <div>
            <div className="text-muted">{annualActive ? 'Próximo cobro' : 'Renovación'}</div>
            <div className="font-medium text-fg">
              {annualActive ? (renewalAmount > 0 && status !== 'cancelada' ? nextChargeStr : '—') : renewalStr}
            </div>
            {renewalAmount > 0 && status !== 'cancelada' && (
              <div className="text-[11px] text-subtle">
                {money(renewalAmount)}
                {subscription?.nextChargeCycle === 'anual' ? ' por 12 meses' : ''}
                {savedCard ? ` · ${savedCard.brand} •••• ${savedCard.last4}` : ' · sin tarjeta'}
              </div>
            )}
            {annualActive && <div className="text-[11px] text-subtle">Créditos nuevos el {renewalStr}</div>}
          </div>
          <div>
            <div className="text-muted">Conversaciones disponibles</div>
            <div className="font-medium tabular text-brand-700 dark:text-brand-300">
              {balance ? `${fmtConversations(balance.available)}` : '—'}
            </div>
            <div className="text-[11px] text-subtle">
              aprox. · {balance ? balance.available.toLocaleString('es-MX') : '—'} tokens
            </div>
          </div>
          <div>
            <div className="text-muted">Créditos extra</div>
            <div className="font-medium tabular text-fg">
              {balance ? `${fmtConversations(balance.extraTokens)} conv.` : '—'}
            </div>
            <div className="text-[11px] text-subtle">
              {balance ? balance.extraTokens.toLocaleString('es-MX') : '—'} tokens
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
            {annualActive ? (
              <>
                Tienes un plan anual hasta el <strong>{termEndStr}</strong>. Al <strong>mejorar</strong> pagas solo la
                diferencia por los meses que faltan y las ventajas se activan al instante. Bajar de plan o pasar a
                mensual aplica al terminar tu año.
              </>
            ) : (
              <>
                Al <strong>mejorar</strong> puedes hacerlo <strong>ahora</strong> (las ventajas se activan al instante y
                descontamos los días que no usaste de tu plan actual) o <strong>en tu renovación</strong> ({renewalStr}).
                Al <strong>bajar</strong> de plan, el cambio aplica en tu próxima renovación y conservas tu plan actual
                hasta entonces.
              </>
            )}
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-brand-600" />
            </div>
          ) : (
            <>
              <CycleToggle cycle={shownCycle} onChange={setCycle} pricing={pricing} className="mb-6" />
              <PlanCards
                plans={plans}
                selectedKey={selectedForCycle}
                onSelect={onSelectPlan}
                ctaFor={ctaFor}
                secondaryFor={secondaryFor}
                paidPlansLive={paidPlansLive}
                cycle={shownCycle}
              />
            </>
          )}
        </div>
      )}

      {/* Método de pago guardado + recarga automática (solo cuando hay cobros live) */}
      {paidPlansLive && <PaymentMethod packs={packs} onCardChange={onCardChange} />}

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
                  {fmtConversations(pack.tokens)} conversaciones · {pack.tokens.toLocaleString('es-MX')} tokens
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
                    <td className="py-2 text-muted">
                      {p.type === 'credits'
                        ? 'Créditos'
                        : `${p.renewal ? 'Renovación' : 'Plan'}${p.cycle === 'anual' ? ' anual' : ''}`}
                    </td>
                    <td className="py-2 tabular text-muted">
                      ${p.amountMXN?.toLocaleString('es-MX')}
                    </td>
                    <td className="py-2">
                      {p.status === 'refunded' ? (
                        <Badge color="amber">Reembolsada</Badge>
                      ) : (
                        <Badge color="green">Pagada</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pago embebido (plan o créditos), sin salir del sitio */}
      <CancelDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={confirmCancel}
        busy={acting}
        currentKey={currentKey}
        currentPlan={currentPlan}
        annualActive={annualActive}
        accessUntil={accessUntilStr}
        bookingUrl={orientation?.bookingUrl}
        orientationDone={Boolean(orientation?.done)}
        onHelp={() => {
          setCancelOpen(false);
          navigate('/dashboard/ayuda');
        }}
        onDowngrade={async (key) => {
          await doAction(() => billingApi.changePlan(key), 'Cambio programado para tu renovación.');
          setCancelOpen(false);
        }}
        onAnnual={() => {
          setCancelOpen(false);
          openPlanCheckout(currentKey, 'anual');
        }}
      />

      {checkout && (
        <CheckoutDialog
          open={Boolean(checkout)}
          onClose={() => setCheckout(null)}
          kind={checkout.kind}
          planKey={checkout.planKey}
          cycle={checkout.cycle}
          packKey={checkout.packKey}
          itemName={checkout.itemName}
          amountMXN={checkout.amountMXN}
          note={checkout.note}
          onSuccess={onCheckoutSuccess}
          onCardChange={onCardChange}
        />
      )}
    </div>
  );
}
