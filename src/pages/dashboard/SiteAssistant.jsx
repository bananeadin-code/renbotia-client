import { useEffect, useState } from 'react';
import { siteAssistantApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Input, Select, Textarea, Alert, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'cercano', label: 'Cercano' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'tecnico', label: 'Técnico' },
];

/**
 * Módulo ADMIN: entrena al asistente IA del SITIO (el del widget flotante de las
 * páginas públicas). Sirve de soporte, guía y prueba viva del producto.
 */
export default function SiteAssistant() {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    siteAssistantApi
      .adminGet()
      .then((d) => setCfg(d.config))
      .catch((e) => setError(e.response?.data?.message || 'No se pudo cargar.'))
      .finally(() => setLoading(false));
  }, []);

  function set(field, value) {
    setCfg((c) => ({ ...c, [field]: value }));
  }
  function setInfo(field, value) {
    setCfg((c) => ({ ...c, businessInfo: { ...c.businessInfo, [field]: value } }));
  }

  // Sugerencias rápidas (chips)
  const replies = cfg?.quickReplies || [];
  const setReply = (i, v) => set('quickReplies', replies.map((r, idx) => (idx === i ? v : r)));
  const addReply = () => replies.length < 6 && set('quickReplies', [...replies, '']);
  const removeReply = (i) => set('quickReplies', replies.filter((_, idx) => idx !== i));

  // Servicios
  const services = cfg?.businessInfo?.services || [];
  const setService = (i, v) => setInfo('services', services.map((s, idx) => (idx === i ? v : s)));
  const addService = () => services.length < 12 && setInfo('services', [...services, '']);
  const removeService = (i) => setInfo('services', services.filter((_, idx) => idx !== i));

  // FAQs
  const faqs = cfg?.faqs || [];
  const setFaq = (i, k, v) => set('faqs', faqs.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));
  const addFaq = () => faqs.length < 20 && set('faqs', [...faqs, { question: '', answer: '' }]);
  const removeFaq = (i) => set('faqs', faqs.filter((_, idx) => idx !== i));

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        botName: cfg.botName,
        tone: cfg.tone,
        enabled: cfg.enabled,
        welcomeMessage: cfg.welcomeMessage,
        quickReplies: replies.map((r) => r.trim()).filter(Boolean),
        businessInfo: {
          hours: cfg.businessInfo?.hours || '',
          location: cfg.businessInfo?.location || '',
          services: services.map((s) => s.trim()).filter(Boolean),
          basePricing: cfg.businessInfo?.basePricing || '',
        },
        faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
        extraContext: cfg.extraContext,
      };
      const d = await siteAssistantApi.adminUpdate(payload);
      setCfg(d.config);
      toast.success('Asistente del sitio actualizado.');
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-600" />
      </div>
    );
  }
  if (!cfg) {
    return <Alert variant="error">{error || 'No se pudo cargar el asistente.'}</Alert>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Asistente del sitio</h1>
        <p className="mt-1 text-sm text-muted">
          Este es el asistente del <strong>widget flotante</strong> de tu sitio público: da soporte,
          guía a los visitantes y orienta a elegir un plan. Es a la vez una prueba viva de que la
          plataforma funciona. (Distinto del demo de la página de inicio.)
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Estado + identidad */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface2 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-fg">Asistente activo en el sitio</p>
            <p className="text-xs text-muted">Si lo desactivas, el widget deja de aparecer.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={cfg.enabled}
            aria-label="Activar asistente del sitio"
            onClick={() => set('enabled', !cfg.enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
              cfg.enabled ? 'bg-brand-600' : 'border border-line bg-canvas'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                cfg.enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre del asistente" value={cfg.botName} maxLength={60} onChange={(e) => set('botName', e.target.value)} />
          <Select label="Tono" value={cfg.tone} onChange={(e) => set('tone', e.target.value)}>
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Mensaje de bienvenida"
          rows={2}
          maxLength={500}
          value={cfg.welcomeMessage}
          onChange={(e) => set('welcomeMessage', e.target.value)}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-fg">Sugerencias rápidas (chips, hasta 6)</span>
            <Button size="sm" variant="secondary" onClick={addReply} disabled={replies.length >= 6}>
              <Icon name="plus" size={16} /> Agregar
            </Button>
          </div>
          <div className="space-y-2">
            {replies.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={r} maxLength={80} onChange={(e) => setReply(i, e.target.value)} placeholder="Ej. ¿Cuánto cuesta?" />
                <button onClick={() => removeReply(i)} className="text-xs text-red-500 hover:underline">
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Información de RenBotIA */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-fg">Información que usa para responder</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Disponibilidad / horario" value={cfg.businessInfo?.hours || ''} onChange={(e) => setInfo('hours', e.target.value)} />
          <Input label="Ubicación / cobertura" value={cfg.businessInfo?.location || ''} onChange={(e) => setInfo('location', e.target.value)} />
        </div>
        <Textarea
          label="Planes y precios"
          rows={3}
          maxLength={600}
          value={cfg.businessInfo?.basePricing || ''}
          onChange={(e) => setInfo('basePricing', e.target.value)}
        />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-fg">Qué ofrece (lista)</span>
            <Button size="sm" variant="secondary" onClick={addService} disabled={services.length >= 12}>
              <Icon name="plus" size={16} /> Agregar
            </Button>
          </div>
          <div className="space-y-2">
            {services.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={s} maxLength={160} onChange={(e) => setService(i, e.target.value)} />
                <button onClick={() => removeService(i)} className="text-xs text-red-500 hover:underline">
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* FAQs */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-fg">Preguntas frecuentes (hasta 20)</h2>
          <Button size="sm" variant="secondary" onClick={addFaq} disabled={faqs.length >= 20}>
            <Icon name="plus" size={16} /> Agregar
          </Button>
        </div>
        {faqs.map((f, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-line p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Pregunta {i + 1}</span>
              <button onClick={() => removeFaq(i)} className="text-xs text-red-500 hover:underline">
                Quitar
              </button>
            </div>
            <Input value={f.question} maxLength={200} placeholder="Pregunta" onChange={(e) => setFaq(i, 'question', e.target.value)} />
            <Textarea rows={2} maxLength={1000} value={f.answer} placeholder="Respuesta" onChange={(e) => setFaq(i, 'answer', e.target.value)} />
          </div>
        ))}
      </Card>

      {/* Guía / instrucciones */}
      <Card className="space-y-2">
        <h2 className="font-semibold text-fg">Guía de comportamiento</h2>
        <p className="text-sm text-muted">
          Instrucciones extra sobre cómo debe comportarse y orientar (por ejemplo, cómo recomendar un
          plan según el negocio del visitante).
        </p>
        <Textarea rows={4} maxLength={2000} value={cfg.extraContext || ''} onChange={(e) => set('extraContext', e.target.value)} />
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
