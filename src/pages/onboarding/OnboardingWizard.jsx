import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi, planApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { toast } from '../../store/toastStore.js';
import { PlanCards } from '../../components/PlanCards.jsx';
import { CheckoutDialog } from '../../components/billing/CheckoutDialog.jsx';
import { Button, Input, Select, Textarea, Alert, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { Logo } from '../../components/ui/Logo.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';
import { limitsFor } from '../../lib/planLimits.js';

const STEPS = ['Tu negocio', 'Elige un plan', 'Entrena tu bot'];

// Progreso del onboarding guardado en el navegador: si el usuario abandona a la
// mitad, al volver retoma donde quedó en vez de empezar de cero.
const SAVE_KEY = 'renbotia:onboarding';
const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  } catch {
    return null;
  }
};
const clearSaved = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* noop */
  }
};
const INDUSTRIES = [
  { value: 'legal', label: 'Despacho legal' },
  { value: 'contable', label: 'Contable / fiscal' },
  { value: 'consultoria', label: 'Consultoría' },
  { value: 'agencia', label: 'Agencia' },
  { value: 'otro', label: 'Otro (especificar)' },
];
const TONES = [
  { value: 'formal', label: 'Formal' },
  { value: 'cercano', label: 'Cercano' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'tecnico', label: 'Técnico' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const loadBusiness = useBusinessStore((s) => s.load);

  const saved = loadSaved(); // progreso previo (si abandonó a la mitad)

  const [step, setStep] = useState(saved?.step ?? 0);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Pago embebido del plan (modal), en vez de redirigir a Stripe.
  const [checkout, setCheckout] = useState(null);

  // Si el usuario ya tiene negocio, no debería estar aquí (y limpiamos el
  // progreso guardado). Si retoma un onboarding a medias, se lo avisamos.
  useEffect(() => {
    onboardingApi.status().then(({ hasBusiness }) => {
      if (hasBusiness) {
        clearSaved();
        navigate('/dashboard', { replace: true });
      }
    });
    planApi
      .list()
      .then((data) => setPlans(data.plans))
      .finally(() => setLoadingPlans(false));
    if (saved && (saved.step > 0 || saved.business?.name)) {
      toast.info('Retomamos tu progreso donde lo dejaste.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const [business, setBusiness] = useState(
    saved?.business ?? { name: '', industry: 'legal', industryOther: '', whatsappNumber: '' }
  );
  const [planKey, setPlanKey] = useState(saved?.planKey ?? 'free');
  const [bot, setBot] = useState(
    saved?.bot ?? { botName: '', tone: 'cercano', hours: '', location: '' }
  );
  const [faqs, setFaqs] = useState(
    saved?.faqs ?? [
      { question: '', answer: '' },
      { question: '', answer: '' },
    ]
  );

  // Persiste el progreso en el navegador ante cada cambio.
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ step, business, planKey, bot, faqs }));
    } catch {
      /* sin persistencia disponible: no bloquea el onboarding */
    }
  }, [step, business, planKey, bot, faqs]);

  const limits = limitsFor(planKey);
  const faqMax = limits.maxFaqs == null ? 5 : limits.maxFaqs; // en onboarding cap visual a 5
  const isFree = planKey === 'free';

  function updateFaq(i, field, value) {
    setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }
  function addFaq() {
    if (faqs.length < faqMax) setFaqs([...faqs, { question: '', answer: '' }]);
  }
  function removeFaq(i) {
    setFaqs(faqs.filter((_, idx) => idx !== i));
  }

  const canNext =
    (step === 0 && business.name.trim().length >= 2) ||
    (step === 1 && planKey) ||
    step === 2;

  async function handleFinish() {
    setError('');
    setSubmitting(true);
    try {
      const cleanFaqs = faqs
        .filter((f) => f.question.trim() && f.answer.trim())
        .slice(0, limits.maxFaqs ?? undefined);
      const botConfig = {
        botName: bot.botName || business.name,
        tone: limits.tone ? bot.tone : 'neutral', // Free siempre neutral
        faqs: cleanFaqs,
        businessInfo: { hours: bot.hours, location: bot.location },
      };

      if (isFree) {
        // El plan Free se activa al instante, sin Stripe.
        await onboardingApi.complete({ business, planKey, botConfig });
        clearSaved();
        await loadBusiness();
        navigate('/dashboard', { replace: true });
        return;
      }

      // Planes de pago: pago embebido dentro del sitio (sin redirect). Los datos
      // de onboarding viajan al confirmar el pago, y ahí se crea el negocio.
      const plan = plans.find((p) => p.key === planKey);
      setCheckout({
        kind: 'plan',
        planKey,
        itemName: `Plan ${plan?.name || ''}`.trim(),
        amountMXN: plan?.priceMXN ?? 0,
        onboarding: { business, botConfig },
      });
      setSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar el onboarding');
      setSubmitting(false);
    }
  }

  // Tras confirmar el pago del plan: el negocio ya quedó creado; al panel.
  async function onPaidSuccess() {
    setCheckout(null);
    clearSaved();
    await loadBusiness();
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex justify-center">
          <Logo size={30} />
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  i < step
                    ? 'bg-brand-600 text-white'
                    : i === step
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : 'bg-surface2 text-muted'
                }`}
              >
                {i < step ? <Icon name="check" size={16} /> : i + 1}
              </div>
              <span className={`hidden text-sm sm:block ${i === step ? 'font-semibold text-fg' : 'text-subtle'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-6 bg-line" />}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-card sm:p-8">
          {error && (
            <div className="mb-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {/* Paso 1: negocio */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-fg">Cuéntanos de tu negocio</h2>
              <Input
                label="Nombre del negocio"
                required
                value={business.name}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                placeholder="Ej. Bufete Herrera & Asociados"
              />
              <Select
                label="Rubro"
                value={business.industry}
                onChange={(e) => setBusiness({ ...business, industry: e.target.value })}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </Select>
              {business.industry === 'otro' && (
                <Input
                  label="Especifica tu sector"
                  value={business.industryOther}
                  onChange={(e) => setBusiness({ ...business, industryOther: e.target.value })}
                  placeholder="Ej. Restaurante, cafetería, tienda…"
                  maxLength={60}
                />
              )}
              <Input
                label="Número de WhatsApp (simulado)"
                value={business.whatsappNumber}
                onChange={(e) => setBusiness({ ...business, whatsappNumber: e.target.value })}
                placeholder="+52 618 123 4567"
              />
            </div>
          )}

          {/* Paso 2: plan */}
          {step === 1 && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-fg">Elige tu plan</h2>
              {loadingPlans ? (
                <div className="flex justify-center py-10">
                  <Spinner className="text-brand-600" />
                </div>
              ) : (
                <PlanCards plans={plans} selectedKey={planKey} onSelect={setPlanKey} ctaLabel="Seleccionar" />
              )}
              <p className="mt-4 text-center text-xs text-subtle">
                El plan Free se activa al instante. Los planes de pago usan Stripe en modo prueba
                (tarjeta de test 4242 4242 4242 4242).
              </p>
            </div>
          )}

          {/* Paso 3: bot */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-fg">Configura tu bot</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nombre del bot"
                  value={bot.botName}
                  onChange={(e) => setBot({ ...bot, botName: e.target.value })}
                  placeholder="Ej. Asistente Herrera"
                />
                {limits.tone ? (
                  <Select label="Tono" value={bot.tone} onChange={(e) => setBot({ ...bot, tone: e.target.value })}>
                    {TONES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input label="Tono" value="Neutral (plan Free)" disabled />
                )}
                <Input
                  label="Horario de atención"
                  value={bot.hours}
                  onChange={(e) => setBot({ ...bot, hours: e.target.value })}
                  placeholder="Lun-Vie 9:00-18:00"
                />
                <Input
                  label="Ubicación"
                  value={bot.location}
                  onChange={(e) => setBot({ ...bot, location: e.target.value })}
                  placeholder="Centro, Durango"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-fg">
                    Preguntas frecuentes (hasta {faqMax})
                  </span>
                  <Button size="sm" variant="secondary" onClick={addFaq} disabled={faqs.length >= faqMax}>
                    <Icon name="plus" size={16} />
                    Agregar
                  </Button>
                </div>
                <div className="space-y-3">
                  {faqs.slice(0, faqMax).map((faq, i) => (
                    <div key={i} className="rounded-lg border border-line p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted">FAQ {i + 1}</span>
                        {faqs.length > 1 && (
                          <button
                            onClick={() => removeFaq(i)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Pregunta (ej. ¿Cuánto cuesta una consulta?)"
                          value={faq.question}
                          onChange={(e) => updateFaq(i, 'question', e.target.value)}
                        />
                        <Textarea
                          rows={2}
                          placeholder="Respuesta"
                          value={faq.answer}
                          onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || submitting}
            >
              Atrás
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continuar
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={submitting}>
                {submitting
                  ? isFree
                    ? 'Activando…'
                    : 'Abriendo pago…'
                  : isFree
                    ? 'Activar gratis'
                    : 'Ir a pagar'}
                {!submitting && <Icon name={isFree ? 'check' : 'card'} size={18} />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pago embebido del plan (sin salir del sitio). Usuario nuevo: sin tarjeta guardada. */}
      {checkout && (
        <CheckoutDialog
          open={Boolean(checkout)}
          onClose={() => setCheckout(null)}
          kind={checkout.kind}
          planKey={checkout.planKey}
          itemName={checkout.itemName}
          amountMXN={checkout.amountMXN}
          onboarding={checkout.onboarding}
          savedCard={null}
          onSuccess={onPaidSuccess}
        />
      )}
    </div>
  );
}
