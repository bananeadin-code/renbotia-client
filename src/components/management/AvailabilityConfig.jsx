import { useState } from 'react';
import { Button, Input, Textarea, Card, Spinner, Alert } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { managementApi } from '../../api/endpoints.js';
import { TYPE_META, ALL_TYPES, DAY_NAMES_LONG } from '../../lib/managementMeta.js';

/**
 * Formulario de configuración del módulo: qué capta el bot y la disponibilidad
 * de la agenda (horario semanal, duración, capacidad, anticipación, horizonte,
 * días bloqueados). Es la fuente que usa el bot para saber qué está ocupado.
 */
export function AvailabilityConfig({ config, onSaved }) {
  const [form, setForm] = useState(() => ({
    enabled: config.enabled,
    enabledTypes: [...(config.enabledTypes || [])],
    slotMinutes: config.slotMinutes,
    capacityPerSlot: config.capacityPerSlot,
    leadTimeHours: config.leadTimeHours,
    horizonDays: config.horizonDays,
    schedule: (config.schedule || []).map((d) => ({ ...d })),
    blackoutDates: [...(config.blackoutDates || [])],
    instructions: config.instructions || '',
  }));
  const [newBlackout, setNewBlackout] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const hasScheduled = form.enabledTypes.some((t) => TYPE_META[t]?.scheduled);

  function toggleType(t) {
    setForm((f) => ({
      ...f,
      enabledTypes: f.enabledTypes.includes(t)
        ? f.enabledTypes.filter((x) => x !== t)
        : [...f.enabledTypes, t],
    }));
  }

  function setDay(day, patch) {
    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((d) => (d.day === day ? { ...d, ...patch } : d)),
    }));
  }

  function addBlackout() {
    if (newBlackout && !form.blackoutDates.includes(newBlackout)) {
      set({ blackoutDates: [...form.blackoutDates, newBlackout].sort() });
    }
    setNewBlackout('');
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      await managementApi.updateConfig({
        enabled: form.enabled,
        enabledTypes: form.enabledTypes,
        slotMinutes: Number(form.slotMinutes),
        capacityPerSlot: Number(form.capacityPerSlot),
        leadTimeHours: Number(form.leadTimeHours),
        horizonDays: Number(form.horizonDays),
        schedule: form.schedule,
        blackoutDates: form.blackoutDates,
        instructions: form.instructions,
      });
      setMsg({ variant: 'success', text: 'Configuración guardada.' });
      onSaved?.();
    } catch (err) {
      setMsg({ variant: 'error', text: err.response?.data?.message || 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  }

  // Ordena los días empezando en lunes (1..6, luego 0=domingo).
  const orderedDays = [...form.schedule].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));

  return (
    <div className="space-y-4">
      {msg && <Alert variant={msg.variant}>{msg.text}</Alert>}

      {/* Activación + tipos. Cuando está apagado, la tarjeta se resalta para que
          quede claro que hay que activar el módulo. */}
      <Card className={form.enabled ? '' : 'border-amber-500/40 ring-1 ring-amber-500/20'}>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-fg">Módulo de Gestión activo</div>
            <div className="text-sm text-muted">
              Cuando está activo, el bot puede consultar disponibilidad y registrar trabajo (citas,
              pedidos, prospectos).
            </div>
          </div>
          <Toggle checked={form.enabled} onChange={(v) => set({ enabled: v })} />
        </label>

        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-2 text-sm font-medium text-fg">¿Qué puede captar el bot?</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ALL_TYPES.map((t) => {
              const active = form.enabledTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'border-line text-muted hover:bg-surface2'
                  }`}
                >
                  <Icon name={TYPE_META[t].icon} size={20} />
                  {TYPE_META[t].plural}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Parámetros de agenda (solo si hay tipos agendables) */}
      {hasScheduled && (
        <Card>
          <div className="mb-3 flex items-center gap-2 font-semibold text-fg">
            <Icon name="sliders" size={18} className="text-brand-600" /> Parámetros de la agenda
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input
              label="Duración (min)"
              type="number"
              min="5"
              step="5"
              value={form.slotMinutes}
              onChange={(e) => set({ slotMinutes: e.target.value })}
            />
            <Input
              label="Capacidad/espacio"
              type="number"
              min="1"
              value={form.capacityPerSlot}
              onChange={(e) => set({ capacityPerSlot: e.target.value })}
            />
            <Input
              label="Anticipación (h)"
              type="number"
              min="0"
              value={form.leadTimeHours}
              onChange={(e) => set({ leadTimeHours: e.target.value })}
            />
            <Input
              label="Horizonte (días)"
              type="number"
              min="1"
              value={form.horizonDays}
              onChange={(e) => set({ horizonDays: e.target.value })}
            />
          </div>
          <p className="mt-2 text-xs text-subtle">
            Capacidad = cuántas citas/reservaciones simultáneas caben en un mismo espacio (recursos, mesas,
            profesionales).
          </p>

          {/* Horario semanal */}
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 text-sm font-medium text-fg">Horario de atención</div>
            <div className="space-y-1.5">
              {orderedDays.map((d) => (
                <div key={d.day} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <label className="flex w-24 shrink-0 items-center gap-2 sm:w-28">
                    <Toggle small checked={d.enabled} onChange={(v) => setDay(d.day, { enabled: v })} />
                    <span className={`text-sm ${d.enabled ? 'font-medium text-fg' : 'text-subtle'}`}>
                      {DAY_NAMES_LONG[d.day]}
                    </span>
                  </label>
                  {d.enabled ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={d.open}
                        onChange={(e) => setDay(d.day, { open: e.target.value })}
                        className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-fg"
                      />
                      <span className="text-subtle">–</span>
                      <input
                        type="time"
                        value={d.close}
                        onChange={(e) => setDay(d.day, { close: e.target.value })}
                        className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-fg"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-subtle">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Días bloqueados */}
          <div className="mt-4 border-t border-line pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-fg">
              <Icon name="ban" size={16} className="text-red-500" /> Días bloqueados (feriados, vacaciones)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {form.blackoutDates.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300"
                >
                  {date}
                  <button
                    onClick={() => set({ blackoutDates: form.blackoutDates.filter((x) => x !== date) })}
                    aria-label="Quitar"
                  >
                    <Icon name="close" size={13} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={newBlackout}
                  onChange={(e) => setNewBlackout(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-fg"
                />
                <Button size="sm" variant="secondary" onClick={addBlackout} disabled={!newBlackout}>
                  <Icon name="plus" size={14} /> Agregar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Instrucciones para el bot */}
      <Card>
        <Textarea
          label="Indicaciones para el bot (opcional)"
          rows={3}
          value={form.instructions}
          onChange={(e) => set({ instructions: e.target.value })}
          placeholder="Ej. Agenda consultas de 1 hora, confirma el área del caso y pide el nombre completo."
        />
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Spinner size={16} /> : <Icon name="check" size={16} />} Guardar configuración
        </Button>
      </div>
    </div>
  );
}

/** Toggle accesible reutilizable. */
function Toggle({ checked, onChange, small }) {
  const w = small ? 'h-5 w-9' : 'h-6 w-11';
  const dot = small ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const translate = small ? 'translate-x-4' : 'translate-x-6';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex ${w} shrink-0 items-center rounded-full transition ${
        checked ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
      }`}
    >
      <span
        className={`inline-block ${dot} transform rounded-full bg-white shadow transition ${
          checked ? translate : 'translate-x-1'
        }`}
      />
    </button>
  );
}
