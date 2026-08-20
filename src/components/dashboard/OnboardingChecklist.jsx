import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { botConfigApi, chatApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { Card } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

const DISMISS_KEY = 'renbotia:checklistDismissed';

/**
 * Checklist de "primeros pasos" para cuentas nuevas: el primer vistazo al panel
 * define si el cliente confía. En vez de una pantalla vacía, le mostramos qué
 * hacer para poner su bot en marcha. Se oculta al completarse o si lo cierra.
 */
export function OnboardingChecklist() {
  const business = useBusinessStore((s) => s.business);
  const [loading, setLoading] = useState(true);
  const [hasFaqs, setHasFaqs] = useState(false);
  const [hasChats, setHasChats] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    Promise.all([botConfigApi.get(), chatApi.list()])
      .then(([cfg, chatsData]) => {
        setHasFaqs((cfg.botConfig?.faqs || []).length > 0);
        setHasChats((chatsData.chats || []).length > 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* sin persistencia: se oculta en esta sesión */
    }
    setDismissed(true);
  }

  const steps = [
    {
      done: hasFaqs,
      title: 'Entrena tu bot',
      desc: 'Agrega tus FAQs, tono e información del negocio.',
      to: '/dashboard/entrenamiento',
      icon: 'academic',
    },
    {
      done: hasChats,
      title: 'Pruébalo en el simulador',
      desc: 'Escríbele como un cliente y ajusta sus respuestas.',
      to: '/dashboard/simulador',
      icon: 'message',
    },
    {
      done: Boolean(business?.whatsappVerified),
      title: 'Verifica tu número de WhatsApp',
      desc: 'Confirma que el número es tuyo para dejarlo listo.',
      to: '/dashboard/perfil',
      icon: 'card',
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  // No mostrar mientras carga, si ya completó todo, o si lo cerró.
  if (loading || dismissed || doneCount === steps.length) return null;

  return (
    <Card className="border-brand-200 dark:border-brand-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-fg">Pon tu bot en marcha</h2>
          <p className="mt-0.5 text-sm text-muted">
            {doneCount} de {steps.length} pasos completados.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="rounded-lg p-1 text-subtle transition hover:bg-surface2 hover:text-fg"
          aria-label="Ocultar"
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.title}>
            <Link
              to={s.to}
              className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                s.done
                  ? 'border-line bg-surface2/40'
                  : 'border-line hover:border-brand-400 hover:bg-surface2/60'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  s.done ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-600'
                }`}
              >
                <Icon name={s.done ? 'check' : s.icon} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${s.done ? 'text-muted line-through' : 'text-fg'}`}>
                  {s.title}
                </span>
                {!s.done && <span className="block text-xs text-muted">{s.desc}</span>}
              </span>
              {!s.done && <Icon name="chevronRight" size={18} className="shrink-0 text-subtle" />}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
