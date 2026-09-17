import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { usageApi } from '../../api/endpoints.js';
import { Card, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

const fmt = (n) => (n == null ? '—' : n.toLocaleString('es-MX'));

// Tiempo de respuesta legible (minutos → "45 s" / "3 min" / "1 h 5 min").
function fmtMins(m) {
  if (m == null) return '—';
  if (m < 1) return `${Math.round(m * 60)} s`;
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r ? `${h} h ${r} min` : `${h} h`;
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted">{label}</div>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-subtle">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular ${color || 'text-fg'}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-subtle">{sub}</div>}
    </Card>
  );
}

// Barra horizontal simple para desgloses (trabajo por tipo, canales).
function BreakdownBar({ label, count, total, color = 'bg-brand-500' }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-fg">{label}</span>
        <span className="tabular text-muted">
          {fmt(count)} <span className="text-subtle">· {pct}%</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usageApi
      .analytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-600" />
      </div>
    );
  }

  const t = data?.totals || {};
  const monthly = data?.monthly || [];
  const recordsByType = data?.recordsByType || [];
  const channels = data?.channels || [];
  const topTags = data?.topTags || [];

  const totalRecords = recordsByType.reduce((a, r) => a + r.count, 0);
  const totalChannels = channels.reduce((a, c) => a + c.count, 0);
  const hasActivity = monthly.some((m) => m.conversations > 0 || m.records > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Analíticas</h1>
        <p className="text-sm capitalize text-muted">{data?.month || 'Actividad de tu bot'}</p>
      </div>

      {!hasActivity ? (
        <Card className="py-14 text-center">
          <Icon name="chart" size={30} className="mx-auto mb-2 text-subtle" />
          <p className="text-sm text-muted">
            Aún no hay actividad suficiente para mostrar analíticas. Cuando tu bot empiece a
            conversar y captar trabajo, verás aquí tus tendencias.{' '}
            <Link to="/dashboard/simulador" className="font-medium text-brand-600 hover:underline">
              Prueba el simulador
            </Link>
            .
          </p>
        </Card>
      ) : (
        <>
          {/* Indicadores del mes */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Conversaciones (mes)"
              icon="inbox"
              value={fmt(t.conversationsThisMonth)}
            />
            <StatCard
              label="Trabajo captado (mes)"
              icon="clipboard"
              value={fmt(t.recordsThisMonth)}
              sub="Citas, pedidos, prospectos…"
              color="text-brand-600"
            />
            <StatCard
              label="Respuestas del bot (mes)"
              icon="bot"
              value={fmt(t.botReplies)}
              sub={t.agentReplies ? `${fmt(t.agentReplies)} respondidas por una persona` : 'Automáticas'}
            />
            <StatCard
              label="1ª respuesta (aprox.)"
              icon="clock"
              value={fmtMins(t.avgResponseMins)}
              sub="Tiempo promedio del bot"
            />
          </div>

          {/* Leads calientes abiertos (oportunidad) */}
          {t.hotLeadsOpen > 0 && (
            <Card className="flex items-center gap-4 border-rose-400/40 bg-rose-500/[0.05]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600">
                <Icon name="flame" size={22} />
              </span>
              <div className="flex-1">
                <div className="tabular text-xl font-bold text-fg">
                  {fmt(t.hotLeadsOpen)} {t.hotLeadsOpen === 1 ? 'lead caliente' : 'leads calientes'} sin atender
                </div>
                <p className="text-sm text-muted">
                  El bot detectó clientes con alta intención de compra. Dales seguimiento pronto.
                </p>
              </div>
              <Link
                to="/dashboard/conversaciones"
                className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Ver
              </Link>
            </Card>
          )}

          {/* Tendencia mensual */}
          <Card>
            <h2 className="mb-4 font-semibold text-fg">Tendencia (últimos 6 meses)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(148 163 184 / 0.18)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} width={32} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgb(148 163 184 / 0.14)', radius: 6 }}
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 12,
                      background: 'rgb(var(--surface))',
                      border: '1px solid rgb(var(--line))',
                      color: 'rgb(var(--fg))',
                    }}
                    labelStyle={{ color: 'rgb(var(--muted))' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar name="Conversaciones" dataKey="conversations" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar name="Trabajo captado" dataKey="records" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Trabajo captado por tipo */}
            <Card>
              <h2 className="mb-4 font-semibold text-fg">Trabajo captado por tipo</h2>
              <p className="mb-3 -mt-2 text-xs text-subtle">Últimos 90 días</p>
              {recordsByType.length === 0 ? (
                <p className="py-6 text-center text-sm text-subtle">
                  Aún no se ha captado trabajo. El bot registra citas, pedidos y prospectos cuando el
                  módulo de Gestión está activo (plan Elite).
                </p>
              ) : (
                <div className="space-y-3">
                  {recordsByType
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((r) => (
                      <BreakdownBar key={r.type} label={r.label} count={r.count} total={totalRecords} />
                    ))}
                </div>
              )}
            </Card>

            {/* Canales */}
            <Card>
              <h2 className="mb-4 font-semibold text-fg">Conversaciones por canal</h2>
              {channels.length === 0 ? (
                <p className="py-6 text-center text-sm text-subtle">Sin datos de canal todavía.</p>
              ) : (
                <div className="space-y-3">
                  {channels
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((c) => (
                      <BreakdownBar
                        key={c.channel}
                        label={c.label}
                        count={c.count}
                        total={totalChannels}
                        color={c.channel === 'whatsapp' ? 'bg-emerald-500' : 'bg-brand-500'}
                      />
                    ))}
                </div>
              )}
              {topTags.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <div className="mb-2 text-sm font-medium text-fg">Etiquetas más usadas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {topTags.map((tg) => (
                      <span
                        key={tg.tag}
                        className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted"
                      >
                        #{tg.tag}
                        <span className="tabular text-subtle">{tg.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <p className="text-xs text-subtle">
            Datos de la actividad de tu propio bot. El tiempo de primera respuesta es una estimación
            a partir de tus conversaciones recientes.
          </p>
        </>
      )}
    </div>
  );
}
