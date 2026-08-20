import { useEffect, useState } from 'react';
import { PublicNav, PublicFooter } from '../../components/layout/PublicNav.jsx';
import { Card, Spinner } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { useSeo } from '../../lib/seo.js';

const LABELS = {
  web: 'Sitio web',
  api: 'API / Panel',
  database: 'Base de datos',
};

/** Página pública de estado del servicio. Genera confianza para un servicio 24/7. */
export default function Status() {
  useSeo({
    title: 'Estado del servicio | RenBotIA',
    description: 'Estado en tiempo real de los sistemas de RenBotIA: sitio, API y base de datos.',
    path: '/status',
  });

  const [state, setState] = useState({ loading: true, ok: false, components: {}, checkedAt: null });

  async function check() {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = await res.json();
      const components = { web: 'ok', ...(data.components || {}) };
      const ok = res.ok && Object.values(components).every((v) => v === 'ok');
      setState({ loading: false, ok, components, checkedAt: new Date() });
    } catch {
      setState({
        loading: false,
        ok: false,
        components: { web: 'ok', api: 'down', database: 'down' },
        checkedAt: new Date(),
      });
    }
  }

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const rows = ['web', 'api', 'database'];

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <div className="text-center">
          <span className="eyebrow">Estado del servicio</span>
          {state.loading ? (
            <div className="mt-6 flex justify-center">
              <Spinner className="text-brand-600" />
            </div>
          ) : (
            <>
              <div
                className={`mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full ${
                  state.ok ? 'bg-brand-500/10 text-brand-600' : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                <Icon name={state.ok ? 'checkCircle' : 'alert'} size={30} />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-fg sm:text-3xl">
                {state.ok ? 'Todos los sistemas operativos' : 'Estamos revisando un problema'}
              </h1>
              <p className="mt-2 text-sm text-muted">
                Última comprobación:{' '}
                {state.checkedAt?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </>
          )}
        </div>

        {!state.loading && (
          <Card className="mt-8 !p-0">
            <ul className="divide-y divide-line">
              {rows.map((key) => {
                const up = state.components[key] === 'ok';
                return (
                  <li key={key} className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm font-medium text-fg">{LABELS[key]}</span>
                    <span
                      className={`inline-flex items-center gap-2 text-sm font-medium ${
                        up ? 'text-brand-600' : 'text-amber-600'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${up ? 'bg-brand-500' : 'bg-amber-500'}`} />
                      {up ? 'Operativo' : 'Con problemas'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <p className="mt-6 text-center text-xs text-subtle">
          Esta página se actualiza automáticamente cada 30 segundos.
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
