import { useState } from 'react';
import { membersApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Card, Spinner, Notice } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

const ago = (d) => {
  const min = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 2) return 'activa ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
};

/**
 * Seguridad del equipo (solo dueño): exigir verificación en dos pasos a los
 * colaboradores. Al activarlo se cierran las sesiones que no la verificaron.
 */
export function TeamSecurityCard({ requireTeam2fa, onChange }) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !requireTeam2fa;
    if (next) {
      const ok = await confirm({
        title: 'Exigir verificación en dos pasos',
        message:
          'Cada colaborador tendrá que confirmar con un código por correo (o entrar con Google) para abrir este negocio. Quien esté dentro sin haberlo hecho tendrá que volver a entrar.',
        confirmLabel: 'Exigir',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const r = await membersApi.setSecurity({ requireTeam2fa: next });
      onChange(next);
      toast.success(
        next
          ? `Listo. ${r.closed ? `Cerramos ${r.closed} ${r.closed === 1 ? 'sesión' : 'sesiones'} sin verificación.` : 'Tu equipo entrará con código.'}`
          : 'Ya no se exige verificación en dos pasos al equipo.'
      );
    } catch (err) {
      if (err.message !== 'cancelled') toast.error(err.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
            <Icon name="shieldCheck" size={18} />
          </span>
          <div>
            <h2 className="font-semibold text-fg">Seguridad del equipo</h2>
            <p className="mt-0.5 text-sm text-muted">
              Exige verificación en dos pasos a tus colaboradores para entrar a este negocio.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={requireTeam2fa}
          aria-label="Exigir verificación en dos pasos al equipo"
          disabled={busy}
          onClick={toggle}
          className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
            requireTeam2fa ? 'bg-brand-600' : 'bg-surface2 ring-1 ring-inset ring-line'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              requireTeam2fa ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
      <Notice variant="security" className="mt-4">
        Los cambios importantes (invitar o quitar personas, cambiar permisos, pagar, conectar canales) siempre te piden
        confirmar que eres tú.
      </Notice>
    </Card>
  );
}

/**
 * Sesiones abiertas de un colaborador en este negocio (el dueño las ve y las
 * cierra, por ejemplo si dejó la sesión abierta en una computadora compartida).
 */
export function MemberSessions({ member }) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const d = await membersApi.sessions(member.userId);
      setSessions(d.sessions || []);
    } catch {
      setSessions([]);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && sessions === null) load();
  }

  async function closeAll() {
    const ok = await confirm({
      title: 'Cerrar sesiones',
      message: `${member.name || member.email} saldrá de este negocio en todos sus dispositivos. Podrá volver a entrar con su cuenta.`,
      tone: 'danger',
      confirmLabel: 'Cerrar sesiones',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await membersApi.closeSessions(member.userId);
      toast.success(r.closed ? `Cerramos ${r.closed} ${r.closed === 1 ? 'sesión' : 'sesiones'}.` : 'No tenía sesiones abiertas.');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudieron cerrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={toggle} className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
        <Icon name="monitor" size={13} /> Sesiones
        <Icon name="chevronRight" size={12} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-line bg-surface2 p-3">
          {sessions === null ? (
            <div className="flex justify-center py-2">
              <Spinner className="text-brand-600" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-subtle">No tiene sesiones abiertas en este negocio.</p>
          ) : (
            <>
              <ul className="space-y-1.5">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-xs text-fg">
                    <Icon name={/iPhone|Android/.test(s.os) ? 'phone' : 'monitor'} size={13} className="shrink-0 text-subtle" />
                    <span className="min-w-0 flex-1 truncate">
                      {s.device}
                      <span className="text-subtle">{[s.place, ago(s.lastUsedAt)].filter(Boolean).map((x) => ` · ${x}`).join('')}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={closeAll}
                disabled={busy}
                className="mt-2.5 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
              >
                {busy ? 'Cerrando…' : 'Cerrar todas sus sesiones'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
