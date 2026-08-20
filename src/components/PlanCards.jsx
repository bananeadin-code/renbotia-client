import { Button, Badge } from './ui/index.jsx';
import { Icon } from './ui/Icon.jsx';
import { BorderBeam } from './ui/BorderBeam.jsx';

const HIGHLIGHT = 'pro'; // plan destacado

/**
 * Grid de tarjetas de planes reutilizable (precios y onboarding).
 * @param {Array} plans
 * @param {string} [selectedKey] - plan seleccionado/actual (resalta con anillo)
 * @param {function} [onSelect] - callback al elegir un plan
 * @param {string} [ctaLabel] - etiqueta única del botón (modo simple)
 * @param {function} [ctaFor] - etiqueta por plan (modo gestión); si se pasa, el
 *   botón del plan actual (selectedKey) queda deshabilitado.
 */
export function PlanCards({ plans, selectedKey, onSelect, ctaLabel = 'Elegir plan', ctaFor }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => {
        const highlighted = plan.key === HIGHLIGHT;
        const selected = plan.key === selectedKey;
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
            {highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge color="green">Más popular</Badge>
              </span>
            )}
            <h3 className="text-lg font-bold text-fg">{plan.name}</h3>
            <div className="mt-2">
              {plan.priceMXN === 0 ? (
                <span className="text-3xl font-extrabold text-fg">Gratis</span>
              ) : (
                <>
                  <span className="text-3xl font-extrabold tabular text-fg">
                    ${plan.priceMXN.toLocaleString('es-MX')}
                  </span>
                  <span className="text-sm text-muted"> MXN/mes</span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {plan.monthlyTokenLimit.toLocaleString('es-MX')} tokens/mes
            </p>

            <ul className="mt-4 flex-1 space-y-2 text-sm text-fg">
              {(plan.highlights || []).map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  {h}
                </li>
              ))}
            </ul>

            {onSelect &&
              (ctaFor ? (
                // Modo gestión: etiqueta por plan; el plan actual queda inerte.
                <Button
                  className="mt-6 w-full"
                  variant={selected ? 'secondary' : highlighted ? 'primary' : 'secondary'}
                  disabled={selected}
                  onClick={() => onSelect(plan.key)}
                >
                  {selected && <Icon name="check" size={16} />}
                  {ctaFor(plan)}
                </Button>
              ) : (
                <Button
                  className="mt-6 w-full"
                  variant={selected || highlighted ? 'primary' : 'secondary'}
                  onClick={() => onSelect(plan.key)}
                >
                  {selected && <Icon name="check" size={16} />}
                  {selected ? 'Seleccionado' : ctaLabel}
                </Button>
              ))}
          </div>
        );

        return (
          <div key={plan.key} className="relative">
            {highlighted && !selected ? <BorderBeam>{card}</BorderBeam> : card}
          </div>
        );
      })}
    </div>
  );
}
