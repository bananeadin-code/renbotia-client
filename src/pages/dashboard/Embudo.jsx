import { useCallback, useEffect, useMemo, useState } from 'react';
import { funnelApi } from '../../api/endpoints.js';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { Button, Card, Input, Select, Spinner, Textarea, Badge } from '../../components/ui/index.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { CANCEL_REASONS } from '../../components/billing/CancelDialog.jsx';

/**
 * Embudo comercial: de dónde llegan los registros, en qué paso van y cuánto
 * cuesta conseguir un cliente. El equipo de soporte ve el seguimiento (CRM);
 * el admin además ve resultados, inversión y la calculadora.
 */

const AUTO = {
  registrado: { label: 'Registrado', color: 'slate' },
  verificado: { label: 'Verificó correo', color: 'slate' },
  negocio: { label: 'Creó negocio', color: 'amber' },
  conectado: { label: 'Conectó canal', color: 'green' },
  pago: { label: 'Pagó', color: 'green' },
};
const AUTO_ORDER = ['registrado', 'verificado', 'negocio', 'conectado', 'pago'];
const STAGES = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  llamada_agendada: 'Llamada agendada',
  en_seguimiento: 'En seguimiento',
  ganado: 'Ganado',
  perdido: 'Perdido',
};
const RANGES = [
  { key: '7', label: '7 días' },
  { key: '30', label: '30 días' },
  { key: '90', label: '90 días' },
  { key: 'mes', label: 'Este mes' },
];
const SPEND_CHANNELS = { meta: 'Meta (pauta)', google: 'Google (pauta)', agencia: 'Agencia', otro: 'Otro' };

const ymd = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const money = (n) => (n == null ? '—' : `$${Math.round(n).toLocaleString('es-MX')}`);
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '—');

function rangeParams(key) {
  const now = new Date();
  if (key === 'mes') return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
  return { from: ymd(new Date(now.getTime() - Number(key) * 864e5)), to: ymd(now) };
}

