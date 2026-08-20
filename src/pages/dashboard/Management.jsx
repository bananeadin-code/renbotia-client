import { useEffect, useState, useCallback } from 'react';
import { Button, Card, Badge, Spinner, Alert, Select } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { managementApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { toast } from '../../store/toastStore.js';
import { RecordModal } from '../../components/management/RecordModal.jsx';
import { AvailabilityConfig } from '../../components/management/AvailabilityConfig.jsx';
import { CalendarView } from '../../components/management/CalendarView.jsx';
import {
  TYPE_META,
  STATUS_META,
  STATUS_ORDER,
  formatDateTime,
  isPast,
} from '../../lib/managementMeta.js';

/**
 * Panel de Gestión (solo Elite). El cliente ve y gestiona el trabajo que el bot
 * capta: citas, reservaciones, pedidos y prospectos; define su disponibilidad.
 */
export default function Management() {
  const subscription = useBusinessStore((s) => s.subscription);
  const planKey = subscription?.plan?.key;

  const [tab, setTab] = useState('records');
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [scope, setScope] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preset, setPreset] = useState(null); // { date, time } al agendar desde el calendario
  const [version, setVersion] = useState(0); // fuerza recarga del calendario tras cambios

  const isElite = planKey === 'elite';

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ config: cfg }, { stats: st }, { records: recs }] = await Promise.all([
        managementApi.getConfig(),
        managementApi.stats(),
        managementApi.records({ type: filterType, status: filterStatus, scope: scope === 'all' ? '' : scope }),
      ]);
      setConfig(cfg);
      setStats(st);
      setRecords(recs);
      setVersion((v) => v + 1);
    } catch (err) {
      if (err.response?.status === 403) setError('PLAN');
      else setError(err.response?.data?.message || 'No se pudo cargar el módulo.');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, scope]);

  useEffect(() => {
    if (isElite) loadAll();
    else setLoading(false);
  }, [isElite, loadAll]);

  async function changeStatus(rec, status) {
    try {
      await managementApi.updateRecord(rec.id, { status });
      toast.success('Estado actualizado.');
      loadAll();
    } catch {
      toast.error('No se pudo actualizar el estado.');
    }
  }
  async function remove(rec) {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await managementApi.deleteRecord(rec.id);
      toast.success('Registro eliminado.');
      loadAll();
    } catch {
      toast.error('No se pudo eliminar.');
    }
  }
  function openNew() {
    setEditing(null);
    setPreset(null);
    setModalOpen(true);
  }
  // Alta desde el calendario, con día (y opcionalmente hora) preseleccionados.
  function openNewOn(date, time) {
    setEditing(null);
    setPreset({ date, time });
    setModalOpen(true);
  }
  function openEdit(rec) {
    setEditing(rec);
    setPreset(null);
    setModalOpen(true);
  }

  /* ── Upsell si no es Elite ── */
  if (!isElite) {
    return (
      <div>
        <PageHeader />
        <Card className="mt-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
            <Icon name="calendarCheck" size={28} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-fg">Disponible en el plan Elite</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Deja que el bot agende citas, tome reservaciones y capte pedidos y prospectos con criterio real de
            disponibilidad, y gestiónalo todo desde aquí.
          </p>
          <Button className="mt-4" onClick={() => (window.location.href = '/dashboard/facturacion')}>
            <Icon name="sparkles" size={16} /> Mejorar a Elite
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="text-brand-600" size={28} />
      </div>
    );
  }

  if (error && error !== 'PLAN') {
    return (
      <div>
        <PageHeader />
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      </div>
    );
  }

  const enabledTypes = config?.enabledTypes?.length ? config.enabledTypes : ['cita'];
  const moduleOff = !config?.enabled;

  return (
    <div>
      <PageHeader
        action={
          <Button onClick={openNew} className="shrink-0">
            <Icon name="plus" size={16} />
            <span className="hidden sm:inline">Nuevo registro</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        }
      />

      {/* Tabs */}
      <div className="mt-4 flex gap-1 rounded-xl border border-line bg-surface2/60 p-1">
        <TabButton active={tab === 'records'} onClick={() => setTab('records')} icon="clipboard">
          Registros
        </TabButton>
        <TabButton active={tab === 'calendar'} onClick={() => setTab('calendar')} icon="calendar">
          Calendario
        </TabButton>
        <TabButton active={tab === 'config'} onClick={() => setTab('config')} icon="sliders">
          {/* Etiqueta corta en móvil para que los 3 tabs quepan sin desbordar */}
          <span className="sm:hidden">Horarios</span>
          <span className="hidden sm:inline">Disponibilidad</span>
        </TabButton>
      </div>

      {moduleOff && tab === 'records' && (
        <div className="mt-4">
          <Alert variant="warning">
            El módulo está desactivado: el bot no captará trabajo hasta que lo actives en{' '}
            <button className="font-semibold underline" onClick={() => setTab('config')}>
              Disponibilidad
            </button>
            . Puedes seguir gestionando registros manualmente.
          </Alert>
        </div>
      )}

      {tab === 'config' && (
        <div className="mt-4">
          <AvailabilityConfig config={config} onSaved={loadAll} />
        </div>
      )}

      {tab === 'calendar' && (
        <div className="mt-4">
          <CalendarView config={config} version={version} onNew={openNewOn} onEdit={openEdit} />
        </div>
      )}

      {tab === 'records' && (
        <>
          {/* Métricas */}
          {stats && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon="calendar" label="Próximos" value={stats.upcoming} tone="brand" />
              <StatCard icon="clock" label="Pendientes" value={stats.status.pendiente} tone="amber" />
              <StatCard icon="bot" label="Captados por el bot" value={stats.byBot} tone="slate" />
              <StatCard icon="clipboard" label="Total" value={stats.total} tone="slate" />
            </div>
          )}

          {/* Filtros */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FilterChip active={filterType === ''} onClick={() => setFilterType('')}>
              Todos
            </FilterChip>
            {enabledTypes.map((t) => (
              <FilterChip key={t} active={filterType === t} onClick={() => setFilterType(t)} icon={TYPE_META[t].icon}>
                {TYPE_META[t].plural}
              </FilterChip>
            ))}
            {/* En móvil los selectores ocupan su propia fila (dos columnas); en
                desktop se alinean a la derecha con ancho automático. */}
            <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:items-center">
              <Select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full !py-1.5 text-xs"
              >
                <option value="all">Todo</option>
                <option value="upcoming">Próximos</option>
                <option value="past">Pasados</option>
              </Select>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full !py-1.5 text-xs"
              >
                <option value="">Cualquier estado</option>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Lista */}
          <div className="mt-4 space-y-2.5">
            {records.length === 0 ? (
              <Card className="py-10 text-center text-sm text-muted">
                <Icon name="inbox" size={28} className="mx-auto mb-2 text-subtle" />
                No hay registros con estos filtros.
              </Card>
            ) : (
              records.map((rec) => (
                <RecordRow
                  key={rec.id}
                  rec={rec}
                  onStatus={changeStatus}
                  onEdit={openEdit}
                  onDelete={remove}
                />
              ))
            )}
          </div>
        </>
      )}

      <RecordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          loadAll();
        }}
        enabledTypes={enabledTypes}
        record={editing}
        preset={preset}
      />
    </div>
  );
}

