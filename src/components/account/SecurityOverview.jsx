import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints.js';
import { Card } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

const LEVEL_STYLE = {
  muy_buena: { bar: 'bg-brand-500', text: 'text-brand-700 dark:text-brand-300', msg: 'Tu cuenta está muy bien protegida.' },
  buena: { bar: 'bg-brand-500', text: 'text-brand-700 dark:text-brand-300', msg: 'Tu cuenta está bien protegida. Puedes reforzarla si quieres.' },
  basica: { bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', msg: 'Te recomendamos un paso más para proteger tu negocio.' },
};

// Mini lecciones: lo que más protege a una cuenta en la práctica.
const TIPS = [
  {
    title: 'Nunca te pediremos tu código',
    body: 'RenBotIA jamás te pedirá tu contraseña ni el código de 6 dígitos por WhatsApp, llamada o correo. Si alguien te lo pide, es un engaño.',
  },
  {
    title: 'Revisa la dirección antes de entrar',
    body: 'Entra siempre desde renbotia.com. Un correo con un enlace parecido (renbotia-login, renb0tia) es falso. Las llaves de acceso no funcionan en sitios falsos.',
  },
  {
    title: 'Si ves algo raro, actúa en 1 minuto',
    body: 'Un acceso que no reconoces: ciérralo en "Sesiones activas" y cambia tu contraseña. Un número desconocido manejando tu bot: quítalo en Conexiones → WhatsApp.',
  },
];

const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
};

function go(href) {
  if (href.startsWith('#')) {
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  return false;
}

/** Perfil → "Tu seguridad": nivel, pasos (opcionales) y accesos recientes. */
export function SecurityOverview({ refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [openTip, setOpenTip] = useState(-1);

  useEffect(() => {
    authApi
      .security()
      .then(setData)
      .catch(() => setData(null));
  }, [refreshKey]);

  if (!data) return null;
  const style = LEVEL_STYLE[data.level.key] || LEVEL_STYLE.buena;
  const pending = data.checks.filter((c) => !c.ok);

  return (
    <Card id="seguridad">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fg text-canvas shadow-card">
          <Icon name="shieldCheck" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-fg">Tu seguridad</h2>
          <p className="text-sm text-muted">{style.msg}</p>
        </div>
        <span className={`shrink-0 text-sm font-semibold ${style.text}`}>{data.level.label}</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2" aria-hidden="true">
        <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${data.score}%` }} />
      </div>

      <ul className="mt-4 space-y-2">
        {data.checks.map((c) => {
          const inner = (
            <>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  c.ok ? 'bg-brand-500 text-white' : c.optional ? 'border border-line text-subtle' : 'bg-amber-500/15 text-amber-600'
                }`}
              >
                {c.ok ? <Icon name="check" size={12} /> : c.optional ? <Icon name="plus" size={11} /> : <Icon name="alert" size={12} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-fg">
                  {c.title}
                  {!c.ok && c.optional && <span className="text-[11px] font-normal text-subtle">opcional</span>}
                </span>
                <span className="block text-xs text-muted">{c.detail}</span>
              </span>
              {!c.ok && <Icon name="chevronRight" size={16} className="mt-0.5 shrink-0 text-subtle" />}
            </>
          );
          const cls = 'flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left';
          if (c.ok) return <li key={c.id} className={cls}>{inner}</li>;
          return (
            <li key={c.id}>
              {c.href.startsWith('#') ? (
                <button type="button" onClick={() => go(c.href)} className={`${cls} transition hover:bg-surface2`}>
                  {inner}
                </button>
              ) : (
                <Link to={c.href} className={`${cls} transition hover:bg-surface2`}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {pending.length === 0 && <p className="mt-2 px-2 text-xs text-subtle">Todo en orden. No tienes que hacer nada más.</p>}

      {data.recent.length > 0 && (
        <div className="mt-5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">Accesos recientes</p>
          <ul className="space-y-1">
            {data.recent.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted">
                <Icon name="monitor" size={13} className="shrink-0 text-subtle" />
                <span className="min-w-0 flex-1 truncate">
                  {r.device}
                  {r.place ? ` · ${r.place}` : ''}
                </span>
                <span className="shrink-0">{r.current ? 'este dispositivo' : ago(r.lastUsedAt || r.createdAt)}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => go('#sesiones')} className="mt-1.5 text-xs font-medium text-brand-600 hover:underline">
            ¿No reconoces alguno? Revisa tus sesiones
          </button>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">Consejos rápidos</p>
        <ul className="divide-y divide-line">
          {TIPS.map((t, i) => (
            <li key={t.title}>
              <button
                type="button"
                aria-expanded={openTip === i}
                onClick={() => setOpenTip(openTip === i ? -1 : i)}
                className="flex w-full items-center gap-2 py-2 text-left text-sm text-fg"
              >
                <span className="min-w-0 flex-1">{t.title}</span>
                <Icon name="chevronRight" size={15} className={`shrink-0 text-subtle transition-transform ${openTip === i ? 'rotate-90' : ''}`} />
              </button>
              {openTip === i && <p className="pb-3 text-sm text-muted">{t.body}</p>}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