export default function Embudo() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [range, setRange] = useState('30');
  const [tab, setTab] = useState('seguimiento');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">Embudo</h1>
          <p className="mt-1 text-sm text-muted">Registros de las campañas, su avance y el seguimiento del equipo.</p>
        </div>
        <div className="flex rounded-lg border border-line p-0.5 text-sm" role="radiogroup" aria-label="Periodo">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={range === r.key}
              onClick={() => setRange(r.key)}
              className={`min-h-[36px] rounded-md px-3 font-medium transition ${range === r.key ? 'bg-fg text-canvas' : 'text-muted hover:text-fg'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-1 border-b border-line text-sm">
          {[
            ['seguimiento', 'Seguimiento'],
            ['resultados', 'Resultados e inversión'],
            ['calculadora', 'Calculadora'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 px-3 py-2 font-medium transition ${tab === k ? 'border-brand-600 text-fg' : 'border-transparent text-muted hover:text-fg'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {(!isAdmin || tab === 'seguimiento') && <Seguimiento range={range} isAdmin={isAdmin} me={user} />}
      {isAdmin && tab === 'resultados' && <Resultados range={range} />}
      {isAdmin && tab === 'calculadora' && <Calculadora />}
    </div>
  );
}

/* ── Seguimiento (CRM) ─────────────────────────────────────────────────── */

function Seguimiento({ range, isAdmin, me }) {
  const [data, setData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [filters, setFilters] = useState({ auto: '', stage: '', channel: '', assignee: '', q: '' });
  const [open, setOpen] = useState(null); // lead abierto en el detalle

  const load = useCallback(async () => {
    const params = { ...rangeParams(range), ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
    try {
      setData(await funnelApi.leads(params));
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cargar el embudo.');
      setData({ leads: [], total: 0, channelNames: {} });
    }
  }, [range, filters]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    funnelApi.staff().then((d) => setStaff(d.staff)).catch(() => {});
  }, []);

  async function patch(lead, body) {
    try {
      await funnelApi.updateLead(lead.userId, body);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    }
  }

  const counts = useMemo(() => {
    const c = Object.fromEntries(AUTO_ORDER.map((k) => [k, 0]));
    (data?.leads || []).forEach((l) => (c[l.autoStage] += 1));
    return c;
  }, [data]);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-brand-600" />
      </div>
    );
  }
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {AUTO_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilters((f) => ({ ...f, auto: f.auto === k ? '' : k }))}
            className={`rounded-lg border p-3 text-left transition ${filters.auto === k ? 'border-brand-500 bg-brand-500/5' : 'border-line bg-surface hover:bg-surface2'}`}
          >
            <div className="text-xs text-muted">{AUTO[k].label}</div>
            <div className="mt-1 text-2xl font-bold tabular text-fg">{counts[k]}</div>
          </button>
        ))}
      </div>

      <Card className="grid gap-3 sm:grid-cols-4">
        <Input label="Buscar" placeholder="Nombre, correo, negocio o teléfono" value={filters.q} onChange={set('q')} />
        <Select label="Seguimiento" value={filters.stage} onChange={set('stage')}>
          <option value="">Todos</option>
          {Object.entries(STAGES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select label="Canal" value={filters.channel} onChange={set('channel')}>
          <option value="">Todos</option>
          {Object.entries(data.channelNames || {}).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select label="Responsable" value={filters.assignee} onChange={set('assignee')}>
          <option value="">Todos</option>
          <option value="me">Míos</option>
          <option value="none">Sin asignar</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Card>

      <p className="text-sm text-muted">
        {data.total} registro{data.total === 1 ? '' : 's'}
        {data.total > data.leads.length ? ` (se muestran ${data.leads.length})` : ''}
      </p>

      {!data.leads.length ? (
        <Card className="py-12 text-center text-sm text-muted">No hay registros con estos filtros.</Card>
      ) : (
        <div className="space-y-2">
          {data.leads.map((l) => (
            <Card key={l.userId} className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1.2fr_auto] md:items-center">
              <div className="min-w-0">
                <div className="truncate font-semibold text-fg">{l.name}</div>
                <div className="truncate text-sm text-muted">{l.email}</div>
                <div className="mt-1 text-xs text-subtle">
                  {fmtDate(l.createdAt)} · {data.channelNames?.[l.channel] || l.channel}
                  {l.campaign ? ` · ${l.campaign}` : ''}
                </div>
              </div>
              <div className="min-w-0 text-sm">
                <div className="truncate text-fg">{l.business?.name || 'Sin negocio aún'}</div>
                <div className="truncate text-muted">{l.lead?.phone || l.business?.phone || 'Sin teléfono'}</div>
                <div className="mt-1">
                  <Badge color={AUTO[l.autoStage].color}>{AUTO[l.autoStage].label}</Badge>
                  {l.complimentary && <span className="ml-1 text-xs text-subtle">cortesía</span>}
                  {l.autoStage === 'pago' && l.cycle === 'anual' && <span className="ml-1 text-xs font-medium text-fg">anual</span>}
                  {l.canceled && (
                    <span className="ml-1 text-xs font-medium text-red-700 dark:text-red-300" title={l.canceled.reason ? CANCEL_REASONS[l.canceled.reason] : ''}>
                      · canceló{l.canceled.reason ? `: ${CANCEL_REASONS[l.canceled.reason] || l.canceled.reason}` : ''}
                    </span>
                  )}
                  {l.autoStage === 'pago' && !l.complimentary && (!l.lastActivityAt || Date.now() - new Date(l.lastActivityAt) > 7 * 864e5) && (
                    <span className="ml-1 text-xs font-medium text-amber-700 dark:text-amber-300" title="Paga pero no ha tenido conversaciones reales en 7 días">
                      · sin conversaciones 7+ días
                    </span>
                  )}
                  {l.lead?.orientationAt && (
                    <span className="ml-1 text-xs text-subtle" title="Sesión de orientación realizada">
                      · orientación hecha
                    </span>
                  )}
                  {isAdmin && l.revenueMXN > 0 && <span className="ml-2 text-xs font-medium text-brand-700 dark:text-brand-300">{money(l.revenueMXN)}</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select size="sm" aria-label="Seguimiento" value={l.lead?.stage || 'nuevo'} onChange={(e) => patch(l, { stage: e.target.value })}>
                  {Object.entries(STAGES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
                <Select
                  size="sm"
                  aria-label="Responsable"
                  value={l.lead?.assignee?.id || ''}
                  onChange={(e) => patch(l, { assigneeId: e.target.value || null })}
                >
                  <option value="">Sin asignar</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id === String(me?._id) ? `${s.name} (yo)` : s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                {l.lead?.nextFollowUpAt && (
                  <span className="text-xs text-muted" title="Próximo seguimiento">
                    <Icon name="calendar" size={13} className="mr-1 inline" />
                    {fmtDate(l.lead.nextFollowUpAt)}
                  </span>
                )}
                <Button size="sm" variant="secondary" onClick={() => setOpen(l)}>
                  Detalle{l.lead?.notes?.length ? ` (${l.lead.notes.length})` : ''}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <LeadDetail
        lead={open}
        onClose={() => setOpen(null)}
        onSaved={async () => {
          await load();
        }}
      />
    </div>
  );
}

function LeadDetail({ lead, onClose, onSaved }) {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ phone: '', nextFollowUpAt: '', lostReason: '' });
  const [busy, setBusy] = useState(false);
  const [oriented, setOriented] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setNotes(lead.lead?.notes || []);
    setNote('');
    setForm({
      phone: lead.lead?.phone || lead.business?.phone || '',
      nextFollowUpAt: lead.lead?.nextFollowUpAt ? ymd(new Date(lead.lead.nextFollowUpAt)) : '',
      lostReason: lead.lead?.lostReason || '',
    });
    setOriented(Boolean(lead.lead?.orientationAt));
  }, [lead]);

  if (!lead) return null;
  const waPhone = (form.phone || '').replace(/\D/g, '');

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const d = await funnelApi.addNote(lead.userId, note.trim());
      setNotes(d.notes);
      setNote('');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar la nota.');
    } finally {
      setBusy(false);
    }
  }

  // Sesión de orientación por videollamada: al marcarla, el cliente deja de ver la invitación.
  async function toggleOrientation(done) {
    setOriented(done);
    try {
      await funnelApi.setOrientation(lead.userId, done);
      toast.success(done ? 'Orientación marcada como realizada.' : 'Orientación marcada como pendiente.');
      onSaved();
    } catch (err) {
      setOriented(!done);
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    }
  }

  async function save() {
    setBusy(true);
    try {
      await funnelApi.updateLead(lead.userId, {
        phone: form.phone,
        lostReason: form.lostReason,
        nextFollowUpAt: form.nextFollowUpAt ? new Date(`${form.nextFollowUpAt}T10:00:00`).toISOString() : null,
      });
      toast.success('Seguimiento guardado.');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={Boolean(lead)} onClose={onClose} title={lead.name} size="lg">
      <div className="space-y-5">
        <div className="text-sm text-muted">
          {lead.email}
          {lead.business ? ` · ${lead.business.name}` : ''}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${lead.email}`} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium text-fg hover:bg-surface2">
            <Icon name="mail" size={15} /> Correo
          </a>
          {waPhone.length >= 10 && (
            <a
              href={`https://wa.me/${waPhone.length === 10 ? `52${waPhone}` : waPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium text-fg hover:bg-surface2"
            >
              <Icon name="whatsapp" size={15} /> WhatsApp
            </a>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="618 123 4567" />
          <Input label="Próximo seguimiento" type="date" value={form.nextFollowUpAt} onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })} />
          <Input label="Motivo si se perdió" value={form.lostReason} onChange={(e) => setForm({ ...form, lostReason: e.target.value })} placeholder="Precio, no tiene número…" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-700"
              checked={oriented}
              onChange={(e) => toggleOrientation(e.target.checked)}
            />
            Sesión de orientación realizada
          </label>
          <Button size="sm" onClick={save} disabled={busy}>
            Guardar datos
          </Button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-fg">Notas</h3>
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
            {notes.length ? (
              [...notes].reverse().map((n) => (
                <div key={n._id || n.at} className="rounded-lg bg-surface2 p-3 text-sm">
                  <div className="whitespace-pre-wrap text-fg">{n.text}</div>
                  <div className="mt-1 text-xs text-subtle">
                    {n.byName || 'Equipo'} · {new Date(n.at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">Aún no hay notas. Registra cada llamada: qué se habló y qué sigue.</p>
            )}
          </div>
          <div className="mt-3 space-y-2">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. Le llamé, quiere conexión asistida el jueves 11 am." maxLength={1000} />
            <div className="flex justify-end">
              <Button size="sm" onClick={addNote} disabled={busy || !note.trim()}>
                Agregar nota
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── Resultados e inversión (admin) ────────────────────────────────────── */

function Resultados({ range }) {
  const [data, setData] = useState(null);
  const [spend, setSpend] = useState([]);
  const now = new Date();
  const [form, setForm] = useState({ month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, channel: 'meta', amountMXN: '' });

  const load = useCallback(async () => {
    try {
      const [s, sp] = await Promise.all([funnelApi.summary(rangeParams(range)), funnelApi.spend()]);
      setData(s.summary);
      setSpend(sp.spend);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudieron cargar los resultados.');
    }
  }, [range]);
  useEffect(() => {
    load();
  }, [load]);

  async function saveSpend(e) {
    e.preventDefault();
    const amount = Number(form.amountMXN);
    if (!Number.isFinite(amount) || amount < 0) return toast.error('Escribe un monto válido.');
    try {
      await funnelApi.saveSpend({ month: form.month, channel: form.channel, amountMXN: amount });
      toast.success('Inversión guardada.');
      setForm({ ...form, amountMXN: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    }
  }

  async function sendReport() {
    try {
      const r = await funnelApi.sendReport();
      toast.success(`Reporte enviado a ${r.sent} correo(s).`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar el reporte.');
    }
  }

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="text-brand-600" />
      </div>
    );
  }
  const t = data.totals;
  const kpis = [
    ['Registros', t.registrado],
    ['Conectaron un canal', `${t.conectado} · ${pct(t.conectado, t.registrado)}`],
    ['Pagaron', `${t.pago} · ${pct(t.pago, t.registrado)}`],
    ['Ingresos de estos registros', money(t.revenueMXN)],
    ['Inversión capturada', money(t.spendMXN)],
    ['Costo por cliente (combinado)', money(t.blendedCacMXN)],
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map(([label, v]) => (
          <Card key={label} className="p-4">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-1 text-xl font-bold tabular text-fg">{v}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              {['Canal', 'Registros', 'Negocio', 'Conectó', 'Pagó', 'Ingresos', 'Inversión', 'Costo/registro', 'Costo/cliente'].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-semibold ${i ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.channels.map((c) => (
              <tr key={c.channel} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-fg">{c.name}</td>
                {[c.registrado, c.negocio, c.conectado, c.pago, money(c.revenueMXN), money(c.spendMXN || null), money(c.costPerSignupMXN), money(c.cacMXN)].map((v, i) => (
                  <td key={i} className="px-4 py-3 text-right tabular text-fg">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
            {!data.channels.length && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  Sin registros en este periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted">
        El costo por cliente de Meta y Google usa la inversión de pauta de ese canal; el combinado incluye también la agencia. Un registro puede pagar semanas
        después: revisa periodos de 30 a 90 días para decidir.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-fg">Capturar inversión del mes</h2>
          <p className="mt-1 text-sm text-muted">Lo que pagaste a cada plataforma y a la agencia en ese mes, sin IVA.</p>
          <form onSubmit={saveSpend} className="mt-4 grid gap-3 sm:grid-cols-3">
            <Input label="Mes" type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            <Select label="Concepto" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              {Object.entries(SPEND_CHANNELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Input label="Monto (MXN)" inputMode="decimal" value={form.amountMXN} onChange={(e) => setForm({ ...form, amountMXN: e.target.value.replace(/[^\d.]/g, '') })} placeholder="7000" />
            <div className="sm:col-span-3 flex justify-end">
              <Button type="submit" size="sm">
                Guardar
              </Button>
            </div>
          </form>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-fg">Inversión capturada</h2>
            <Button size="sm" variant="secondary" onClick={sendReport}>
              <Icon name="mail" size={15} /> Enviar reporte ahora
            </Button>
          </div>
          <div className="mt-3 max-h-60 overflow-y-auto text-sm">
            {spend.length ? (
              spend.map((s) => (
                <div key={s._id} className="flex justify-between border-b border-line py-2 last:border-0">
                  <span className="text-fg">
                    {s.month} · {SPEND_CHANNELS[s.channel]}
                  </span>
                  <span className="tabular text-fg">{money(s.amountMXN)}</span>
                </div>
              ))
            ) : (
              <p className="text-muted">Aún no capturas inversión.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Calculadora de escenarios (admin) ─────────────────────────────────── */

const CALC_FIELDS = [
  ['pauta', 'Pauta al mes (MXN)', 7000],
  ['agencia', 'Agencia al mes, sin IVA (MXN)', 17000],
  ['cpl', 'Costo por registro (MXN)', 60],
  ['conv', 'Registros que pagan (%)', 6],
  ['ticket', 'Precio promedio al mes con IVA (MXN)', 550],
  ['meses', 'Meses que se queda un cliente', 8],
  ['costoServ', 'Costo de servicio por cliente al mes (IA, Stripe) (MXN)', 60],
  ['organicos', 'Clientes al mes por orgánico y referidos', 2],
  ['meta', 'Meta de clientes de pago', 100],
];

function Calculadora() {
  const [v, setV] = useState(() => Object.fromEntries(CALC_FIELDS.map(([k, , d]) => [k, d])));
  const n = (k) => Math.max(0, Number(v[k]) || 0);

  const r = useMemo(() => {
    const registros = n('cpl') ? n('pauta') / n('cpl') : 0;
    const nuevosPauta = registros * (n('conv') / 100);
    const nuevos = nuevosPauta + n('organicos');
    const netoMes = n('ticket') / 1.16 - n('costoServ'); // margen por cliente al mes (sin IVA)
    const ltv = netoMes * n('meses');
    const inversion = n('pauta') + n('agencia');
    const cac = nuevos ? inversion / nuevos : null;
    const cacPauta = nuevosPauta ? n('pauta') / nuevosPauta : null;
    const equilibrio = netoMes > 0 ? Math.ceil(inversion / netoMes) : null;
    // Simulación mes a mes con abandono 1/meses.
    let activos = 0;
    let mesMeta = null;
    const bajas = n('meses') ? 1 / n('meses') : 0;
    for (let m = 1; m <= 60; m++) {
      activos = activos * (1 - bajas) + nuevos;
      if (mesMeta == null && activos >= n('meta')) mesMeta = m;
    }
    const techo = bajas ? nuevos / bajas : null; // clientes a los que se estabiliza
    return { registros, nuevosPauta, nuevos, netoMes, ltv, cac, cacPauta, equilibrio, mesMeta, techo, inversion };
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps

  const sano = r.cac != null && r.ltv > 0 && r.cac <= r.ltv / 3;
  const out = [
    ['Registros al mes por pauta', Math.round(r.registros)],
    ['Clientes nuevos al mes', r.nuevos.toFixed(1)],
    ['Costo por cliente (pauta)', money(r.cacPauta)],
    ['Costo por cliente (pauta + agencia)', money(r.cac)],
    ['Ganancia por cliente en toda su vida', money(r.ltv)],
    ['Clientes para cubrir pauta + agencia', r.equilibrio ?? '—'],
    ['Mes en que llegas a la meta', r.mesMeta ? `mes ${r.mesMeta}` : 'no se alcanza con este ritmo'],
    ['Clientes a los que te estabilizas', r.techo != null ? Math.round(r.techo) : '—'],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <Card className="grid gap-3 sm:grid-cols-2">
        {CALC_FIELDS.map(([k, label]) => (
          <Input key={k} label={label} inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, '') })} />
        ))}
      </Card>
      <div className="space-y-4">
        <Card className="grid grid-cols-2 gap-4">
          {out.map(([label, val]) => (
            <div key={label}>
              <div className="text-xs text-muted">{label}</div>
              <div className="mt-1 text-lg font-bold tabular text-fg">{val}</div>
            </div>
          ))}
        </Card>
        <Card className={sano ? 'border-brand-500/40' : 'border-amber-500/40'}>
          <div className="flex items-start gap-3">
            <Icon name={sano ? 'check' : 'alert'} size={20} className={sano ? 'text-brand-600' : 'text-amber-600'} />
            <p className="text-sm text-fg">
              {sano
                ? 'Escenario sano: cada cliente deja al menos 3 veces lo que costó conseguirlo.'
                : 'Escenario en riesgo: conseguir un cliente cuesta más de un tercio de lo que deja en toda su vida. Sube la conversión (conexión asistida), el precio promedio o la permanencia antes de subir la pauta.'}
            </p>
          </div>
          <p className="mt-3 text-xs text-muted">
            Estimación con los supuestos de la izquierda; reemplázalos con los datos reales de "Resultados" en cuanto tengas 4 a 6 semanas de campaña. No
            incluye sueldos del equipo ni costos fijos del servidor.
          </p>
        </Card>
      </div>
    </div>
  );
}
