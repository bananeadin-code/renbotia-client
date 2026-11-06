import { useEffect, useState } from 'react';
import { Button, Badge } from './ui/index.jsx';
import { Icon } from './ui/Icon.jsx';
import { BorderBeam } from './ui/BorderBeam.jsx';
import { WaitlistButton } from './WaitlistButton.jsx';
import { billingApi } from '../api/endpoints.js';
import { fmtConversations } from '../lib/usage.js';

const HIGHLIGHT = 'pro'; // plan destacado

/**
 * Grid de tarjetas de planes reutilizable (precios y onboarding).
 * Mientras los planes de pago no se puedan comprar (Stripe en prueba), Pro/Elite
 * se muestran como "Próximamente" con un botón "Avísame" (lista de espera). Se
 * detecta solo por `paidPlansLive` de la config de billing (auto al poner claves live).
 *
 * @param {Array} plans
 * @param {string} [selectedKey] - plan seleccionado/actual (resalta con anillo)
 * @param {function} [onSelect] - callback al elegir un plan
 * @param {string} [ctaLabel] - etiqueta única del botón (modo simple)
 * @param {function} [ctaFor] - etiqueta por plan (modo gestión); si se pasa, el
 *   botón del plan actual (selectedKey) queda deshabilitado.
 * @param {boolean} [paidPlansLive] - fuerza el estado; si se omite, se consulta.
 * @param {'mensual'|'anual'} [cycle] - con 'anual' muestra el precio anual (plan.annual).
 * @param {function} [secondaryFor] - acción secundaria por plan: ({ label, onClick, disabled }) o null.
 */
