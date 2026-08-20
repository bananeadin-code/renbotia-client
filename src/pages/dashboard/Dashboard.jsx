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
} from 'recharts';
import { usageApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { Card, Badge, Spinner, Button } from '../../components/ui/index.jsx';
import { SpotlightCard } from '../../components/ui/SpotlightCard.jsx';
import { OnboardingChecklist } from '../../components/dashboard/OnboardingChecklist.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

function StatCard({ label, value, sub, color, icon }) {
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

export default function Dashboard() {
  const { business, subscription, balance, setBalance } = useBusinessStore();
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usageApi
      .summary(14)
      .then((data) => {
        setDaily(
          data.daily.map((d) => ({
            date: d.date.slice(5), // MM-DD
            tokens: d.totalTokens,
          }))
        );
        if (data.balance) setBalance(data.balance);
      })
      .finally(() => setLoading(false));
  }, [setBalance]);

  const usedPct = balance?.planLimit
    ? Math.min(100, Math.round((balance.planUsed / balance.planLimit) * 100))
    : 0;

  const botReady = business?.status === 'activo';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-fg">Hola, {business?.name}</h1>
          <p className="text-sm text-muted">Resumen de tu bot este mes</p>
        </div>
        <Link to="/dashboard/simulador">
          <Button>
            <Icon name="message" size={18} />
            Probar simulador
          </Button>
        </Link>
      </div>

      {/* Primeros pasos (solo cuentas nuevas / incompletas) */}
      <OnboardingChecklist />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Plan activo"
          icon="card"
          value={subscription?.plan?.name || '—'}
          sub={`Renueva: ${subscription ? new Date(subscription.renewalDate).toLocaleDateString('es-MX') : '—'}`}
        />
        <StatCard
          label="Tokens totales disponibles"
          icon="bot"
          value={balance ? balance.available.toLocaleString('es-MX') : '—'}
          sub={balance ? `de ${(balance.planLimit + balance.extraTokens).toLocaleString('es-MX')}` : ''}
          color="text-brand-600"
        />
        <StatCard
          label="Consumidos (plan)"
          icon="chart"
          value={balance ? `${usedPct}%` : '—'}
          sub={balance ? `${balance.planUsed.toLocaleString('es-MX')} tokens de ${balance.planLimit.toLocaleString('es-MX')}` : ''}
        />
        <Card>
          <div className="flex items-start justify-between">
            <div className="text-sm text-muted">Estado del bot</div>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface2 text-subtle">
              <Icon name="bot" size={16} />
            </span>
          </div>
          <div className="mt-2">
            {botReady ? <Badge color="green">Activo</Badge> : <Badge color="amber">En configuración</Badge>}
          </div>
          {balance?.extraTokens > 0 && (
            <div className="mt-2 text-xs text-subtle">
              +{balance.extraTokens.toLocaleString('es-MX')} créditos extra
            </div>
          )}
        </Card>
      </div>

      {/* Barra de consumo */}
      <Card>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-fg">Uso del plan este periodo</span>
          <span className="text-muted">
            {balance ? `${balance.planUsed.toLocaleString('es-MX')} / ${balance.planLimit.toLocaleString('es-MX')}` : ''}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className={`h-full rounded-full transition-all ${usedPct > 90 ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        {usedPct > 90 && (
          <p className="mt-2 text-xs text-red-600">
            Estás por agotar tu plan.{' '}
            <Link to="/dashboard/facturacion" className="font-medium underline">
              Compra créditos
            </Link>
          </p>
        )}
      </Card>

      {/* Gráfica */}
      <Card>
        <h2 className="mb-4 font-semibold text-fg">Consumo de tokens (últimos 14 días)</h2>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-brand-600" />
          </div>
        ) : daily.length === 0 ? (
          <p className="py-12 text-center text-sm text-subtle">
            Aún no hay consumo. Prueba el simulador para generar actividad.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(148 163 184 / 0.18)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} width={40} />
                <Tooltip
                  cursor={{ fill: 'rgb(148 163 184 / 0.14)', radius: 6 }}
                  formatter={(v) => [`${v.toLocaleString('es-MX')} tokens`, 'Consumo']}
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                    background: 'rgb(var(--surface))',
                    border: '1px solid rgb(var(--line))',
                    color: 'rgb(var(--fg))',
                  }}
                  labelStyle={{ color: 'rgb(var(--muted))' }}
                />
                <Bar dataKey="tokens" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Accesos rápidos */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/dashboard/entrenamiento">
          <SpotlightCard className="group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 [&>*]:relative [&>*]:z-[2]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <Icon name="academic" size={22} />
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-fg">Entrenar el bot</h3>
              <p className="text-sm text-muted">Edita FAQs, tono e información del negocio.</p>
            </div>
            <Icon name="chevronRight" size={18} className="text-subtle transition group-hover:text-brand-600" />
          </SpotlightCard>
        </Link>
        <Link to="/dashboard/simulador">
          <SpotlightCard className="group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 [&>*]:relative [&>*]:z-[2]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <Icon name="message" size={22} />
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-fg">Simulador de WhatsApp</h3>
              <p className="text-sm text-muted">Prueba cómo responde tu bot en un chat real.</p>
            </div>
            <Icon name="chevronRight" size={18} className="text-subtle transition group-hover:text-brand-600" />
          </SpotlightCard>
        </Link>
      </div>
    </div>
  );
}
