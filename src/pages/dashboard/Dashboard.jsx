import { useEffect, useState } from 'react';
import { PlanCta } from '../../components/ui/PlanCta.jsx';
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
import { useAccess } from '../../router/RequirePermission.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { Card, Badge, Spinner, Button } from '../../components/ui/index.jsx';
import { SpotlightCard } from '../../components/ui/SpotlightCard.jsx';
import { OnboardingChecklist } from '../../components/dashboard/OnboardingChecklist.jsx';
import { ImpactCard } from '../../components/dashboard/ImpactCard.jsx';
import { ReferralCard } from '../../components/dashboard/ReferralCard.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { fmtConversations } from '../../lib/usage.js';


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
  const { business, subscription, balance, setBalance, role } = useBusinessStore();
  const user = useAuthStore((s) => s.user);
  const isOwner = role === 'owner';
  const canSimulate = useAccess('simulator', 'edit');
  const canTrain = useAccess('training', 'view');
  const canEditProfile = useAccess('profile', 'edit');
  // "Lo que generó tu bot" ($ estimados, leads) es información de negocio: analíticas.
  const canSeeImpact = useAccess('analytics', 'view');
  const firstName = String(user?.name || '').trim().split(/\s+/)[0];
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    if (canSeeImpact) usageApi.impact().then(setImpact).catch(() => {});
  }, [canSeeImpact]);

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
          <h1 className="text-2xl font-bold text-fg">Hola{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-sm text-muted">
            Resumen del bot de <span className="font-medium text-fg">{business?.name}</span> este mes
            {!isOwner && ' · colaboras en este proyecto'}
          </p>
        </div>
        {canSimulate && (
          <Link to="/dashboard/simulador">
            <Button>
              <Icon name="message" size={18} />
              Probar simulador
            </Button>
          </Link>
        )}
      </div>

      {/* Primeros pasos (solo cuentas nuevas / incompletas) */}
      <OnboardingChecklist />

      {/* Regalo único: invita a 3 negocios y gana 1 mes de Pro. Es PERSONAL y se
          aplica al negocio propio: solo se muestra entrando como dueño (en un
          proyecto donde colaboras no aplica). */}
      {isOwner && <ReferralCard />}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Plan activo"
          icon="card"
          value={subscription?.plan?.name || '—'}
          sub={`Renueva: ${subscription ? new Date(subscription.renewalDate).toLocaleDateString('es-MX') : '—'}`}
        />
        <StatCard
          label="Conversaciones disponibles"
          icon="message"
          value={balance ? `${fmtConversations(balance.available)}` : '—'}
          sub={balance ? `aprox. · ${balance.available.toLocaleString('es-MX')} tokens de IA` : ''}
          color="text-brand-600"
        />
        <StatCard
          label="Uso de tu plan este mes"
          icon="chart"
          value={balance ? `${usedPct}%` : '—'}
          sub="de tu plan mensual"
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

      {/* Lo que generó tu bot: datos reales + estimación en pesos (retención) */}
      {canSeeImpact && (
      <ImpactCard
        impact={impact}
        onChange={setImpact}
        canEdit={canEditProfile}
        canToggleReport={isOwner}
      />
      )}

      {/* Barra de consumo (en conversaciones, tono tranquilo) */}
      <Card>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-fg">Uso de tu plan este mes</span>
          <span className="text-muted">{balance ? `${usedPct}%` : ''}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className={`h-full rounded-full transition-all ${usedPct > 90 ? 'bg-amber-500' : 'bg-brand-500'}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        {usedPct > 90 ? (
          <p className="mt-2 text-xs text-amber-600">
            Vas muy bien, ya casi usas todo tu plan del mes. Si quieres que el bot no pare, puedes{' '}
            <PlanCta className="font-medium underline" memberText="pídeselo al dueño del negocio">
              sumar más conversaciones
            </PlanCta>
            .
          </p>
        ) : (
          <p className="mt-2 text-xs text-subtle">
            {balance
              ? `Te alcanza para ${fmtConversations(balance.available)} conversaciones más este mes. No tienes que contar nada.`
              : 'Tu plan se renueva cada mes y aquí ves cuánto llevas.'}
          </p>
        )}
      </Card>

      {/* Gráfica */}
      <Card>
        <h2 className="mb-4 font-semibold text-fg">Actividad de tu bot (últimos 14 días)</h2>
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
      {(canTrain || canSimulate) && (
      <div className={`grid gap-4 ${canTrain && canSimulate ? 'sm:grid-cols-2' : ''}`}>
        {canTrain && (
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
        )}
        {canSimulate && (
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
        )}
      </div>
      )}
    </div>
  );
}
