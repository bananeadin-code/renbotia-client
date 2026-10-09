import { useEffect, useState } from 'react';
import { membersApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Modal } from '../ui/Modal.jsx';
import { Card, Button, Input, Notice } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/** Etiquetas e íconos de cada módulo (en el mismo orden que el servidor). */
export const MODULE_INFO = {
  conversations: ['Conversaciones', 'inbox'],
  training: ['Entrenamiento', 'academic'],
  simulator: ['Simulador', 'message'],
  management: ['Gestión de trabajo', 'calendarCheck'],
  analytics: ['Analíticas', 'chart'],
  connections: ['Conexiones', 'link'],
  profile: ['Datos del negocio', 'building'],
  team: ['Equipo', 'users'],
  activity: ['Actividad', 'clipboard'],
};
const LEVEL_LABEL = { none: 'Sin acceso', view: 'Ver', edit: 'Editar' };
const CHANNEL_LABEL = { whatsapp: 'WhatsApp', facebook: 'Messenger', instagram: 'Instagram', web: 'Sitio web' };

/** Resumen compacto del acceso de alguien (qué módulos ve/edita y canales). */
export function AccessSummary({ access }) {
  if (!access) return null;
  const mods = Object.entries(access.modules || {}).filter(([, l]) => l !== 'none');
  return (
    <div className="flex flex-wrap gap-1">
      {mods.map(([m, l]) => (
        <span
          key={m}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            l === 'edit' ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'bg-surface2 text-muted'
          }`}
          title={`${MODULE_INFO[m]?.[0] || m}: ${LEVEL_LABEL[l]}`}
        >
          <Icon name={l === 'edit' ? 'edit' : 'eye'} size={11} />
          {MODULE_INFO[m]?.[0] || m}
        </span>
      ))}
      {access.channels !== 'all' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
          Solo {(access.channels || []).map((c) => CHANNEL_LABEL[c] || c).join(', ') || 'ningún canal'}
        </span>
      )}
    </div>
  );
}

/** Selector de rol (listos, personalizados del negocio y "Personalizado…"). */
export function RoleSelect({ value, roles, onChange, disabled, includeCustom = true, id }) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-fg outline-none focus:border-brand-500 disabled:opacity-60"
    >
      <optgroup label="Roles listos">
        {(roles?.presets || []).map((r) => (
          <option key={r.key} value={r.key}>
            {r.name}
          </option>
        ))}
      </optgroup>
      {(roles?.custom || []).length > 0 && (
        <optgroup label="Roles de tu negocio">
          {roles.custom.map((r) => (
            <option key={r.key} value={r.key}>
              {r.name}
            </option>
          ))}
        </optgroup>
      )}
      {includeCustom && <option value="custom">{value === 'custom' ? 'Personalizado' : 'Personalizado…'}</option>}
    </select>
  );
}

/**
 * Editor de acceso: matriz módulo × nivel y canales. Sirve para un rol
 * personalizado del negocio (con nombre) o para el acceso propio de una persona.
 */
export function AccessEditor({ open, onClose, title, withName = false, initial, catalog, onSave, saving }) {
  const [name, setName] = useState('');
  const [modules, setModules] = useState({});
  const [channels, setChannels] = useState('all');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setModules({ ...(initial?.modules || {}) });
    setChannels(initial?.channels || 'all');
  }, [open, initial]);

  const allChannels = catalog?.channels || ['whatsapp', 'facebook', 'instagram', 'web'];
  const list = channels === 'all' ? allChannels : channels;
  const toggleChannel = (c) => {
    const next = list.includes(c) ? list.filter((x) => x !== c) : [...list, c];
    setChannels(next.length === allChannels.length ? 'all' : next);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name: name.trim(), modules, channels });
        }}
        className="space-y-5"
      >
        {withName && (
          <Input label="Nombre del rol" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ej. Recepción" required />
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-fg">Qué puede hacer</p>
          <div className="divide-y divide-line rounded-xl border border-line">
            {(catalog?.modules || Object.keys(MODULE_INFO)).map((m) => {
              const levels = catalog?.moduleLevels?.[m] || ['none', 'view', 'edit'];
              const current = modules[m] || 'none';
              return (
                <div key={m} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-fg">
                    <Icon name={MODULE_INFO[m]?.[1] || 'sliders'} size={15} className="text-subtle" />
                    {MODULE_INFO[m]?.[0] || m}
                  </span>
                  <div className="flex rounded-lg border border-line p-0.5 text-xs" role="radiogroup" aria-label={MODULE_INFO[m]?.[0]}>
                    {levels.map((l) => (
                      <button
                        key={l}
                        type="button"
                        role="radio"
                        aria-checked={current === l}
                        onClick={() => setModules((x) => ({ ...x, [m]: l }))}
                        className={`rounded-md px-2.5 py-1 font-medium transition ${
                          current === l
                            ? l === 'none'
                              ? 'bg-surface2 text-fg'
                              : 'bg-brand-600 text-white'
                            : 'text-muted hover:text-fg'
                        }`}
                      >
                        {m === 'simulator' && l === 'edit' ? 'Usar' : LEVEL_LABEL[l]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-fg">Conversaciones de qué canales</p>
          <div className="flex flex-wrap gap-2">
            {allChannels.map((c) => {
              const on = list.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleChannel(c)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    on ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'border-line text-muted hover:text-fg'
                  }`}
                >
                  <Icon name={on ? 'check' : 'plus'} size={12} /> {CHANNEL_LABEL[c]}
                </button>
              );
            })}
          </div>
          {list.length === 0 && <p className="mt-2 text-xs text-amber-600">Sin canales no verá conversaciones de clientes.</p>}
        </div>

        <Notice variant="security">
          Facturación, la seguridad del equipo y el control del bot por WhatsApp son siempre solo del dueño.
        </Notice>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || (withName && name.trim().length < 2)}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Roles personalizados del negocio (solo el dueño los crea, edita y borra). */
