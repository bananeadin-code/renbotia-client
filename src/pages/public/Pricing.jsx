import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { planApi } from '../../api/endpoints.js';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { PlanCards } from '../../components/PlanCards.jsx';
import { SupportWidget } from '../../components/whatsapp/SupportWidget.jsx';
import { Spinner, Button } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { useSeo, SITE_URL } from '../../lib/seo.js';

const GUARANTEES = [
  { icon: 'check', text: 'Sin contratos ni permanencia' },
  { icon: 'card', text: 'Pago seguro con Stripe' },
  { icon: 'bot', text: 'Prueba gratis por uso, sin límite de días' },
];

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: 'Precios — Planes desde $0 | RenBotIA',
    description:
      'Planes simples y transparentes para tu bot de WhatsApp con IA: empieza gratis y escala a Pro o Elite según tu volumen. Sin contratos, en pesos mexicanos.',
    path: '/precios',
    image: `${SITE_URL}/og-cover.png`,
  });

  useEffect(() => {
    planApi
      .list()
      .then((data) => setPlans(data.plans))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />

      {/* Encabezado */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-6xl px-4 pb-4 pt-16 text-center sm:pt-20">
          <span className="eyebrow">Precios</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-5xl">
            Planes simples y transparentes
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Elige según cuántas conversaciones atiende tu bot al mes. Cambia o cancela cuando
            quieras.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16">
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="text-brand-600" />
            </div>
          ) : (
            <PlanCards plans={plans} />
          )}
        </div>

        {/* Garantías */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {GUARANTEES.map((g) => (
            <span key={g.text} className="inline-flex items-center gap-2 text-sm text-muted">
              <Icon name={g.icon} size={16} className="text-brand-500" />
              {g.text}
            </span>
          ))}
        </div>

        {/* Créditos extra */}
        <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-line bg-surface2/50 p-6 text-center">
          <h2 className="text-lg font-bold text-fg">¿Necesitas más volumen?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Además de tu plan, puedes comprar paquetes de créditos que se suman a tu balance y no
            vencen con la renovación. Págalos cuando los necesites, sin cambiar de plan.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <p className="text-muted">¿Listo para empezar?</p>
          <Link to="/registro" className="mt-3 inline-block">
            <Button size="lg" className="shine-cta">
              Crear cuenta gratis
              <Icon name="arrowRight" size={18} />
            </Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
      <SupportWidget />
    </div>
  );
}
