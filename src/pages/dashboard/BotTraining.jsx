import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { botConfigApi, businessApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Input, Textarea, Select, Alert, Spinner, Badge } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { limitsFor } from '../../lib/planLimits.js';

const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'cercano', label: 'Cercano' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'tecnico', label: 'Técnico' },
];

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

function UpgradeNote({ children }) {
  return (
    <p className="mt-3 text-xs text-muted">
      {children}{' '}
      <Link to="/dashboard/facturacion" className="font-medium text-brand-600 hover:underline">
        Mejorar plan
      </Link>
    </p>
  );
}

export default function BotTraining() {
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
          <Input label="Horario de atención" value={cfg.businessInfo.hours} onChange={(e) => setInfo('hours', e.target.value)} placeholder="Lun-Vie 9:00-18:00" />
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

      {/* Acciones (sticky en móvil) */}
      <div className="sticky bottom-0 flex flex-col gap-2 rounded-xl border border-line bg-surface/90 p-3 backdrop-blur sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => save()} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button onClick={() => save({ thenSimulate: true })} disabled={saving}>
          Guardar y probar
          <Icon name="message" size={18} />
        </Button>
      </div>
    </div>
  );
}
