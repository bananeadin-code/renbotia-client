import { useEffect, useRef, useState } from 'react';
import { useAccess } from '../../router/RequirePermission.jsx';
import { PlanCta } from '../../components/ui/PlanCta.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { botConfigApi, businessApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Card, Button, Input, Textarea, Select, Alert, Spinner, Badge, Notice } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { limitsFor } from '../../lib/planLimits.js';
import { extractTextFromFile } from '../../lib/extractText.js';
import { INDUSTRY_TEMPLATES } from '../../content/industryTemplates.js';
import { LearningCard } from '../../components/business/LearningCard.jsx';
import { ImportTraining } from '../../components/business/ImportTraining.jsx';
import { NoticesCard } from '../../components/business/NoticesCard.jsx';
import { TemplateFollowUp } from '../../components/business/TemplateFollowUp.jsx';

const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'cercano', label: 'Cercano' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'tecnico', label: 'Técnico' },
];

// Ícono por giro para las plantillas de arranque (más presentables que solo texto).
const TEMPLATE_ICONS = {
  legal: 'building',
  contable: 'card',
  consultoria: 'academic',
  agencia: 'chart',
  restaurante: 'cart',
  cafeteria: 'cart',
};

// Sectores (igual que en el inicio/onboarding); "otro" permite especificar.
const INDUSTRIES = [
  { value: 'legal', label: 'Despacho legal' },
  { value: 'contable', label: 'Contable / fiscal' },
  { value: 'consultoria', label: 'Consultoría' },
  { value: 'agencia', label: 'Agencia' },
  { value: 'otro', label: 'Otro (especificar)' },
];

// Nombres legibles de cada campo para los mensajes de validación del servidor.
const FIELD_LABELS = {
  systemPrompt: 'Instrucciones de personalidad',
  extraContext: 'Contexto ampliado',
  'businessInfo.services': 'Servicios',
  'businessInfo.hours': 'Horario',
  'businessInfo.location': 'Ubicación',
  'businessInfo.basePricing': 'Precios base',
  faqs: 'Preguntas frecuentes',
};

function labelForIssue(it) {
  if (it.field === 'faqs' && Number.isInteger(it.index)) {
    return `Pregunta ${it.index + 1}`;
  }
  return FIELD_LABELS[it.field] || it.field;
}

const MAX_IMAGE_DIM = 800; // px (lado mayor) al comprimir subidas
const MAX_IMAGE_BYTES = 600_000; // ~0.6 MB/imagen ya comprimida (15 máx ≈ 9MB, bajo el tope de Mongo)

/**
 * Lee un archivo de imagen, lo redimensiona a MAX_IMAGE_DIM y devuelve un data
 * URI JPEG comprimido (autocontenido, sin backend de archivos). Rechaza no-imagen.
 */