/* ── Subcomponentes ─────────────────────────────────────────────────────── */

function PageHeader({ action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-fg sm:text-2xl">
          <Icon name="calendarCheck" size={24} className="text-brand-600" /> Gestión de trabajo
        </h1>
        <p className="mt-1 text-sm text-muted">Trabajo captado por el bot y tu agenda de disponibilidad.</p>
      </div>
      {action}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-semibold transition sm:gap-2 sm:px-3 sm:text-sm ${
        active ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg'
      }`}
    >
      <Icon name={icon} size={16} className="shrink-0" /> {children}
    </button>
  );
}

const TONES = {
  brand: 'bg-brand-500/10 text-brand-600',
  amber: 'bg-amber-500/10 text-amber-600',
  slate: 'bg-surface2 text-muted',
};
function StatCard({ icon, label, value, tone }) {
  return (
    <Card className="!p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${TONES[tone]}`}>
        <Icon name={icon} size={18} />
      </div>
      <div className="text-2xl font-bold tabular-nums text-fg">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </Card>
  );
}

function FilterChip({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
          : 'border-line text-muted hover:bg-surface2'
      }`}
    >
      {icon && <Icon name={icon} size={14} />} {children}
    </button>
  );
}

function RecordRow({ rec, onStatus, onEdit, onDelete }) {
  const meta = TYPE_META[rec.type] || TYPE_META.cita;
  const status = STATUS_META[rec.status] || STATUS_META.pendiente;
  const past = isPast(rec.scheduledAt);

  // Acciones (mismo cluster reutilizado): en desktop van a la derecha; en móvil
  // se muestran en su propia fila abajo, con el selector de estado a lo ancho.
  const actions = (
    <>
      <select
        value={rec.status}
        onChange={(e) => onStatus(rec, e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-fg outline-none focus:border-brand-500 sm:flex-none sm:py-1"
        aria-label="Cambiar estado"
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
      <button
        onClick={() => onEdit(rec)}
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-fg"
        aria-label="Editar"
      >
        <Icon name="edit" size={16} />
      </button>
      <button
        onClick={() => onDelete(rec)}
        className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500"
        aria-label="Eliminar"
      >
        <Icon name="trash" size={16} />
      </button>
    </>
  );

  return (
    <Card className="!p-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
          <Icon name={meta.icon} size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-fg">{rec.summary || meta.label}</span>
            <Badge color={status.color}>{status.label}</Badge>
            {rec.source === 'bot' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2 py-0.5 text-[11px] font-medium text-muted">
                <Icon name="bot" size={12} /> bot
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
            {rec.customer?.name && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Icon name="user" size={13} className="shrink-0" />{' '}
                <span className="truncate">{rec.customer.name}</span>
              </span>
            )}
            {rec.customer?.contact && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Icon name="phone" size={13} className="shrink-0" />{' '}
                <span className="truncate">{rec.customer.contact}</span>
              </span>
            )}
            {rec.scheduledAt && (
              <span className={`inline-flex items-center gap-1 ${past ? 'text-subtle' : 'font-medium text-fg'}`}>
                <Icon name="calendar" size={13} className="shrink-0" /> {formatDateTime(rec.scheduledAt)}
                {past && ' · pasó'}
              </span>
            )}
            {rec.type === 'reservacion' && rec.quantity > 1 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="users" size={13} className="shrink-0" /> {rec.quantity} pers.
              </span>
            )}
          </div>
          {rec.notes && <p className="mt-1 line-clamp-2 text-xs text-subtle">{rec.notes}</p>}
        </div>

        {/* Acciones (desktop) */}
        <div className="hidden shrink-0 items-center gap-1 sm:flex">{actions}</div>
      </div>

      {/* Acciones (móvil): fila propia para no apretar el contenido */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 sm:hidden">
        {actions}
      </div>
    </Card>
  );
}
