/**
 * Generación de PDFs con marca RenBotIA (jsPDF + autotable), cargados BAJO
 * DEMANDA (import dinámico) para no engordar el bundle inicial. Encabezado con
 * logo, tablas legibles y una marca de agua tenue del logo en cada página.
 *
 * Dos reportes:
 *  - downloadMonthlyReportPdf(analytics, businessName): reporte mensual del bot.
 *  - downloadFiscalReportPdf(fiscal): control fiscal (RESICO) para el admin.
 */

// Paleta de marca (RGB).
const GREEN = [16, 185, 129];
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const LIGHT = [241, 245, 249];

const LOGO_URL = '/renbotia-icon-1024.png';

const mxn = (n) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });

// Carga el logo como data URL (una sola vez). Si falla, se omite sin romper el PDF.
let _logo = null;
async function logoDataUrl() {
  if (_logo !== null) return _logo;
  try {
    const res = await fetch(LOGO_URL);
    const blob = await res.blob();
    _logo = await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = () => resolve('');
      r.readAsDataURL(blob);
    });
  } catch {
    _logo = '';
  }
  return _logo;
}

async function newDoc() {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  return { doc, autoTable };
}

// Encabezado (página 1): logo + marca + título + subtítulo + línea verde.
function drawHeader(doc, logo, { title, subtitle }) {
  const w = doc.internal.pageSize.getWidth();
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 40, 32, 30, 30);
    } catch {
      /* imagen inválida: se omite */
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text('RenBotIA', 80, 52);

  doc.setFontSize(21);
  doc.setTextColor(...INK);
  doc.text(title, 40, 98);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text(subtitle, 40, 116);
  }
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(2);
  doc.line(40, 128, w - 40, 128);
  return 148; // startY para el contenido
}

// Marca de agua tenue + pie en TODAS las páginas (se llama al final).
function stampAllPages(doc, logo) {
  const pages = doc.internal.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    // Marca de agua: logo grande y muy tenue al centro (no estorba la lectura).
    if (logo && doc.GState) {
      try {
        doc.setGState(new doc.GState({ opacity: 0.04 }));
        const size = 280;
        doc.addImage(logo, 'PNG', (w - size) / 2, (h - size) / 2, size, size);
        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch {
        /* sin marca de agua si falla */
      }
    }
    // Pie
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('RenBotIA · Asistentes de WhatsApp con IA · renbotia.com', 40, h - 24);
    doc.text(`Página ${i} de ${pages}`, w - 40, h - 24, { align: 'right' });
  }
}

// Estilos comunes de tabla (marca).
function tableOpts(startY, extra = {}) {
  return {
    startY,
    margin: { left: 40, right: 40, bottom: 48 },
    styles: { fontSize: 9, cellPadding: 6, textColor: INK, lineColor: LIGHT, lineWidth: 0.5 },
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'grid',
    ...extra,
  };
}

// Título de sección pequeño antes de una tabla.
function sectionTitle(doc, y, text) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(text, 40, y);
  return y + 8;
}