export function CustomRolesCard({ catalog, onChanged }) {
  const [editing, setEditing] = useState(null); // null | { id?, name, modules, channels }
  const [saving, setSaving] = useState(false);
  const custom = catalog?.custom || [];

  async function save(v) {
    setSaving(true);
    try {
      const body = { name: v.name, modules: v.modules, channels: v.channels };
      if (editing?.id) await membersApi.updateRole(editing.id, body);
      else await membersApi.createRole(body);
      toast.success(editing?.id ? 'Rol actualizado. Aplica a quien lo tenga.' : 'Rol creado.');
      setEditing(null);
      await onChanged();
    } catch (err) {
      if (err.message !== 'cancelled') toast.error(err.response?.data?.message || 'No se pudo guardar el rol.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(r) {
    const ok = await confirm({
      title: 'Borrar rol',
      message: `Quien tenga el rol "${r.name}" pasará a Solo lectura. ¿Borrarlo?`,
      tone: 'danger',
      confirmLabel: 'Borrar',
    });
    if (!ok) return;
    try {
      const d = await membersApi.deleteRole(r.id);
      toast.success(d.moved ? `Rol borrado. ${d.moved} ${d.moved === 1 ? 'persona pasó' : 'personas pasaron'} a Solo lectura.` : 'Rol borrado.');
      await onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo borrar.');
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-fg">Roles de tu negocio</h2>
          <p className="mt-0.5 text-sm text-muted">
            Además de los roles listos, crea los tuyos (p. ej. "Recepción" solo con WhatsApp y la agenda).
          </p>
        </div>
        {custom.length < 10 && (
          <Button size="sm" variant="secondary" onClick={() => setEditing({ name: '', modules: { conversations: 'edit' }, channels: 'all' })}>
            <Icon name="plus" size={15} /> Nuevo rol
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {(catalog?.presets || []).map((r) => (
          <div key={r.key} className="rounded-lg border border-line px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-fg">{r.name}</span>
              <span className="text-[11px] font-medium text-subtle">Rol listo</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">{r.description}</p>
          </div>
        ))}
        {custom.map((r) => (
          <div key={r.id} className="rounded-lg border border-line px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-fg">{r.name}</span>
              <span className="flex items-center gap-1">
                <button type="button" onClick={() => setEditing(r)} className="rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-fg" aria-label={`Editar ${r.name}`}>
                  <Icon name="edit" size={15} />
                </button>
                <button type="button" onClick={() => remove(r)} className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500" aria-label={`Borrar ${r.name}`}>
                  <Icon name="trash" size={15} />
                </button>
              </span>
            </div>
            <div className="mt-1.5">
              <AccessSummary access={r} />
            </div>
          </div>
        ))}
      </div>

      <AccessEditor
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Editar "${editing.name}"` : 'Nuevo rol'}
        withName
        initial={editing}
        catalog={catalog}
        onSave={save}
        saving={saving}
      />
    </Card>
  );
}