function fileToCompressedDataUri(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagen inválida.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        // Baja la calidad hasta quedar bajo el límite de tamaño.
        let quality = 0.82;
        let dataUri = canvas.toDataURL('image/jpeg', quality);
        while (dataUri.length > MAX_IMAGE_BYTES && quality > 0.4) {
          quality -= 0.12;
          dataUri = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUri.length > MAX_IMAGE_BYTES) {
          reject(new Error('La imagen es muy pesada incluso comprimida. Usa una más ligera.'));
          return;
        }
        resolve(dataUri);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Horario de atención: valores por defecto (lunes a viernes 9 a 18 h).
const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // la semana empieza en lunes
const TIMEZONES = [
  ['America/Mexico_City', 'Ciudad de México (centro)'],
  ['America/Tijuana', 'Tijuana (noroeste)'],
  ['America/Hermosillo', 'Hermosillo (Sonora)'],
  ['America/Mazatlan', 'Mazatlán (Pacífico)'],
  ['America/Cancun', 'Cancún (sureste)'],
  ['America/Bogota', 'Bogotá'],
  ['America/Lima', 'Lima'],
  ['America/Santiago', 'Santiago de Chile'],
  ['America/Argentina/Buenos_Aires', 'Buenos Aires'],
  ['America/Guatemala', 'Guatemala / Centroamérica'],
  ['Europe/Madrid', 'Madrid'],
];
function defaultSchedule(saved) {
  const days = DAY_ORDER.map((d) => {
    const s = (saved?.days || []).find((x) => x.day === d);
    return s
      ? { day: d, enabled: Boolean(s.enabled), open: s.open || '09:00', close: s.close || '18:00' }
      : { day: d, enabled: d >= 1 && d <= 5, open: '09:00', close: '18:00' };
  });
  return {
    enabled: Boolean(saved?.enabled),
    timezone: saved?.timezone || 'America/Mexico_City',
    botMode: saved?.botMode || 'always',
    closedMessage: saved?.closedMessage || '',
    days,
  };
}

function UpgradeNote({ children }) {
  return (
    <p className="mt-3 text-xs text-muted">
      {children}{' '}
      <PlanCta className="font-medium text-brand-600 hover:underline">
        Mejorar plan
      </PlanCta>
    </p>
  );
}

export default function BotTraining() {
  const canEditTraining = useAccess('training', 'edit');
  const navigate = useNavigate();
  const business = useBusinessStore((s) => s.business);
  const loadBusiness = useBusinessStore((s) => s.load);
  const [industry, setIndustry] = useState('otro');
  const [industryOther, setIndustryOther] = useState('');
  const [cfg, setCfg] = useState(null);
  const [planKey, setPlanKey] = useState('free');
  const [limits, setLimits] = useState(limitsFor('free'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [issues, setIssues] = useState([]); // rechazos de validación por campo
  const [uploadingIdx, setUploadingIdx] = useState(-1); // imagen que se está subiendo
  const alertRef = useRef(null); // para hacer scroll al aviso tras guardar
  const [feedbackTick, setFeedbackTick] = useState(0); // fuerza scroll en cada intento
  // Tarjeta de plantillas de arranque: visible por defecto; se oculta para el
  // usuario solo al pulsar "No mostrar de nuevo" (recordado en el navegador).
  const [showTemplates, setShowTemplates] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    try {
      const key = `rb_hide_starter_tpl_${business?.id || business?._id || 'x'}`;
      if (localStorage.getItem(key) === '1') setShowTemplates(false);
    } catch {
      /* sin persistencia (modo privado): se mantiene visible */
    }
  }, [business?.id, business?._id]);

  // Al aparecer un aviso (éxito/error/validación), lo trae a la vista: al guardar
  // sueles estar abajo (barra sticky) y el mensaje sale arriba. Depende de un
  // contador para que también haga scroll si el mensaje es el mismo que antes.
  useEffect(() => {
    if (feedbackTick > 0) {
      alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [feedbackTick]);

  // Sector del negocio (vive en Business, no en botConfig): se sincroniza desde
  // el store cuando el negocio está disponible.
  useEffect(() => {
    if (business) {
      setIndustry(business.industry || 'otro');
      setIndustryOther(business.industryOther || '');
    }
  }, [business]);

  useEffect(() => {
    botConfigApi
      .get()
      .then((data) => {
        const c = data.botConfig;
        setPlanKey(data.planKey || 'free');
        setLimits(data.limits || limitsFor(data.planKey || 'free'));
        setCfg({
          botName: c.botName || '',
          tone: c.tone || 'cercano',
          systemPrompt: c.systemPrompt || '',
          extraContext: c.extraContext || '',
          faqs: c.faqs?.length ? c.faqs : [{ question: '', answer: '' }],
          images: c.images || [],
          documents: c.documents || [],
          quickReplies: c.quickReplies?.length ? c.quickReplies : [''],
          schedule: defaultSchedule(c.schedule),
          followUp: {
            enabled: Boolean(c.followUp?.enabled),
            delayHours: c.followUp?.delayHours || 4,
            mode: c.followUp?.mode || 'ai',
            message: c.followUp?.message || '',
            template: {
              enabled: Boolean(c.followUp?.template?.enabled),
              name: c.followUp?.template?.name || '',
              language: c.followUp?.template?.language || 'es_MX',
              delayHours: c.followUp?.template?.delayHours || 48,
              params: c.followUp?.template?.params || [],
              nameFallback: c.followUp?.template?.nameFallback ?? 'cliente',
            },
          },
          // servicesText: string crudo que edita el usuario; se parsea a array al
          // guardar (antes se parseaba en cada tecla y borraba comas/espacios).
          servicesText: (c.businessInfo?.services || []).join(', '),
          businessInfo: {
            hours: c.businessInfo?.hours || '',
            location: c.businessInfo?.location || '',
            services: c.businessInfo?.services || [],
            basePricing: c.businessInfo?.basePricing || '',
          },
        });
      })
      .catch((e) => setError(e.response?.data?.message || 'Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  function set(path, value) {
    setCfg((prev) => ({ ...prev, [path]: value }));
  }
  function setInfo(field, value) {
    setCfg((prev) => ({ ...prev, businessInfo: { ...prev.businessInfo, [field]: value } }));
  }
  function updateFaq(i, field, value) {
    setCfg((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)),
    }));
  }
  function addFaq() {
    setCfg((prev) => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
  }
  function removeFaq(i) {
    setCfg((prev) => ({ ...prev, faqs: prev.faqs.filter((_, idx) => idx !== i) }));
  }
  function updateImage(i, field, value) {
    setCfg((prev) => ({
      ...prev,
      images: prev.images.map((img, idx) => (idx === i ? { ...img, [field]: value } : img)),
    }));
  }
  function addImage() {
    setCfg((prev) => ({ ...prev, images: [...prev.images, { label: '', url: '', context: '' }] }));
  }
  function removeImage(i) {
    setCfg((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
  }
  async function uploadImageFile(i, file) {
    if (!file) return;
    setError('');
    setUploadingIdx(i);
    try {
      const dataUri = await fileToCompressedDataUri(file);
      updateImage(i, 'url', dataUri);
    } catch (e) {
      setError(e.message || 'No se pudo procesar la imagen.');
    } finally {
      setUploadingIdx(-1);
    }
  }

  const [docBusy, setDocBusy] = useState(false);
  async function addDocumentFile(file) {
    if (!file) return;
    if ((cfg.documents || []).length >= 10) {
      setError('Puedes subir hasta 10 documentos.');
      setFeedbackTick((t) => t + 1);
      return;
    }
    setError('');
    setDocBusy(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        setError('No se pudo leer texto de ese archivo. Prueba con un PDF con texto (no escaneado) o un .txt.');
        setFeedbackTick((t) => t + 1);
        return;
      }
      setCfg((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), { name: (file.name || 'documento').slice(0, 120), text }],
      }));
    } catch (e) {
      setError(e.message || 'No se pudo procesar el archivo.');
      setFeedbackTick((t) => t + 1);
    } finally {
      setDocBusy(false);
    }
  }
  function removeDocument(i) {
    setCfg((prev) => ({ ...prev, documents: (prev.documents || []).filter((_, idx) => idx !== i) }));
  }

  async function applyTemplate(t) {
    const ok = await confirm({
      title: 'Cargar plantilla',
      message: `Se reemplazarán las preguntas frecuentes y los servicios con la plantilla de "${t.label}". Podrás ajustar todo antes de guardar.`,
      confirmLabel: 'Cargar plantilla',
    });
    if (!ok) return;
    const maxF = limits.maxFaqs ?? t.faqs.length;
    setCfg((prev) => ({
      ...prev,
      botName: t.botName || prev.botName,
      tone: limits.tone ? t.tone || prev.tone : prev.tone,
      faqs: t.faqs.slice(0, maxF),
      servicesText: (t.services || []).join(', '),
      businessInfo: { ...prev.businessInfo, services: t.services || [] },
    }));
    toast.success('Plantilla cargada. Revisa, ajusta y guarda.');
  }

  // Descartar la tarjeta de plantillas (sirve sobre todo al crear la cuenta). Se
  // recuerda por negocio en el navegador para no volver a mostrarla.
  const tplHideKey = `rb_hide_starter_tpl_${business?.id || business?._id || 'x'}`;
  function dismissTemplates() {
    try {
      localStorage.setItem(tplHideKey, '1');
    } catch {
      /* modo privado: no persistente, se oculta solo esta sesión */
    }
    setShowTemplates(false);
  }

  function updateQuickReply(i, value) {
    setCfg((prev) => ({ ...prev, quickReplies: prev.quickReplies.map((q, idx) => (idx === i ? value : q)) }));
  }
  function addQuickReply() {
    setCfg((prev) => ({ ...prev, quickReplies: [...(prev.quickReplies || []), ''] }));
  }
  function removeQuickReply(i) {
    setCfg((prev) => ({ ...prev, quickReplies: prev.quickReplies.filter((_, idx) => idx !== i) }));
  }

  // Aplica lo que propuso "Entrénalo con lo que ya tienes" al formulario. No
  // guarda: el dueño revisa y pulsa Guardar (con la validación de siempre).
  function applyImport(sel) {
    let skipped = 0;
    setCfg((prev) => {
      const current = prev.faqs.filter((f) => f.question.trim() || f.answer.trim());
      const known = new Set(current.map((f) => f.question.trim().toLowerCase()));
      const fresh = sel.faqs.filter((f) => !known.has(f.question.trim().toLowerCase()));
      const room = limits.maxFaqs == null ? fresh.length : Math.max(0, limits.maxFaqs - current.length);
      skipped = Math.max(0, fresh.length - room);
      const faqs = [...current, ...fresh.slice(0, room)];
      const services = [
        ...new Set([
          ...prev.servicesText.split(',').map((x) => x.trim()).filter(Boolean),
          ...(sel.services || []),
        ]),
      ];
      return {
        ...prev,
        faqs: faqs.length ? faqs : [{ question: '', answer: '' }],
        servicesText: services.join(', '),
        tone: sel.tone || prev.tone,
        extraContext: sel.summary
          ? [prev.extraContext.trim(), sel.summary].filter(Boolean).join('\n\n').slice(0, 6000)
          : prev.extraContext,
        businessInfo: {
          ...prev.businessInfo,
          ...(sel.hours ? { hours: sel.hours } : {}),
          ...(sel.location ? { location: sel.location } : {}),
          ...(sel.basePricing ? { basePricing: sel.basePricing } : {}),
        },
      };
    });
    setTimeout(() => {
      toast.success('Listo. Revisa lo que se cargó y pulsa Guardar.');
      if (skipped > 0) toast.info(`${skipped} preguntas no cupieron en tu plan. Mejóralo para agregar más.`);
    }, 0);
  }

  async function save({ thenSimulate } = {}) {
    setMsg('');
    setError('');
    setIssues([]);

    // Validación local: cada imagen debe tener nombre Y fuente (archivo o URL).
    const incompleteImg = cfg.images.some(
      (img) => (img.label.trim() || img.url.trim()) && !(img.label.trim() && img.url.trim())
    );
    if (incompleteImg) {
      setError('Cada imagen necesita un nombre y una fuente (sube un archivo o pega una URL).');
      setFeedbackTick((t) => t + 1);
      return;
    }

    // Horario: cada día marcado necesita apertura y cierre distintos, y al menos un día.
    if (cfg.schedule?.enabled) {
      if (!cfg.schedule.days.some((d) => d.enabled)) {
        setError('Marca al menos un día en el horario de atención.');
        setFeedbackTick((t) => t + 1);
        return;
      }
      const bad = cfg.schedule.days.find((d) => d.enabled && d.open === d.close);
      if (bad) {
        setError(`En el horario, ${DAY_LABELS[bad.day].toLowerCase()} abre y cierra a la misma hora.`);
        setFeedbackTick((t) => t + 1);
        return;
      }
    }

    // Seguimiento con plantilla: necesita la plantilla elegida.
    if (cfg.followUp?.template?.enabled && !cfg.followUp.template.name) {
      setError('Elige la plantilla aprobada para el seguimiento después de 24 h, o desactívalo.');
      setFeedbackTick((t) => t + 1);
      return;
    }

    // Seguimiento con texto fijo: necesita el mensaje.
    if (cfg.followUp?.enabled && cfg.followUp.mode === 'custom' && cfg.followUp.message.trim().length < 5) {
      setError('Escribe el mensaje de seguimiento o elige que el bot lo redacte.');
      setFeedbackTick((t) => t + 1);
      return;
    }

    setSaving(true);
    try {
      const services = cfg.servicesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        botName: cfg.botName,
        tone: cfg.tone,
        systemPrompt: cfg.systemPrompt,
        extraContext: cfg.extraContext,
        faqs: cfg.faqs.filter((f) => f.question.trim() && f.answer.trim()),
        images: cfg.images.filter((img) => img.label.trim() && img.url.trim()),
        documents: (cfg.documents || []).filter((d) => d.text?.trim()),
        quickReplies: (cfg.quickReplies || []).map((s) => s.trim()).filter(Boolean),
        followUp: {
          ...cfg.followUp,
          message: cfg.followUp.message.trim(),
          template: {
            ...cfg.followUp.template,
            params: (cfg.followUp.template.params || []).map((p) => p.trim()),
            nameFallback: (cfg.followUp.template.nameFallback || 'cliente').trim() || 'cliente',
          },
        },
        schedule: { ...cfg.schedule, closedMessage: cfg.schedule.closedMessage.trim() },
        businessInfo: { ...cfg.businessInfo, services },
      };
      // Sector del negocio (aplica a todos los planes; vive en Business).
      await businessApi.update({
        industry,
        industryOther: industry === 'otro' ? industryOther.trim() : '',
      });
      await botConfigApi.update(payload);
      await loadBusiness(); // refresca el negocio en el store (sector actualizado)
      toast.success('Cambios guardados.');
      if (thenSimulate) {
        navigate('/dashboard/simulador');
        return;
      }
      setMsg('Cambios guardados correctamente.');
    } catch (e) {
      const details = e.response?.data?.details;
      if (details?.code === 'CONTENT_REJECTED' && Array.isArray(details.issues)) {
        setIssues(details.issues);
        setError('');
      } else {
        setError(e.response?.data?.message || 'No se pudo guardar');
      }
    } finally {
      setSaving(false);
      setFeedbackTick((t) => t + 1); // dispara el scroll al aviso (éxito o error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-600" />
      </div>
    );
  }
  if (!cfg) return <Alert variant="error">{error || 'No se pudo cargar la configuración'}</Alert>;

  const faqsAtLimit = limits.maxFaqs != null && cfg.faqs.length >= limits.maxFaqs;
  const imagesAtLimit = cfg.images.length >= limits.maxImages;
  const planName = planKey.charAt(0).toUpperCase() + planKey.slice(1);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-fg">Entrenamiento del bot</h1>
          <p className="text-sm text-muted">
            Todo lo que configures aquí alimenta las respuestas de tu bot.
          </p>
        </div>
        <Badge color="green">Plan {planName}</Badge>
      </div>

      {!canEditTraining && (
        <Notice variant="warning">
          <strong>Solo lectura.</strong> Tu rol te deja ver el entrenamiento del bot, pero no cambiarlo. Si necesitas
          editarlo, pídele al dueño del negocio que ajuste tu rol en Equipo.
        </Notice>
      )}

      <fieldset disabled={!canEditTraining} className="min-w-0 space-y-6 disabled:opacity-80">
      <Notice variant="tip">
        Entre más información le des al bot y más imágenes envíe, cada conversación usa un poco más
        de tu plan del mes. No tienes que contar nada: dale lo esencial y claro, así responde mejor
        y te rinde para más conversaciones.
      </Notice>

      {/* Plantillas de arranque por giro (descartable; útil al crear la cuenta) */}
      {showTemplates && (
        <Card className="border-brand-400/30 bg-gradient-to-br from-brand-500/[0.07] to-transparent">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300">
              <Icon name="academic" size={18} />
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h2 className="font-semibold text-fg">Plantillas de arranque</h2>
              <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                Recomendado
              </span>
            </div>
          </div>

          <p className="mt-2 text-sm text-muted">
            ¿Empezando? Carga preguntas frecuentes y servicios base según tu giro y ajústalos a tu
            negocio. No empieces de cero.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INDUSTRY_TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => applyTemplate(t)}
                className="group flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-3 text-left text-sm font-medium text-fg transition hover:border-brand-300 hover:shadow-sm active:scale-[0.98] sm:py-2.5 sm:hover:-translate-y-0.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface2 text-subtle transition group-hover:bg-brand-500/10 group-hover:text-brand-600">
                  <Icon name={TEMPLATE_ICONS[t.key] || 'building'} size={15} />
                </span>
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-center border-t border-line pt-3 sm:justify-end">
            <button
              type="button"
              onClick={dismissTemplates}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-surface2 hover:text-fg"
            >
              <Icon name="close" size={14} /> No mostrar de nuevo
            </button>
          </div>
        </Card>
      )}

      {(msg || error || issues.length > 0) && (
      <div ref={alertRef} className="scroll-mt-20 space-y-6">
      {msg && <Alert variant="success">{msg}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}
      {issues.length > 0 && (
        <Alert variant="warning">
          <div className="font-semibold">No se guardó: algunos campos no se usan para lo que son.</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {issues.map((it, idx) => (
              <li key={idx}>
                <strong>{labelForIssue(it)}:</strong> {it.reason}
              </li>
            ))}
          </ul>
          <div className="mt-1 text-xs">
            Cada campo es para su propósito: las preguntas para dudas de clientes, la personalidad
            para cómo se comporta el bot, etc. Corrige lo señalado y vuelve a guardar.
          </div>
        </Alert>
      )}
      </div>
      )}

      {/* Entrénalo con lo que ya tienes: chats de WhatsApp, sitio o texto */}
      <Card className="border-brand-400/30 bg-gradient-to-br from-brand-500/[0.06] to-transparent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
            <Icon name="sparkles" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-fg">Entrénalo con lo que ya tienes</h2>
            <p className="mt-0.5 text-sm text-muted">
              Sube tus chats de WhatsApp, tu sitio o tu menú y el bot aprende a contestar como tú. Tú eliges qué se queda.
            </p>
          </div>
          <Button onClick={() => setImportOpen(true)} className="shrink-0 justify-center">
            Importar
          </Button>
        </div>
      </Card>
      <ImportTraining
        open={importOpen}
        onClose={() => setImportOpen(false)}
        allow={{ tone: limits.tone, extraContext: limits.extraContext }}
        faqRoom={
          limits.maxFaqs == null
            ? null
            : Math.max(0, limits.maxFaqs - (cfg?.faqs || []).filter((f) => f.question.trim() || f.answer.trim()).length)
        }
        onApply={applyImport}
      />

      {/* Aprende de ti: lo pendiente por enseñar (solo aparece si hay algo) */}
      <LearningCard
        onLearned={(faq) =>
          // La FAQ ya se guardó en el servidor; se agrega al estado local para que
          // un "Guardar" posterior no la borre.
          setCfg((prev) => ({
            ...prev,
            faqs: [...prev.faqs.filter((f) => f.question.trim() || f.answer.trim()), { question: faq.question, answer: faq.answer }],
          }))
        }
      />

      {/* Personalidad */}
      <Card>
        <h2 className="mb-4 font-semibold text-fg">Personalidad</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre del bot" value={cfg.botName} onChange={(e) => set('botName', e.target.value)} />
          {limits.tone ? (
            <Select label="Tono de respuesta" value={cfg.tone} onChange={(e) => set('tone', e.target.value)}>
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input label="Tono de respuesta" value="Neutral" disabled />
          )}
        </div>

        {limits.personality ? (
          <div className="mt-4">
            <Textarea
              label="Instrucciones de personalidad (opcional)"
              rows={3}
              value={cfg.systemPrompt}
              onChange={(e) => set('systemPrompt', e.target.value)}
              placeholder="Ej. Eres amable y profesional. Siempre invitas a agendar una cita cuando el caso lo amerita."
            />
          </div>
        ) : (
          <UpgradeNote>
            En el plan Free el bot mantiene un tono neutral. Para personalidad y tono a tu medida:
          </UpgradeNote>
        )}
      </Card>

      {/* Contexto ampliado (Pro/Elite) */}
      {limits.extraContext && (
        <Card>
          <h2 className="mb-1 font-semibold text-fg">Contexto ampliado</h2>
          <p className="mb-3 text-sm text-muted">
            Escribe libremente sobre tu negocio para adaptar el bot a fondo (como un prompt único):
            historia, políticas, promociones, forma de hablar, etc.
          </p>
          <Textarea
            rows={6}
            value={cfg.extraContext}
            onChange={(e) => set('extraContext', e.target.value)}
            placeholder="Ej. Somos una cafetería de especialidad fundada en 2019. Atendemos con un trato muy cálido, tuteamos a los clientes. Los martes hay 2x1 en capuchinos…"
          />
        </Card>
      )}

      {/* Datos del negocio */}
      <Card>
        <h2 className="mb-4 font-semibold text-fg">Datos del negocio</h2>

        {/* Sector / giro (aplica a todos los planes; el bot lo usa como contexto) */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Select label="Sector / giro" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {INDUSTRIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          {industry === 'otro' && (
            <Input
              label="Especifica tu sector"
              value={industryOther}
              onChange={(e) => setIndustryOther(e.target.value)}
              placeholder="Ej. Restaurante, cafetería, tienda…"
              maxLength={60}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Ubicación" value={cfg.businessInfo.location} onChange={(e) => setInfo('location', e.target.value)} placeholder="Centro, Durango" />
          <Input
            label="Servicios (separados por coma)"
            value={cfg.servicesText}
            onChange={(e) => set('servicesText', e.target.value)}
            placeholder="Civil, Mercantil, Laboral"
          />
          <Input label="Precios base" value={cfg.businessInfo.basePricing} onChange={(e) => setInfo('basePricing', e.target.value)} placeholder="Consulta desde $500 MXN" />
        </div>
      </Card>

      {/* Avisos temporales (vencen solos) */}
      <NoticesCard />

      {/* Horario de atención (todos los planes) */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
              <Icon name="clock" size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-fg">Horario de atención</h2>
              <p className="mt-0.5 text-xs text-muted">
                Dile al bot cuándo está abierto tu negocio: puede contestar siempre (y avisar cuando estés cerrado) o
                solo fuera de tu horario, mientras tú atiendes en horario.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={cfg.schedule.enabled}
            aria-label="Activar horario de atención"
            onClick={() => set('schedule', { ...cfg.schedule, enabled: !cfg.schedule.enabled })}
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
              cfg.schedule.enabled ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                cfg.schedule.enabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Negocios que escribieron su horario a mano antes de este componente. */}
        {!cfg.schedule.enabled && cfg.businessInfo.hours?.trim() && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-surface2/60 px-3 py-2 text-xs text-muted">
            <Icon name="clock" size={13} className="mt-0.5 shrink-0" />
            <span>
              Hoy el bot usa el horario que escribiste: <strong className="text-fg">{cfg.businessInfo.hours}</strong>.
              Actívalo aquí para que lo sepa con exactitud y sepa cuándo estás cerrado.
            </span>
          </p>
        )}

        {cfg.schedule.enabled && (
          <div className="mt-4 space-y-5 border-t border-line pt-4 animate-fade-up">
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg">¿Cuándo contesta el bot?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ['always', 'Siempre', 'Contesta a toda hora. Cuando estés cerrado, lo sabe y avisa que atenderán en horario.'],
                  ['closed_only', 'Solo fuera de horario', 'En horario contestas tú desde Conversaciones; el bot cubre noches y días libres.'],
                ].map(([val, title, desc]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('schedule', { ...cfg.schedule, botMode: val })}
                    className={`rounded-xl border p-3 text-left transition ${
                      cfg.schedule.botMode === val
                        ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500'
                        : 'border-line hover:border-brand-300'
                    }`}
                  >
                    <span className="block text-sm font-medium text-fg">{title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-fg">Días y horas</p>
                  <button
                    type="button"
                    onClick={() =>
                      set('schedule', {
                        ...cfg.schedule,
                        days: cfg.schedule.days.map((d) => ({ ...d, enabled: true, open: '00:00', close: '23:59' })),
                      })
                    }
                    className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted transition hover:border-brand-300 hover:text-fg"
                  >
                    Abierto 24/7
                  </button>
                </div>
                <Select
                  value={cfg.schedule.timezone}
                  onChange={(e) => set('schedule', { ...cfg.schedule, timezone: e.target.value })}
                  aria-label="Zona horaria"
                  size="sm"
                  fullWidth={false}
                  className="text-xs"
                >
                  {TIMEZONES.map(([tz, label]) => (
                    <option key={tz} value={tz}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="divide-y divide-line rounded-xl border border-line">
                {cfg.schedule.days.map((d, i) => {
                  const setDay = (patch) =>
                    set('schedule', {
                      ...cfg.schedule,
                      days: cfg.schedule.days.map((x, j) => (j === i ? { ...x, ...patch } : x)),
                    });
                  return (
                    <div key={d.day} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                      <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2 text-sm text-fg">
                        <input
                          type="checkbox"
                          checked={d.enabled}
                          onChange={(e) => setDay({ enabled: e.target.checked })}
                          className="h-4 w-4 rounded border-line accent-brand-600"
                        />
                        {DAY_LABELS[d.day]}
                      </label>
                      {d.enabled ? (
                        <div className="flex items-center gap-2 text-sm">
                          <input
                            type="time"
                            value={d.open}
                            onChange={(e) => setDay({ open: e.target.value })}
                            aria-label={`${DAY_LABELS[d.day]}: abre`}
                            className="rounded-lg border border-line bg-canvas px-2 py-1 text-fg outline-none focus:border-brand-500"
                          />
                          <span className="text-subtle">a</span>
                          <input
                            type="time"
                            value={d.close}
                            onChange={(e) => setDay({ close: e.target.value })}
                            aria-label={`${DAY_LABELS[d.day]}: cierra`}
                            className="rounded-lg border border-line bg-canvas px-2 py-1 text-fg outline-none focus:border-brand-500"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-subtle">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-subtle">
                Si cierras después de medianoche (por ejemplo 20:00 a 02:00), el horario se cuenta hasta la madrugada.
              </p>
            </div>

            {cfg.schedule.botMode === 'always' && (
              <div>
                <Textarea
                  label="Aviso cuando estés cerrado (opcional)"
                  rows={2}
                  maxLength={300}
                  value={cfg.schedule.closedMessage}
                  onChange={(e) => set('schedule', { ...cfg.schedule, closedMessage: e.target.value })}
                  placeholder="Ej. Abrimos mañana a las 9:00. Si es urgente, déjanos tu número y te llamamos."
                />
                <p className="mt-1 text-[11px] text-subtle">El bot lo comunica con sus palabras cuando aplique.</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Base de conocimiento */}
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-semibold text-fg">Base de conocimiento (FAQs)</h2>
          <Button size="sm" variant="secondary" onClick={addFaq} disabled={faqsAtLimit}>
            <Icon name="plus" size={16} />
            Agregar
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted">
          {limits.maxFaqs == null
            ? 'Preguntas ilimitadas.'
            : `${cfg.faqs.length}/${limits.maxFaqs} preguntas frecuentes.`}
        </p>
        {faqsAtLimit && (
          <UpgradeNote>Alcanzaste el máximo de FAQs de tu plan. Para más:</UpgradeNote>
        )}
        <div className="space-y-3">
          {cfg.faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border border-line p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted">Pregunta {i + 1}</span>
                {cfg.faqs.length > 1 && (
                  <button onClick={() => removeFaq(i)} className="text-xs text-red-500 hover:underline">
                    Eliminar
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <Input placeholder="Pregunta" value={faq.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} />
                <Textarea rows={2} placeholder="Respuesta" value={faq.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Imágenes (Elite) */}
      {limits.maxImages > 0 && (
        <Card>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-fg">Imágenes del bot</h2>
            <Button size="sm" variant="secondary" onClick={addImage} disabled={imagesAtLimit}>
              <Icon name="plus" size={16} />
              Agregar
            </Button>
          </div>
          <p className="mb-3 text-xs text-muted">
            El bot puede ofrecer estas imágenes cuando el cliente lo pida. Cada una necesita un
            nombre y una imagen (sube un archivo o pega una URL). {cfg.images.length}/
            {limits.maxImages}.
          </p>
          <div className="space-y-3">
            {cfg.images.length === 0 && (
              <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-subtle">
                Aún no agregas imágenes. Ej. menú, catálogo, ubicación en mapa.
              </p>
            )}
            {cfg.images.map((img, i) => (
              <div key={i} className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Imagen {i + 1}</span>
                  <button onClick={() => removeImage(i)} className="text-xs text-red-500 hover:underline">
                    Eliminar
                  </button>
                </div>
                <div className="flex gap-3">
                  {/* Miniatura / preview */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface2">
                    {img.url ? (
                      <img src={img.url} alt={img.label || 'preview'} className="h-full w-full object-cover" />
                    ) : (
                      <Icon name="tag" size={22} className="text-subtle" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      placeholder="Nombre (ej. Menú)"
                      value={img.label}
                      onChange={(e) => updateImage(i, 'label', e.target.value)}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-fg hover:bg-surface2">
                        <Icon name="plus" size={15} />
                        {uploadingIdx === i ? 'Procesando…' : 'Subir archivo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingIdx === i}
                          onChange={(e) => {
                            uploadImageFile(i, e.target.files?.[0]);
                            e.target.value = ''; // permite re-subir el mismo archivo
                          }}
                        />
                      </label>
                      <span className="text-xs text-subtle">o</span>
                      <input
                        placeholder="Pega una URL de imagen"
                        value={img.url.startsWith('data:') ? '' : img.url}
                        onChange={(e) => updateImage(i, 'url', e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                      />
                    </div>
                    {img.url.startsWith('data:') && (
                      <p className="flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300">
                        <Icon name="check" size={13} /> Archivo cargado
                        <button
                          onClick={() => updateImage(i, 'url', '')}
                          className="ml-1 text-red-500 hover:underline"
                        >
                          quitar
                        </button>
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <Input
                    placeholder="¿Cuándo enviarla? (ej. cuando pregunten por los platillos)"
                    value={img.context}
                    onChange={(e) => updateImage(i, 'context', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documentos de contexto (Elite) */}
      {limits.documents && (
        <Card>
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-fg">Documentos de contexto</h2>
            <label
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-fg transition hover:border-brand-300 ${
                docBusy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <Icon name="plus" size={16} />
              {docBusy ? 'Leyendo…' : 'Subir archivo'}
              <input
                type="file"
                accept=".pdf,.txt,.md,text/plain,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  addDocumentFile(f);
                }}
              />
            </label>
          </div>
          <p className="mb-3 text-xs text-muted">
            Sube PDFs o archivos de texto con información del negocio (folletos, catálogos, políticas).
            Extraemos el texto para que el bot lo use como referencia. {(cfg.documents || []).length}/10.
          </p>
          <div className="space-y-2">
            {(cfg.documents || []).length === 0 ? (
              <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-subtle">
                Aún no subes documentos. Ej. un PDF con tus servicios o preguntas frecuentes.
              </p>
            ) : (
              (cfg.documents || []).map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface2/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fg">{d.name || 'Documento'}</div>
                    <div className="text-xs text-subtle">
                      {(d.text || '').length.toLocaleString('es-MX')} caracteres
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(i)}
                    className="shrink-0 text-xs text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
          <Notice variant="security" className="mt-3">
Sube solo contenido lícito y relacionado con tu negocio; eres responsable de lo que
              cargas. El bot ignora lo que no corresponda al negocio.
</Notice>
        </Card>
      )}

      {/* Seguimiento automático (Pro/Elite) */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
              <Icon name="repeat" size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-fg">Seguimiento automático</h2>
              <p className="mt-0.5 text-xs text-muted">
                Si un cliente deja de responder, el bot le escribe una vez para retomar la conversación. En
                WhatsApp, Messenger e Instagram, dentro de las 24 h que Meta permite (sin costo extra de Meta).
              </p>
            </div>
          </div>
          {limits.followUp && (
            <button
              type="button"
              role="switch"
              aria-checked={cfg.followUp.enabled}
              aria-label="Activar seguimiento automático"
              onClick={() => set('followUp', { ...cfg.followUp, enabled: !cfg.followUp.enabled })}
              className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
                cfg.followUp.enabled ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  cfg.followUp.enabled ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          )}
        </div>

        {!limits.followUp ? (
          <UpgradeNote>Disponible en los planes Pro y Elite.</UpgradeNote>
        ) : (
          cfg.followUp.enabled && (
            <div className="mt-4 space-y-4 border-t border-line pt-4 animate-fade-up">
              <div>
                <label htmlFor="fu-delay" className="mb-1.5 block text-sm font-medium text-fg">
                  Escribirle después de
                </label>
                <Select
                  id="fu-delay"
                  value={cfg.followUp.delayHours}
                  onChange={(e) => set('followUp', { ...cfg.followUp, delayHours: Number(e.target.value) })}
                  size="sm"
                  className="py-2 sm:w-60"
                >
                  {[1, 2, 3, 4, 6, 8, 12, 20].map((h) => (
                    <option key={h} value={h}>
                      {h === 1 ? '1 hora' : `${h} horas`} sin respuesta
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-fg">Mensaje</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['ai', 'Que el bot lo redacte', 'Retoma el tema pendiente de cada conversación. Si ya cerró, no escribe.'],
                    ['custom', 'Usar mi propio texto', 'El mismo mensaje para todos los clientes.'],
                  ].map(([val, title, desc]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => set('followUp', { ...cfg.followUp, mode: val })}
                      className={`rounded-xl border p-3 text-left transition ${
                        cfg.followUp.mode === val
                          ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500'
                          : 'border-line hover:border-brand-300'
                      }`}
                    >
                      <span className="block text-sm font-medium text-fg">{title}</span>
                      <span className="mt-0.5 block text-xs text-muted">{desc}</span>
                    </button>
                  ))}
                </div>
                {cfg.followUp.mode === 'custom' && (
                  <div className="mt-3">
                    <Textarea
                      rows={2}
                      maxLength={500}
                      value={cfg.followUp.message}
                      onChange={(e) => set('followUp', { ...cfg.followUp, message: e.target.value })}
                      placeholder="¡Hola! ¿Pudiste revisar la información? Si te quedó alguna duda, aquí estoy para ayudarte."
                    />
                  </div>
                )}
              </div>

              <Notice variant="security">
Solo un seguimiento por conversación mientras el cliente no conteste. No se envía si tomaste
                  el control (modo manual) o si la conversación pide atención.
                  {cfg.followUp.mode === 'ai' ? ' Redactarlo consume muy poco de tu saldo de conversaciones.' : ''}
</Notice>
            </div>
          )
        )}
        {limits.followUp && (
          <div className="mt-4">
            <TemplateFollowUp
              value={cfg.followUp.template}
              onChange={(template) => set('followUp', { ...cfg.followUp, template })}
            />
          </div>
        )}
      </Card>

      {/* Respuestas rápidas (para el agente en Conversaciones) */}
      <Card>
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-fg">Respuestas rápidas</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={addQuickReply}
            disabled={(cfg.quickReplies || []).length >= 12}
          >
            <Icon name="plus" size={16} /> Agregar
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted">
          Frases guardadas que tú o tu equipo insertan con un clic al responder de forma manual en
          Conversaciones. El bot no las usa.
        </p>
        <div className="space-y-2">
          {(cfg.quickReplies || []).filter((q) => q !== undefined).length === 0 && (
            <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-subtle">
              Sin respuestas rápidas. Ej. “En un momento te atiende un asesor.”
            </p>
          )}
          {(cfg.quickReplies || []).map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Textarea
                  rows={2}
                  value={q}
                  onChange={(e) => updateQuickReply(i, e.target.value)}
                  placeholder="Escribe una respuesta rápida"
                />
              </div>
              <button
                onClick={() => removeQuickReply(i)}
                className="mt-2 shrink-0 text-xs text-red-500 hover:underline"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Espaciador: da despeje para que la barra fija no tape el final del
          contenido (Imágenes del bot y demás) al hacer scroll. */}
      <div className="h-16" aria-hidden="true" />

      </fieldset>

      {/* Acciones (sticky) — solo con permiso de editar */}
      {canEditTraining && (
      <div className="sticky bottom-0 flex flex-col gap-2 rounded-xl border border-line bg-surface/95 p-3 backdrop-blur sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => save()} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button onClick={() => save({ thenSimulate: true })} disabled={saving}>
          Guardar y probar
          <Icon name="message" size={18} />
        </Button>
      </div>
      )}
    </div>
  );
}
