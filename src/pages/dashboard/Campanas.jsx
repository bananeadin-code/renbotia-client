import { useCallback, useEffect, useState } from 'react';
import { funnelApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Button, Card, Input, Select, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

/**
 * Campañas pagadas (Meta y Google) para la agencia de marketing y el admin.
 * Solo cifras agregadas: registros, canales conectados, pagos, ingreso de esos
 * pagos e inversión. Nunca nombres, correos, teléfonos ni notas.
 */

const RANGES = [
  { key: '7', label: '7 días' },
  { key: '30', label: '30 días' },
  { key: '90', label: '90 días' },
  { key: 'mes', label: 'Este mes' },
];
const CHANNELS = { meta: 'Meta', google: 'Google' };

const ymd = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const money = (n) => (n == null ? '—' : `$${Math.round(n).toLocaleString('es-MX')}`);
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

function rangeParams(key) {
  const now = new Date();
  if (key === 'mes') return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
  return { from: ymd(new Date(now.getTime() - Number(key) * 864e5)), to: ymd(now) };
}

function Table({ head, rows, empty, minWidth = 720 }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-3 font-semibold ${i ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((cells, r) => (
              <tr key={r} className="border-b border-line last:border-0">
                {cells.map((v, i) => (
                  <td key={i} className={`px-4 py-3 tabular text-fg ${i ? 'text-right' : 'font-medium'}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={head.length} className="px-4 py-8 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

export default function Campanas() {
  const [range, setRange] = useState('30');
  const [report, setReport] = useState(null);
  const [spend, setSpend] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    channel: 'meta',
    amountMXN: '',
  });

  const load = useCallback(async () => {
    try {
      const [c, sp] = await Promise.all([funnelApi.campaigns(rangeParams(range)), funnelApi.campaignSpend()]);
      setReport(c.report);
      setSpend(sp.spend);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudieron cargar las campañas.');
    }
  }, [range]);
  useEffect(() => {
    setReport(null);
    load();
  }, [load]);

  async function saveSpend(e) {
    e.preventDefault();
    const amount = Number(form.amountMXN);
    if (!form.amountMXN || !Number.isFinite(amount) || amount < 0) return toast.error('Escribe un monto válido.');
    try {
      await funnelApi.saveCampaignSpend({ month: form.month, channel: form.channel, amountMXN: amount });
      toast.success('Inversión guardada.');
      setForm({ ...form, amountMXN: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    }
  }

  async function downloadCsv() {
    setDownloading(true);
    try {
      const params = rangeParams(range);
      const blob = await funnelApi.offlineConversions(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversiones-google-${params.from}-a-${params.to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo descargar el archivo.');
    } finally {
      setDownloading(false);
    }
  }

  const t = report?.totals;
  const kpis = t
    ? [
        ['Registros de pauta', t.registrado],
        ['Conectaron un canal', `${t.conectado} · ${pct(t.conectado, t.registrado)}`],
        ['Pagaron', `${t.pago} · ${pct(t.pago, t.registrado)}`],
        ['Pagaron anual', t.annual],
        ['Ingreso de estos clientes', money(t.revenueMXN)],
        ['Inversión en pauta', money(report.channels.reduce((a, c) => a + c.spendMXN, 0))],
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">Campañas</h1>
          <p className="mt-1 text-sm text-muted">
            Resultados de Meta y Google por campaña y anuncio, hasta el pago. Sin datos personales.
          </p>
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

      {!report ? (
        <div className="flex justify-center py-16">
          <Spinner className="text-brand-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {kpis.map(([label, v]) => (
              <Card key={label} className="p-4">
                <div className="text-xs text-muted">{label}</div>
                <div className="mt-1 text-xl font-bold tabular text-fg">{v}</div>
              </Card>
            ))}
          </div>

          <section className="space-y-2">
            <h2 className="font-semibold text-fg">Por canal</h2>
            <Table
              head={['Canal', 'Registros', 'Conectó', 'Pagó', 'Anual', 'Ingreso', 'Inversión', 'Costo/registro', 'Costo/conectado', 'Costo/cliente', 'Retorno']}
              rows={report.channels.map((c) => [
                c.name,
                c.registrado,
                c.conectado,
                c.pago,
                c.annual,
                money(c.revenueMXN),
                money(c.spendMXN || null),
                money(c.costPerSignupMXN),
                money(c.costPerConnectedMXN),
                money(c.cacMXN),
                c.roas == null ? '—' : `${c.roas}×`,
              ])}
              empty="Sin registros de pauta en este periodo."
              minWidth={960}
            />
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold text-fg">Por campaña y anuncio</h2>
            <Table
              head={['Campaña', 'Canal', 'Anuncio', 'Registros', 'Verificó', 'Negocio', 'Conectó', 'Pagó', 'Ingreso']}
              rows={report.campaigns.map((c) => [
                c.campaign,
                CHANNELS[c.channel] || c.channel,
                c.content || '—',
                c.registrado,
                c.verificado,
                c.negocio,
                c.conectado,
                c.pago,
                money(c.revenueMXN),
              ])}
              empty="Sin campañas en este periodo. Revisa que los anuncios lleven utm_campaign y utm_content."
              minWidth={860}
            />
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold text-fg">Semana a semana</h2>
            <Table
              head={['Semana (lunes)', 'Registros', 'Negocio', 'Conectó', 'Pagó', 'Ingreso']}
              rows={report.weeks.map((w) => [w.week, w.registrado, w.negocio, w.conectado, w.pago, money(w.revenueMXN)])}
              empty="Sin registros de pauta en este periodo."
              minWidth={560}
            />
          </section>

          <p className="text-xs text-muted">
            Las cifras salen de la fecha de registro: un registro puede conectar o pagar días después. Para decidir
            presupuesto, compara periodos de 30 a 90 días por costo por cliente, no por costo por clic.
          </p>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-fg">Inversión en pauta del mes</h2>
          <p className="mt-1 text-sm text-muted">Lo invertido en cada plataforma ese mes, sin IVA. Reemplaza el monto anterior.</p>
          <form onSubmit={saveSpend} className="mt-4 grid gap-3 sm:grid-cols-3">
            <Input label="Mes" type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            <Select label="Plataforma" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              {Object.entries(CHANNELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <Input
              label="Monto (MXN)"
              inputMode="decimal"
              value={form.amountMXN}
              onChange={(e) => setForm({ ...form, amountMXN: e.target.value.replace(/[^\d.]/g, '') })}
              placeholder="4500"
            />
            <div className="flex justify-end sm:col-span-3">
              <Button type="submit" size="sm">
                Guardar
              </Button>
            </div>
          </form>
          <div className="mt-4 max-h-48 overflow-y-auto text-sm">
            {spend.map((s) => (
              <div key={s._id} className="flex justify-between border-b border-line py-2 last:border-0">
                <span className="text-fg">
                  {s.month} · {CHANNELS[s.channel]}
                </span>
                <span className="tabular text-fg">{money(s.amountMXN)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-fg">Conversiones para Google Ads</h2>
          <p className="mt-1 text-sm text-muted">
            Pagos de personas que llegaron por un anuncio de Google y aceptaron la medición. Súbelo en Google Ads →
            Objetivos → Conversiones → Cargas. Usa las acciones de conversión <strong>Compra</strong> y{' '}
            <strong>Renovación</strong> (tipo “Importar desde clics”).
          </p>
          <p className="mt-2 text-xs text-muted">
            Cada compra lleva el mismo ID de pedido que envía el sitio, así Google no la cuenta dos veces. El periodo es
            el seleccionado arriba; Google solo acepta clics de los últimos 90 días.
          </p>
          <Button className="mt-4" size="sm" variant="secondary" onClick={downloadCsv} disabled={downloading}>
            <Icon name="download" size={15} /> {downloading ? 'Preparando…' : 'Descargar archivo CSV'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
