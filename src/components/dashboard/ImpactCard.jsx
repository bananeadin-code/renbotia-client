import { useState } from 'react';
import { Link } from 'react-router-dom';
import { businessApi, usageApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { useAccess } from '../../router/RequirePermission.jsx';
import { Card, Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * "Lo que generó tu bot" (Inicio): resultados del mes en datos reales y su
 * estimación en pesos con el ticket promedio del negocio. Reemplaza a la
 * tarjeta "Impacto de tu bot" (mismos datos y más). Incluye el interruptor del
 * reporte semanal por correo.
 */
const money = (n) => `$${Math.round(n || 0).toLocaleString('es-MX')}`;
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('es-MX'));

export function ImpactCard({ impact, onChange, canEdit = true, canToggleReport = true }) {
  const configured = Boolean(impact?.settings?.configured);
  const canTrain = useAccess('training', 'view');
  const [editing, setEditing] = useState(false);
  const [ticket, setTicket] = useState('');
  const [hourly, setHourly] = useState('');
  const [saving, setSaving] = useState(false);

  function openEditor() {
    setTicket(impact?.settings?.avgTicket ? String(impact.settings.avgTicket) : '');
    setHourly(impact?.settings?.hourlyCost ? String(impact.settings.hourlyCost) : '60');
    setEditing(true);
  }

  async function saveValues(e) {
    e.preventDefault();
    const avgTicket = Number(String(ticket).replace(/[^\d.]/g, ''));
    const hourlyCost = Number(String(hourly).replace(/[^\d.]/g, '')) || 0;
    if (!avgTicket || avgTicket <= 0) {
      toast.error('Escribe cuánto vale una venta o cita promedio.');
      return;
    }
    setSaving(true);
    try {
      await businessApi.update({ roi: { avgTicket, hourlyCost } });
      onChange?.(await usageApi.impact());
      setEditing(false);
      toast.success('Listo. Ya calculamos lo que genera tu bot.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleReport() {
    const next = !(impact?.weeklyReport !== false);
    try {
      await businessApi.update({ weeklyReport: next });
      onChange?.({ ...impact, weeklyReport: next });
      toast.success(next ? 'Te mandaremos el reporte cada lunes.' : 'Reporte semanal apagado.');
    } catch {
      toast.error('No se pudo cambiar.');
    }
  }

  const total = impact?.value?.total || 0;
  const showValue = configured && total > 0;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
            <Icon name="chart" size={18} />
          </span>
          <div>
            <h2 className="font-semibold text-fg">Lo que generó tu bot</h2>
            <p className="text-xs text-muted first-letter:uppercase">{impact?.month || 'Este mes'}</p>
          </div>
        </div>
        {canToggleReport && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          Reporte cada lunes
          <button
            type="button"
            role="switch"
            aria-checked={impact?.weeklyReport !== false}
            aria-label="Recibir el reporte semanal por correo"
            onClick={toggleReport}
            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
              impact?.weeklyReport !== false ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                impact?.weeklyReport !== false ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </label>
        )}
      </div>

      {/* Valor en pesos o invitación a configurarlo */}
      {editing ? (
        <form onSubmit={saveValues} noValidate className="mt-4 grid gap-3 rounded-xl border border-line bg-surface2/40 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-fg">Venta o cita promedio</span>
            <span className="flex items-center rounded-lg border border-line bg-canvas focus-within:border-brand-500">
              <span className="pl-3 text-sm text-subtle">$</span>
              <input
                inputMode="decimal"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="500"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-fg outline-none"
                aria-label="Venta o cita promedio en pesos"
                autoFocus
              />
              <span className="pr-3 text-xs text-subtle">MXN</span>
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-fg">Costo por hora de atención</span>
            <span className="flex items-center rounded-lg border border-line bg-canvas focus-within:border-brand-500">
              <span className="pl-3 text-sm text-subtle">$</span>
              <input
                inputMode="decimal"
                value={hourly}
                onChange={(e) => setHourly(e.target.value)}
                placeholder="60"
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-fg outline-none"
                aria-label="Costo por hora de atención en pesos"
              />
              <span className="pr-3 text-xs text-subtle">/h</span>
            </span>
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Guardando…' : 'Calcular'}
            </Button>
          </div>
        </form>
      ) : showValue ? (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="tabular text-4xl font-extrabold tracking-tight text-brand-600">≈ {money(total)}</div>
            <p className="mt-1 text-sm text-muted">
              {money(impact.value.captured)} en citas y pedidos captados + {money(impact.value.time)} en tiempo ahorrado
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {impact.roiMultiple >= 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Icon name="sparkles" size={13} /> ≈ {impact.roiMultiple}× lo que cuesta tu plan
              </span>
            )}
            {canEdit && (
              <button type="button" onClick={openEditor} className="text-xs font-medium text-muted hover:text-fg">
                Ajustar valores
              </button>
            )}
          </div>
        </div>
      ) : !configured ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-brand-400/40 bg-brand-500/[0.04] p-3">
          <p className="text-sm text-fg">
            ¿Cuánto vale una venta o cita promedio en tu negocio? Con ese dato te decimos cuánto dinero te genera tu bot.
          </p>
          {canEdit ? (
            <Button size="sm" onClick={openEditor} className="shrink-0">
              Calcularlo
            </Button>
          ) : (
            <span className="text-xs text-muted">El dueño puede configurarlo.</span>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Aún no hay ventas ni tiempo ahorrado este mes. En cuanto tu bot atienda clientes, aquí verás cuánto te generó.{' '}
          {canEdit && (
            <button type="button" onClick={openEditor} className="font-medium text-brand-600 hover:underline">
              Ajustar valores
            </button>
          )}
        </p>
      )}

      {/* Datos reales */}
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
        <div>
          <div className="tabular text-2xl font-extrabold text-fg">{num(impact?.conversations)}</div>
          <div className="text-xs text-muted">Conversaciones atendidas</div>
        </div>
        {impact?.outsideHours != null ? (
          <div>
            <div className="tabular text-2xl font-extrabold text-fg">{num(impact.outsideHours)}</div>
            <div className="text-xs text-muted">Clientes atendidos fuera de horario</div>
          </div>
        ) : (
          <div>
            <div className="tabular text-2xl font-extrabold text-fg">{num(impact?.botReplies)}</div>
            <div className="text-xs text-muted">Mensajes que respondió el bot</div>
          </div>
        )}
        <Link to="/dashboard/conversaciones" className="group">
          <div className="tabular text-2xl font-extrabold text-fg group-hover:text-brand-600">{num(impact?.hotLeads)}</div>
          <div className="text-xs text-muted">Leads calientes detectados</div>
        </Link>
        <div>
          <div className="tabular text-2xl font-extrabold text-fg">{num(impact?.captured)}</div>
          <div className="text-xs text-muted">Citas y pedidos captados</div>
        </div>
      </div>

      <p className="mt-3 text-xs text-subtle">
        Datos reales de WhatsApp, Messenger, Instagram y tu sitio (sin el simulador). El valor en pesos es una estimación
        con tus valores: venta promedio por cita o pedido captado y ~2 min ahorrados por respuesta del bot
        {impact?.hoursSaved ? ` (~${num(impact.hoursSaved)} h este mes)` : ''}.
        {configured && impact?.value?.opportunities > 0
          ? ` Además tienes ≈ ${money(impact.value.opportunities)} en oportunidades abiertas (leads y prospectos).`
          : ''}
        {impact?.outsideHours == null && (
          <>
            {' '}
            Activa tu{' '}
            {canTrain ? (
              <Link to="/dashboard/entrenamiento" className="font-medium text-brand-600 hover:underline">
                horario de atención
              </Link>
            ) : (
              'horario de atención'
            )}{' '}
            para ver cuántos clientes atiende cuando estás cerrado.
          </>
        )}
      </p>
    </Card>
  );
}
