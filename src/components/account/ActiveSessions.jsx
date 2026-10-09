import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints.js';
import { useAuthStore } from '../../store/authStore.js';
import { confirm } from '../../store/confirmStore.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Spinner, Notice } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

const ago = (d) => {
  const min = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 2) return 'Activa ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const days = Math.round(h / 24);
  return days === 1 ? 'Ayer' : `Hace ${days} días`;
};

const iconFor = (os = '') => (/iPhone|Android/.test(os) ? 'phone' : 'monitor');

/**
 * Perfil → Seguridad → Sesiones activas. Cada navegador donde iniciaste sesión es
 * una sesión: puedes cerrar una (si no la reconoces) o todas las demás. Cerrar
 * una sesión corta su acceso en segundos (se revoca en el servidor).
 */
export function ActiveSessions() {
  const navigate = useNavigate();
  const logoutLocal = useAuthStore((s) => s.logout);
  const [sessions, setSessions] = useState(null);
  const [busy, setBusy] = useState('');

  async function load() {
    try {
      const data = await authApi.sessions();
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    }
  }

  useEffect(() => {
    load();
    if (window.location.hash === '#sesiones') {
      setTimeout(() => document.getElementById('sesiones')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, []);

  async function closeOne(s) {
    const ok = await confirm({
      title: s.current ? 'Cerrar esta sesión' : 'Cerrar sesión',
      message: s.current
        ? 'Saldrás de tu cuenta en este navegador.'
        : `Se cerrará la sesión de ${s.device}${s.place ? ` (${s.place})` : ''}. Si no la reconoces, cambia también tu contraseña.`,
      tone: 'danger',
      confirmLabel: 'Cerrar sesión',
    });
    if (!ok) return;
    setBusy(s.id);
    try {
      await authApi.revokeSession(s.id);
      if (s.current) {
        await logoutLocal();
        navigate('/login', { replace: true });
        return;
      }
      toast.success('Sesión cerrada.');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cerrar la sesión.');
    } finally {
      setBusy('');
    }
  }

  async function closeOthers() {
    const ok = await confirm({
      title: 'Cerrar las demás sesiones',
      message: 'Saldrás de tu cuenta en todos los demás dispositivos. Este navegador sigue conectado.',
      tone: 'danger',
      confirmLabel: 'Cerrar las demás',
    });
    if (!ok) return;
    setBusy('others');
    try {
      const data = await authApi.revokeOtherSessions();
      toast.success(data.closed ? `Cerramos ${data.closed} ${data.closed === 1 ? 'sesión' : 'sesiones'}.` : 'No había otras sesiones abiertas.');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudieron cerrar las sesiones.');
    } finally {
      setBusy('');
    }
  }

  const others = (sessions || []).filter((s) => !s.current).length;

  return (
    <Card id="sesiones" className="scroll-mt-20">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-fg">Sesiones activas</h2>
          <p className="mt-1 text-sm text-muted">
            Dispositivos donde tu cuenta está abierta. Si ves uno que no reconoces, ciérralo y cambia tu contraseña.
          </p>
        </div>
        {others > 0 && (
          <Button size="sm" variant="secondary" onClick={closeOthers} disabled={Boolean(busy)}>
            {busy === 'others' ? 'Cerrando…' : 'Cerrar las demás'}
          </Button>
        )}
      </div>

      {sessions === null ? (
        <div className="flex justify-center py-6">
          <Spinner className="text-brand-600" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="mt-3 text-sm text-subtle">No hay sesiones registradas todavía.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface2 text-muted">
                <Icon name={iconFor(s.os)} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                  {s.device}
                  {s.current && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      Este dispositivo
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-subtle">
                  {[s.context, s.place, s.current ? 'Activa ahora' : ago(s.lastUsedAt)].filter(Boolean).join(' · ')}
                  {' · '}Inició {new Date(s.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => closeOne(s)}
                disabled={Boolean(busy)}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
              >
                {busy === s.id ? 'Cerrando…' : 'Cerrar'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Notice variant="security" className="mt-3">
Como dueño la sesión se cierra tras 3 días sin uso; como colaborador, tras 7; y siempre a los 30 días como
          máximo. Te avisamos por correo cuando alguien entra desde un dispositivo nuevo.
</Notice>
    </Card>
  );
}
