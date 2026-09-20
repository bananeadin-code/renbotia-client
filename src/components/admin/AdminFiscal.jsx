import { useEffect, useState } from 'react';
import { adminApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Alert, Spinner, Button } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

/**
 * Control fiscal (RESICO PF) para el operador. Muestra los ingresos REALES del
 * sitio (pagos completados) y una ESTIMACIÓN de impuestos + vencimientos, para
 * llevar control. No es un cálculo oficial: el contador/SAT es la fuente de verdad.
 */
const mxn = (n) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });

export function AdminFiscal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const { downloadFiscalReportPdf } = await import('../../lib/pdf.js');
      await downloadFiscalReportPdf(data);
    } catch {
      toast.error('No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setPdfLoading(false);
    }
  }

  useEffect(() => {
    adminApi
      .fiscal()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="flex justify-center py-8">
        <Spinner className="text-brand-600" />
      </Card>
    );
  }
  if (!data) return null;

  const { current, year, allTime, months, obligations, regime, beta } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-fg">Control fiscal · {regime.name}</h2>
          <p className="text-sm text-muted">
            Ingresos reales del sitio (pagos completados) y una estimación de impuestos según tu
            régimen (clave {regime.code}). Es un apoyo de control, no un cálculo oficial.
          </p>
        </div>
        <Button variant="secondary" size="sm" className="shrink-0" disabled={pdfLoading} onClick={downloadPdf}>
          <Icon name="download" size={16} />
          {pdfLoading ? 'Generando…' : 'Descargar PDF'}
        </Button>
      </div>

      {beta && (
        <Alert variant="info">
          El sitio está en beta y los cobros están cerrados, por eso los ingresos van en cero. Aun
          así, debes presentar tus declaraciones mensuales <strong>en ceros</strong> para no generar
          requerimientos.
        </Alert>
      )}

      {/* Totales */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-muted">Ingresos de {current.label}</div>
          <div className="mt-1 text-2xl font-bold tabular text-brand-600">{mxn(current.income)}</div>
          <div className="mt-0.5 text-xs text-subtle">{current.payments} pago(s) este mes</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Ingresos del año {year.year}</div>
          <div className="mt-1 text-2xl font-bold tabular text-fg">{mxn(year.income)}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Ingresos históricos</div>
          <div className="mt-1 text-2xl font-bold tabular text-fg">{mxn(allTime.income)}</div>
          <div className="mt-0.5 text-xs text-subtle">{allTime.payments} pago(s) en total</div>
        </Card>
      </div>

      {/* Mes actual: estimación + vencimiento */}
      <Card className="border-brand-200 dark:border-brand-900/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-fg">Declaración de {current.label}</div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Icon name="clock" size={14} className="shrink-0 text-brand-600" />
              Vence el <strong className="text-fg">{current.dueLabel}</strong>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-right">
            <div>
              <div className="text-xs text-subtle">ISR estimado ({current.isrRatePct}%)</div>
              <div className="text-lg font-bold tabular text-fg">{mxn(current.isr)}</div>
            </div>
            <div>
              <div className="text-xs text-subtle">IVA estimado (16%)</div>
              <div className="text-lg font-bold tabular text-fg">{mxn(current.iva)}</div>
            </div>
          </div>
        </div>
        <p className="mt-3 border-t border-line pt-3 text-xs text-subtle">
          Estimación aproximada: el ISR usa la tasa de RESICO por tu ingreso del mes; el IVA asume
          que tus precios ya lo incluyen. No resta IVA acreditable ni deducciones. Tu contador ajusta
          el número final.
        </p>
      </Card>

      {/* Obligaciones */}
      <Card>
        <div className="text-sm font-semibold text-fg">Tus obligaciones</div>
        <div className="mt-3 space-y-2">
          {obligations.map((o) => (
            <div
              key={o.clave}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface2/40 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-fg">
                  {o.name} <span className="text-subtle">· {o.clave}</span>
                </div>
                <div className="text-xs text-muted">{o.when}</div>
              </div>
              <span className="shrink-0 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                {o.freq}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Historial mensual */}
      <Card>
        <div className="mb-3 text-sm font-semibold text-fg">Historial mensual (estimado)</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead className="text-xs uppercase text-subtle">
              <tr>
                <th className="py-2">Mes</th>
                <th className="py-2 text-right">Ingresos</th>
                <th className="py-2 text-right">ISR est.</th>
                <th className="py-2 text-right">IVA est.</th>
                <th className="py-2 text-right">Pagos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {months.map((m) => (
                <tr key={m.ym}>
                  <td className="py-2.5 font-medium text-fg">{m.label}</td>
                  <td className="py-2.5 text-right tabular text-fg">{mxn(m.income)}</td>
                  <td className="py-2.5 text-right tabular text-muted">{mxn(m.isr)}</td>
                  <td className="py-2.5 text-right tabular text-muted">{mxn(m.iva)}</td>
                  <td className="py-2.5 text-right tabular text-subtle">{m.payments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="flex items-start gap-1.5 text-xs text-subtle">
        <Icon name="shield" size={13} className="mt-0.5 shrink-0" />
        <span>
          Las cifras de impuestos son una estimación para tu control. La declaración se presenta en
          línea en el portal del SAT; te recomendamos apoyarte en un contador para el cálculo y envío.
        </span>
      </p>
    </div>
  );
}
