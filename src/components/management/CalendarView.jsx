import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { managementApi } from '../../api/endpoints.js';
import { TYPE_META, STATUS_META, formatTime, isPast } from '../../lib/managementMeta.js';

const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const localKey = (iso) => {
  const d = new Date(iso);
  return keyOf(d.getFullYear(), d.getMonth(), d.getDate());
};

const STATUS_DOT = {
  pendiente: 'bg-amber-500',
  confirmado: 'bg-brand-500',
  completado: 'bg-slate-400',
  cancelado: 'bg-red-500',
};

/**
 * Vista de calendario mensual de la agenda: muestra los registros agendados en
 * su día y, al elegir un día, su detalle + los horarios libres de ese día.
 */
export function CalendarView({ config, version, onNew, onEdit }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(keyOf(today.getFullYear(), today.getMonth(), today.getDate()));
  const [daySlots, setDaySlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Carga todos los registros agendados (los del calendario). 500 máx basta MVP.
  useEffect(() => {
    setLoading(true);
    managementApi
      .records({})
      .then(({ records: r }) => setRecords(r.filter((x) => x.scheduledAt)))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [version]);

  // Índice por día para pintar rápido.
  const byDay = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const k = localKey(r.scheduledAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    }
    return map;
  }, [records]);

  const blackout = new Set(config?.blackoutDates || []);
  const openDays = new Set((config?.schedule || []).filter((d) => d.enabled).map((d) => d.day));

  // Matriz de semanas (empezando lunes) para el mes en curso.
  const weeks = useMemo(() => buildMonthMatrix(cursor.y, cursor.m), [cursor]);

  function shift(delta) {
    setCursor((c) => {
      const m = c.m + delta;
      const y = c.y + Math.floor(m / 12);
      return { y, m: ((m % 12) + 12) % 12 };
    });
  }
  function goToday() {
    setCursor({ y: today.getFullYear(), m: today.getMonth() });
    setSelected(keyOf(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  // Carga los horarios libres del día seleccionado.
  useEffect(() => {
    if (!selected) return;
    setLoadingSlots(true);
    managementApi
      .availability({ date: selected })
      .then(({ slots }) => setDaySlots(slots))
      .catch(() => setDaySlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selected, version]);

  const selectedRecords = byDay.get(selected) || [];
  const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="space-y-4">
      {/* Encabezado del mes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="rounded-lg p-2 text-muted hover:bg-surface2" aria-label="Mes anterior">
            <Icon name="chevronRight" size={18} className="rotate-180" />
          </button>
          <h2 className="min-w-[10rem] text-center text-lg font-bold capitalize text-fg">
            {MONTHS[cursor.m]} {cursor.y}
          </h2>
          <button onClick={() => shift(1)} className="rounded-lg p-2 text-muted hover:bg-surface2" aria-label="Mes siguiente">
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
        <Button variant="secondary" size="sm" onClick={goToday}>
          <Icon name="calendar" size={15} /> Hoy
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="text-brand-600" size={26} />
        </div>
      ) : (
        <Card className="!p-2 sm:!p-3">
          {/* Cabecera de días */}
          <div className="grid grid-cols-7 gap-1 border-b border-line pb-1">
            {WEEK.map((d) => (
              <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase text-subtle">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {weeks.flat().map((cell, i) => {
              if (!cell) return <div key={i} className="min-h-[64px] rounded-lg sm:min-h-[92px]" />;
              const k = keyOf(cursor.y, cursor.m, cell);
              const list = byDay.get(k) || [];
              const isToday = k === todayKey;
              const isSelected = k === selected;
              const dow = new Date(cursor.y, cursor.m, cell).getDay();
              const isClosed = blackout.has(k) || !openDays.has(dow);
              const past = new Date(cursor.y, cursor.m, cell) < new Date(todayKey);

              return (
                <button
                  key={i}
                  onClick={() => setSelected(k)}
                  className={`min-h-[64px] rounded-lg border p-1 text-left align-top transition sm:min-h-[92px] ${
                    isSelected
                      ? 'border-brand-500 ring-1 ring-brand-500'
                      : 'border-line hover:border-brand-500/40'
                  } ${isClosed ? 'bg-surface2/50' : 'bg-surface'}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                        isToday ? 'bg-brand-600 text-white' : past ? 'text-subtle' : 'text-fg'
                      }`}
                    >
                      {cell}
                    </span>
                    {list.length > 0 && (
                      <span className="text-[10px] font-semibold text-muted">{list.length}</span>
                    )}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {list.slice(0, 2).map((r) => (
                      <div
                        key={r.id}
                        className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] ${
                          r.status === 'cancelado' ? 'line-through opacity-60' : ''
                        } bg-surface2`}
                        title={`${formatTime(r.scheduledAt)} · ${r.summary || TYPE_META[r.type]?.label}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[r.status] || 'bg-slate-400'}`} />
                        <span className="truncate text-fg">{formatTime(r.scheduledAt)}</span>
                        <span className="hidden truncate text-muted sm:inline">
                          {r.summary || TYPE_META[r.type]?.label}
                        </span>
                      </div>
                    ))}
                    {list.length > 2 && (
                      <div className="px-1 text-[10px] font-medium text-brand-600">+{list.length - 2} más</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Detalle del día seleccionado */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold capitalize text-fg">{formatSelected(selected)}</h3>
          <Button size="sm" onClick={() => onNew(selected)}>
            <Icon name="plus" size={15} /> Agendar
          </Button>
        </div>

        {/* Registros del día */}
        <div className="mt-3 space-y-2">
          {selectedRecords.length === 0 ? (
            <p className="text-sm text-subtle">Sin registros este día.</p>
          ) : (
            selectedRecords.map((r) => {
              const meta = TYPE_META[r.type] || TYPE_META.cita;
              const st = STATUS_META[r.status] || STATUS_META.pendiente;
              return (
                <button
                  key={r.id}
                  onClick={() => onEdit(r)}
                  className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface2/40 p-2.5 text-left hover:border-brand-500/40"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                    <Icon name={meta.icon} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-fg">{formatTime(r.scheduledAt)}</span>
                      <span className={`truncate text-sm ${isPast(r.scheduledAt) ? 'text-subtle' : 'text-muted'}`}>
                        {r.summary || meta.label}
                      </span>
                    </div>
                    {r.customer?.name && <div className="truncate text-xs text-subtle">{r.customer.name}</div>}
                  </div>
                  <Badge color={st.color}>{st.label}</Badge>
                </button>
              );
            })
          )}
        </div>

        {/* Horarios libres del día */}
        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-subtle">
            <Icon name="clock" size={14} /> Horarios libres
          </div>
          {loadingSlots ? (
            <Spinner size={16} className="text-brand-600" />
          ) : daySlots && daySlots.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {daySlots.map((s) => (
                <button
                  key={s.iso}
                  onClick={() => onNew(selected, s.time)}
                  className="rounded-lg border border-line px-2 py-1 text-xs font-medium text-muted transition hover:border-brand-500 hover:bg-brand-500/10 hover:text-brand-700 dark:hover:text-brand-300"
                  title="Agendar en este horario"
                >
                  {s.time}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-subtle">Sin espacios libres (día cerrado, bloqueado o lleno).</p>
          )}
        </div>
      </Card>
    </div>
  );
}

/** Matriz de semanas del mes, empezando en lunes; null en celdas vacías. */
function buildMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay: 0=domingo … convertir a lunes=0.
  const startOffset = (first.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function formatSelected(key) {
  if (!key) return '';
  const [y, m, d] = key.split('-').map((x) => parseInt(x, 10));
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}
