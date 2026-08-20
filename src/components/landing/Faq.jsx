import { useState } from 'react';
import { Icon } from '../ui/Icon.jsx';

/**
 * Sección de preguntas frecuentes con acordeón (inspirado en la sección FAQs de
 * 21st.dev). Aporta contenido para SEO y resuelve objeciones de compra.
 */
export const FAQS = [
  {
    q: '¿Necesito saber programar para configurar el bot?',
    a: 'No. Configuras tu bot en un asistente de 3 pasos: datos del negocio, plan y preguntas frecuentes. Todo desde el panel, sin código.',
  },
  {
    q: '¿El bot responde con la información de mi negocio?',
    a: 'Sí. Entrenas al bot con tus FAQs, servicios, horarios y precios, y define su tono. Responde usando esa información como fuente de verdad.',
  },
  {
    q: '¿Se conecta a WhatsApp real?',
    a: 'En esta versión incluimos un simulador de WhatsApp para que pruebes y ajustes el bot. La conexión con WhatsApp Business API llega en una fase posterior.',
  },
  {
    q: '¿Qué pasa si se me acaban los tokens del plan?',
    a: 'Te avisamos en el panel y puedes comprar paquetes de créditos adicionales que se suman a tu balance, sin cambiar de plan.',
  },
  {
    q: '¿Puedo cambiar el tono o las respuestas después?',
    a: 'Cuando quieras. Desde el panel de entrenamiento editas FAQs, tono e información, guardas y lo pruebas al instante en el simulador.',
  },
];

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border-b border-line">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-fg">{item.q}</span>
        <Icon
          name="chevronRight"
          size={18}
          className={`shrink-0 text-brand-600 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${
          open ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-muted">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-fg">Preguntas frecuentes</h2>
          <p className="mt-3 text-muted">Lo que suelen preguntarnos antes de empezar.</p>
        </div>
        <div className="mt-10">
          {FAQS.map((item, i) => (
            <FaqItem key={i} item={item} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
