import { useEffect, useState } from 'react';
import { authApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Card, Button, Notice, Spinner } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';
import { createPasskey, passkeysSupported, PasskeyCancelled } from '../../lib/passkeys.js';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/**
 * Perfil → Llaves de acceso. Opcional: entrar con huella, cara o PIN, más
 * rápido que contraseña + código y a prueba de correos falsos.
 */
export function PasskeysCard({ onChange }) {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(false);
  const supported = passkeysSupported();

  async function load() {
    try {
      const { passkeys } = await authApi.passkeys();
      setList(passkeys);
      onChange?.(passkeys);
    } catch {
      setList([]);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    setBusy(true);
    try {
      const { passkeys } = await createPasskey();
      setList(passkeys);
      onChange?.(passkeys);
      toast.success('Listo. La próxima vez entra con tu huella, cara o PIN.');
    } catch (err) {
      if (err instanceof PasskeyCancelled || err.message === 'cancelled') return;
      toast.error(err.response?.data?.message || err.message || 'No se pudo agregar la llave.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(pk) {
    const ok = await confirm({
      title: 'Quitar llave de acceso',
      message: `"${pk.name}" ya no podrá entrar con huella o PIN. Podrás seguir entrando con tu contraseña.`,
      tone: 'danger',
      confirmLabel: 'Quitar',
    });
    if (!ok) return;
    try {
      const { passkeys } = await authApi.deletePasskey(pk.id);
      setList(passkeys);
      onChange?.(passkeys);
      toast.success('Llave quitada.');
    } catch (err) {
      if (err.message !== 'cancelled') toast.error(err.response?.data?.message || 'No se pudo quitar.');
    }
  }

  return (
    <Card id="llaves">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-fg">Llaves de acceso</h2>
          <p className="mt-0.5 max-w-prose text-sm text-muted">
            Entra con la huella, la cara o el PIN de tu dispositivo, sin escribir contraseña ni esperar el código. Solo funciona en
            renbotia.com, así que un sitio falso no puede usarla.
          </p>
        </div>
        {supported && (
          <Button size="sm" onClick={add} disabled={busy}>
            <Icon name="plus" size={15} /> {busy ? 'Esperando tu dispositivo…' : 'Agregar llave'}
          </Button>
        )}
      </div>

      {!supported && (
        <Notice variant="info" className="mt-4">
          Este navegador no admite llaves de acceso. Ábrelo desde Chrome, Safari o Edge actualizados para agregar una.
        </Notice>
      )}

      <div className="mt-4">
        {list === null ? (
          <Spinner className="text-brand-600" />
        ) : list.length === 0 ? (
          <p className="text-sm text-subtle">Aún no tienes llaves. Es opcional: puedes seguir entrando con tu contraseña como siempre.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {list.map((pk) => (
              <li key={pk.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                  <Icon name="shieldCheck" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{pk.name}</p>
                  <p className="text-xs text-subtle">
                    Agregada el {fmt(pk.createdAt)}
                    {pk.lastUsedAt ? ` · usada el ${fmt(pk.lastUsedAt)}` : ' · aún sin usar'}
                    {pk.synced ? ' · sincronizada en tus dispositivos' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(pk)}
                  className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500"
                  aria-label={`Quitar ${pk.name}`}
                >
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