/** Reporte mensual del bot (analíticas + impacto) en PDF con marca. */
export async function downloadMonthlyReportPdf(a, businessName = '') {
  const { doc, autoTable } = await newDoc();
  const logo = await logoDataUrl();
  const t = a?.totals || {};

  let y = drawHeader(doc, logo, {
    title: 'Reporte mensual',
    subtitle: [businessName, a?.month].filter(Boolean).join('  ·  '),
  });

  const fmtMins = (m) =>
    m == null ? '—' : m < 1 ? `${Math.round(m * 60)} s` : m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)} h ${Math.round(m % 60)} min`;

  // Resumen del mes
  y = sectionTitle(doc, y + 6, 'Resumen del mes');
  autoTable(
    doc,
    tableOpts(y + 6, {
      head: [['Indicador', 'Valor']],
      body: [
        ['Conversaciones atendidas', String(t.conversationsThisMonth ?? 0)],
        ['Trabajo captado (citas, pedidos…)', String(t.recordsThisMonth ?? 0)],
        ['Mensajes respondidos por el bot', String(t.botReplies ?? 0)],
        ['Respuestas por una persona', String(t.agentReplies ?? 0)],
        ['Tiempo de 1ª respuesta (aprox.)', fmtMins(t.avgResponseMins)],
        ['Leads calientes sin atender', String(t.hotLeadsOpen ?? 0)],
      ],
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    })
  );
  y = doc.lastAutoTable.finalY + 22;

  // Trabajo por tipo
  const rbt = a?.recordsByType || [];
  if (rbt.length) {
    y = sectionTitle(doc, y, 'Trabajo captado por tipo (últimos 90 días)');
    autoTable(
      doc,
      tableOpts(y + 6, {
        head: [['Tipo', 'Cantidad']],
        body: rbt.map((r) => [r.label, String(r.count)]),
        columnStyles: { 1: { halign: 'right' } },
      })
    );
    y = doc.lastAutoTable.finalY + 22;
  }

  // Canales
  const ch = a?.channels || [];
  if (ch.length) {
    y = sectionTitle(doc, y, 'Conversaciones por canal');
    autoTable(
      doc,
      tableOpts(y + 6, {
        head: [['Canal', 'Cantidad']],
        body: ch.map((c) => [c.label, String(c.count)]),
        columnStyles: { 1: { halign: 'right' } },
      })
    );
    y = doc.lastAutoTable.finalY + 22;
  }

  // Tendencia 6 meses
  const monthly = a?.monthly || [];
  if (monthly.length) {
    y = sectionTitle(doc, y, 'Tendencia (últimos 6 meses)');
    autoTable(
      doc,
      tableOpts(y + 6, {
        head: [['Mes', 'Conversaciones', 'Trabajo captado']],
        body: monthly.map((m) => [m.label, String(m.conversations), String(m.records)]),
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      })
    );
  }

  stampAllPages(doc, logo);
  doc.save('reporte-mensual-renbotia.pdf');
}

/** Control fiscal (RESICO) del admin en PDF con marca. */
export async function downloadFiscalReportPdf(f) {
  const { doc, autoTable } = await newDoc();
  const logo = await logoDataUrl();
  const { current, year, allTime, months, obligations, regime } = f;

  let y = drawHeader(doc, logo, {
    title: `Control fiscal · ${regime?.name || 'RESICO'}`,
    subtitle: [`Clave ${regime?.code || ''}`.trim(), current?.label].filter(Boolean).join('  ·  '),
  });

  // Ingresos
  y = sectionTitle(doc, y + 6, 'Ingresos (pagos completados)');
  autoTable(
    doc,
    tableOpts(y + 6, {
      head: [['Periodo', 'Ingresos', 'Pagos']],
      body: [
        [`Mes actual (${current?.label || ''})`, mxn(current?.income), String(current?.payments ?? 0)],
        [`Año ${year?.year || ''}`, mxn(year?.income), '—'],
        ['Histórico', mxn(allTime?.income), String(allTime?.payments ?? 0)],
      ],
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' }, 2: { halign: 'right' } },
    })
  );
  y = doc.lastAutoTable.finalY + 22;

  // Declaración del mes
  y = sectionTitle(doc, y, `Declaración de ${current?.label || 'este mes'}`);
  autoTable(
    doc,
    tableOpts(y + 6, {
      head: [['Concepto', 'Estimado']],
      body: [
        [`ISR estimado (${current?.isrRatePct ?? 0}%)`, mxn(current?.isr)],
        ['IVA estimado (16%)', mxn(current?.iva)],
        ['Vence el', current?.dueLabel || '—'],
      ],
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    })
  );
  y = doc.lastAutoTable.finalY + 22;

  // Obligaciones
  if (obligations?.length) {
    y = sectionTitle(doc, y, 'Obligaciones');
    autoTable(
      doc,
      tableOpts(y + 6, {
        head: [['Obligación', 'Clave', 'Periodicidad']],
        body: obligations.map((o) => [o.name, o.clave, o.freq]),
      })
    );
    y = doc.lastAutoTable.finalY + 22;
  }

  // Historial mensual
  if (months?.length) {
    y = sectionTitle(doc, y, 'Historial mensual (estimado)');
    autoTable(
      doc,
      tableOpts(y + 6, {
        head: [['Mes', 'Ingresos', 'ISR est.', 'IVA est.', 'Pagos']],
        body: months.map((m) => [m.label, mxn(m.income), mxn(m.isr), mxn(m.iva), String(m.payments)]),
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
        },
      })
    );
    y = doc.lastAutoTable.finalY + 18;
  }

  // Nota
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const note =
    'Cifras de impuestos estimadas para control interno. El ISR usa la tasa de RESICO por el ingreso del mes y el IVA asume precios con IVA incluido; no resta IVA acreditable ni deducciones. La declaración se presenta en el portal del SAT; apóyate en tu contador para el cálculo y envío final.';
  const lines = doc.splitTextToSize(note, doc.internal.pageSize.getWidth() - 80);
  doc.text(lines, 40, y + 6);

  stampAllPages(doc, logo);
  doc.save('control-fiscal-renbotia.pdf');
}
