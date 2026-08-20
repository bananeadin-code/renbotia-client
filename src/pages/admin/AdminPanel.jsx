import { useEffect, useState } from 'react';
import { adminApi } from '../../api/endpoints.js';
import { Card, Badge, Spinner, Alert } from '../../components/ui/index.jsx';

export default function AdminPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .businesses()
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-600" />
      </div>
    );
  }
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Panel de administración</h1>
        <p className="text-sm text-muted">
          Negocios y costo real estimado de la API (precio estándar; el real hoy suele ser menor
          por el precio intro y la caché). El costo excluye el consumo de datos demo y debe cuadrar
          con tu consola de Anthropic.
        </p>
      </div>

      {/* Totales */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-muted">Negocios registrados</div>
          <div className="mt-1 text-2xl font-bold tabular text-fg">{data.totals.businesses}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Tokens reales (histórico)</div>
          <div className="mt-1 text-2xl font-bold tabular text-brand-600">
            {data.totals.realTokensAllTime.toLocaleString('es-MX')}
          </div>
          {data.totals.demoTokensAllTime > 0 && (
            <div className="mt-0.5 text-xs text-subtle">
              + {data.totals.demoTokensAllTime.toLocaleString('es-MX')} de datos demo (sin costo)
            </div>
          )}
        </Card>
        <Card>
          <div className="text-sm text-muted">Costo real estimado (histórico)</div>
          <div className="mt-1 text-2xl font-bold tabular text-fg">
            ${data.totals.costUsdAllTime.toFixed(2)}{' '}
            <span className="text-base font-medium text-muted">USD</span>
          </div>
          <div className="mt-0.5 text-xs text-subtle">
            ≈ ${data.totals.costMxnAllTime.toLocaleString('es-MX', { maximumFractionDigits: 2 })} MXN
          </div>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-subtle">
              <tr>
                <th className="py-2">Negocio</th>
                <th className="py-2">Dueño</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Estado</th>
                <th className="py-2 text-right">Tokens periodo</th>
                <th className="py-2 text-right">Tokens reales</th>
                <th className="py-2 text-right">Costo real (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.businesses.map((b) => (
                <tr key={b.id}>
                  <td className="py-3">
                    <div className="font-medium text-fg">{b.name}</div>
                    <div className="text-xs text-subtle">{b.industry}</div>
                  </td>
                  <td className="py-3 text-muted">
                    <div>{b.owner?.name}</div>
                    <div className="text-xs text-subtle">{b.owner?.email}</div>
                  </td>
                  <td className="py-3">
                    <Badge color="green">{b.plan || '—'}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge color={b.status === 'activo' ? 'green' : 'amber'}>{b.status}</Badge>
                  </td>
                  <td className="py-3 text-right tabular text-muted">
                    {b.tokensUsedThisPeriod.toLocaleString('es-MX')}
                  </td>
                  <td className="py-3 text-right tabular font-medium text-fg">
                    {b.realTokens.toLocaleString('es-MX')}
                    {b.demoTokens > 0 && (
                      <div className="text-xs font-normal text-subtle">
                        +{b.demoTokens.toLocaleString('es-MX')} demo
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-right tabular">
                    <div className="font-medium text-fg">${b.costUsd.toFixed(2)}</div>
                    <div className="text-xs text-subtle">
                      ${b.costMxn.toLocaleString('es-MX', { maximumFractionDigits: 1 })} MXN
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
