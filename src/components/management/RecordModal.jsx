import { useEffect, useState } from 'react';
import { Button, Input, Textarea, Select, Spinner, Alert } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { managementApi } from '../../api/endpoints.js';
import { TYPE_META, STATUS_META, STATUS_ORDER } from '../../lib/managementMeta.js';

/** Convierte un Date/ISO a los valores locales para inputs date/time. */
function toLocalParts(iso) {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

/**
 * Modal para crear o editar un registro. Si el tipo es agendable muestra fecha +
 * hora y permite ver los horarios libres de ese día (consulta el backend).
 */
export function RecordModal({ open, onClose, onSaved, enabledTypes, record, preset }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(null);
  const [slots, setSlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (record) {
      const parts = toLocalParts(record.scheduledAt);
      setForm({
        type: record.type,
        status: record.status,
        name: record.customer?.name || '',
        contact: record.customer?.contact || '',
        summary: record.summary || '',
        notes: record.notes || '',
        quantity: record.quantity || 1,
        date: parts.date,
        time: parts.time,
      });
    } else {
      // Si viene un preset del calendario, arranca como un tipo agendable para
      // que se muestren fecha/hora ya rellenas.
      const scheduledType = enabledTypes.find((t) => TYPE_META[t]?.scheduled);
      const type = preset?.date && scheduledType ? scheduledType : enabledTypes[0] || 'cita';
      setForm({
        type,
        status: 'pendiente',
        name: '',
        contact: '',
        summary: '',
        notes: '',
        quantity: 1,
        date: preset?.date || '',
        time: preset?.time || '',
      });
    }
    setSlots(null);
    setError('');
  }, [open, record, enabledTypes, preset]);

  if (!open || !form) return null;

  const meta = TYPE_META[form.type] || TYPE_META.cita;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function loadSlots() {
    if (!form.date) return;
    setLoadingSlots(true);
    try {
      const { slots: s } = await managementApi.availability({ date: form.date });
      setSlots(s);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSave() {
    setError('');
    if (meta.scheduled && (!form.date || !form.time)) {
      setError('Indica la fecha y la hora del espacio.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        status: form.status,
        customer: { name: form.name.trim(), contact: form.contact.trim() },
        summary: form.summary.trim(),
        notes: form.notes.trim(),
        quantity: Number(form.quantity) || 1,
      };
      if (meta.scheduled && form.date && form.time) {
        // Enviamos fecha+hora local como ISO sin zona (el backend la interpreta local).
        payload.scheduledAt = `${form.date}T${form.time}:00`;
      } else if (!meta.scheduled) {
        payload.scheduledAt = null;
      }

      if (editing) {
        await managementApi.updateRecord(record.id || record._id, payload);
      } else {
        await managementApi.createRecord(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el registro.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-pop sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-fg">
            <Icon name={meta.icon} size={20} className="text-brand-600" />
            {editing ? 'Editar registro' : 'Nuevo registro'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface2" aria-label="Cerrar">
            <Icon name="close" size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-3">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => set({ type: e.target.value })}
              disabled={editing}
            >
              {enabledTypes.map((t) => (
                <option key={t} value={t}>
                  {TYPE_META[t]?.label || t}
                </option>
              ))}
            </Select>
            <Select label="Estado" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre del cliente"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Nombre completo"
            />
            <Input
              label="Contacto"
              value={form.contact}
              onChange={(e) => set({ contact: e.target.value })}
              placeholder="Tel / WhatsApp / correo"
            />
          </div>

          <Input
            label="Resumen"
            value={form.summary}
            onChange={(e) => set({ summary: e.target.value })}
            placeholder={meta.scheduled ? 'Ej. Consulta legal' : 'Ej. Pedido 2 pizzas'}
          />

          {meta.scheduled && (
            <div className="rounded-xl border border-line bg-surface2/60 p-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Fecha"
                  type="date"
                  value={form.date}
                  onChange={(e) => {
                    set({ date: e.target.value });
                    setSlots(null);
                  }}
                />
                <Input label="Hora" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
              </div>
              <button
                type="button"
                onClick={loadSlots}
                disabled={!form.date || loadingSlots}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline disabled:opacity-50 dark:text-brand-300"
              >
                {loadingSlots ? <Spinner size={14} /> : <Icon name="clock" size={14} />}
                Ver horarios libres
              </button>
              {slots && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {slots.length === 0 ? (
                    <span className="text-xs text-muted">Sin espacios libres ese día.</span>
                  ) : (
                    slots.map((s) => (
                      <button
                        key={s.iso}
                        type="button"
                        onClick={() => set({ time: s.time })}
                        className={`rounded-lg border px-2 py-1 text-xs font-medium transition ${
                          form.time === s.time
                            ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                            : 'border-line text-muted hover:bg-surface'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))
                  )}
                </div>
              )}
              <p className="mt-2 text-[11px] text-subtle">
                El alta manual puede sobre-agendar aunque el espacio esté ocupado.
              </p>
            </div>
          )}

          {form.type === 'reservacion' && (
            <Input
              label="Personas"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => set({ quantity: e.target.value })}
            />
          )}

          <Textarea
            label="Notas"
            rows={2}
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Detalles adicionales…"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size={16} /> : <Icon name="check" size={16} />}
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </div>
    </div>
  );
}