export function PlanCards({ plans, selectedKey, onSelect, ctaLabel = 'Elegir plan', ctaFor, paidPlansLive, cycle = 'mensual', secondaryFor }) {
  const [fetchedLive, setFetchedLive] = useState(null);
  useEffect(() => {
    if (typeof paidPlansLive === 'boolean') return; // ya lo pasaron
    // Endpoint PÚBLICO: funciona con o sin sesión (la página de Precios no tiene
    // token, y antes caía a "Próximamente" por el 401 del config autenticado).
    billingApi
      .publicConfig()
      .then((d) => setFetchedLive(Boolean(d.paidPlansLive)))
      .catch(() => setFetchedLive(false));
  }, [paidPlansLive]);

  // Beta-seguro: mientras no se sepa, se asume que NO se pueden comprar (evita
  // mandar a un checkout roto en modo prueba).
  const live = typeof paidPlansLive === 'boolean' ? paidPlansLive : fetchedLive ?? false;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const highlighted = plan.key === HIGHLIGHT;
        const selected = plan.key === selectedKey;
        // Plan de pago que aún no se puede comprar → "Próximamente" + lista de espera.
        const gated = plan.priceMXN > 0 && !live;
        const card = (
          <div
            className={`relative flex h-full flex-col rounded-2xl border bg-surface p-6 transition ${
              selected
                ? 'border-brand-500 shadow-elevated ring-2 ring-brand-500'
                : highlighted
                  ? 'border-transparent shadow-elevated'
                  : 'border-line shadow-card'
            }`}
          >
            {gated ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Próximamente
                </span>
              </span>
            ) : highlighted ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge color="green">Más popular</Badge>
              </span>
            ) : null}
            <h3 className="text-lg font-bold text-fg">{plan.name}</h3>
            <div className="mt-2">
              {plan.priceMXN === 0 ? (
                <span className="text-3xl font-extrabold text-fg">Gratis</span>
              ) : cycle === 'anual' && plan.annual ? (
                <>
                  <span className="text-3xl font-extrabold tabular text-fg">
                    ${plan.annual.perMonthMXN.toLocaleString('es-MX')}
                  </span>
                  <span className="text-sm text-muted"> MXN/mes</span>
                  <span className="block text-xs text-subtle">
                    Pagas ${plan.annual.priceMXN.toLocaleString('es-MX')} al año · IVA incluido
                  </span>
                  <span className="mt-1 inline-block rounded-md bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                    Ahorras ${plan.annual.savingsMXN.toLocaleString('es-MX')} al año
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-extrabold tabular text-fg">
                    ${plan.priceMXN.toLocaleString('es-MX')}
                  </span>
                  <span className="text-sm text-muted"> MXN/mes</span>
                  <span className="block text-xs text-subtle">IVA incluido</span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-fg">
              {fmtConversations(plan.monthlyTokenLimit)} conversaciones al mes
            </p>
            <p className="mt-0.5 text-xs text-subtle">
              Aproximado; equivale a {plan.monthlyTokenLimit.toLocaleString('es-MX')} tokens de IA
            </p>

            <ul className="mt-4 flex-1 space-y-2 text-sm text-fg">
              {(plan.highlights || []).map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  {h}
                </li>
              ))}
            </ul>

            {gated ? (
              <WaitlistButton planKey={plan.key} planName={plan.name} />
            ) : (
              onSelect &&
              (ctaFor ? (
                // Modo gestión: etiqueta por plan; el plan actual queda inerte.
                <>
                  <Button
                    className="mt-6 w-full"
                    variant={selected ? 'secondary' : highlighted ? 'primary' : 'secondary'}
                    disabled={selected}
                    onClick={() => onSelect(plan.key)}
                  >
                    {selected && <Icon name="check" size={16} />}
                    {ctaFor(plan)}
                  </Button>
                  {(() => {
                    const alt = secondaryFor?.(plan);
                    return alt ? (
                      <Button className="mt-2 w-full" variant="ghost" size="sm" disabled={alt.disabled} onClick={alt.onClick}>
                        {alt.label}
                      </Button>
                    ) : null;
                  })()}
                </>
              ) : (
                <Button
                  className="mt-6 w-full"
                  variant={selected || highlighted ? 'primary' : 'secondary'}
                  onClick={() => onSelect(plan.key)}
                >
                  {selected && <Icon name="check" size={16} />}
                  {selected ? 'Seleccionado' : ctaLabel}
                </Button>
              ))
            )}
          </div>
        );

        return (
          <div key={plan.key} className="relative">
            {highlighted && !selected && !gated ? <BorderBeam>{card}</BorderBeam> : card}
          </div>
        );
      })}
    </div>
  );
}

const fmtDay = (d) =>
  new Date(new Date(d).getTime() - 1).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });

/**
 * Selector Mensual / Anual. Con `pricing.annual` (de GET /plans) muestra la
 * oferta vigente: precio de fundador ("pagas 9, recibes 12") hasta su fecha, o
 * el anual normal después.
 */
export function CycleToggle({ cycle, onChange, pricing, className = '' }) {
  const a = pricing?.annual;
  const free = a ? 12 - a.monthsPaid : 2;
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="inline-flex rounded-xl border border-line bg-surface p-1 text-sm" role="radiogroup" aria-label="Forma de pago">
        {[
          ['mensual', 'Mensual'],
          ['anual', 'Anual'],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={cycle === k}
            onClick={() => onChange(k)}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 font-semibold transition ${
              cycle === k ? 'bg-brand-700 text-white shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            {label}
            {k === 'anual' && (
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${cycle === k ? 'bg-white/20 text-white' : 'bg-brand-500/10 text-brand-700 dark:text-brand-300'}`}>
                {free} meses gratis
              </span>
            )}
          </button>
        ))}
      </div>
      {a && (
        <p className="text-center text-xs text-muted">
          {a.founder
            ? `Precio de fundador: pagas ${a.monthsPaid} meses y recibes 12, hasta el ${fmtDay(a.founderUntil)}. Lo conservas mientras renueves.`
            : `Pagas ${a.monthsPaid} meses y recibes 12.`}{' '}
          Garantía de {a.guaranteeDays} días en el plan anual.
        </p>
      )}
    </div>
  );
}
