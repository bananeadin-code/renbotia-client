import { useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { Button, Input, Notice } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * "¿A dónde quieres entrar?" — tras iniciar sesión, si la persona tiene su negocio
 * y además colabora en otros, elige el contexto. Cada uno abre una sesión
 * independiente y limitada a ese negocio. Si el proyecto exige verificación en
 * dos pasos, pide el código que llega por correo.
 *
 * @param {{ onDone: () => void }} props
 */
export function ContextChooser({ onDone }) {
  const pending = useAuthStore((s) => s.pendingContext);
  const selectContext = useAuthStore((s) => s.selectContext);
  const clearPending = useAuthStore((s) => s.clearPendingContext);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [codeFor, setCodeFor] = useState(null); // contexto que pidió código
  const [code, setCode] = useState('');

  if (!pending) return null;
  const owner = pending.contexts.filter((c) => c.kind === 'owner');
  const member = pending.contexts.filter((c) => c.kind === 'member');

  async function choose(c, withCode) {
    setBusy(c.businessId);
    setError('');
    try {
      const r = await selectContext(c.businessId, withCode);
      if (r.needsCode) {
        setCodeFor(c);
        setCode('');
        return;
      }
      onDone();
    } catch (err) {
      const reason = err.response?.data?.details?.code;
      if (reason === 'CONTEXT_EXPIRED' || reason === 'CONTEXT_USED') {
        setError('Pasó mucho tiempo. Vuelve a iniciar sesión.');
      } else {
        setError(err.response?.data?.message || 'No se pudo entrar.');
      }
    } finally {
      setBusy('');
    }
  }

  const Option = ({ c }) => (
    <button
      type="button"
      onClick={() => choose(c)}
      disabled={Boolean(busy)}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left transition hover:border-brand-400 disabled:opacity-60"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-bold ${
          c.kind === 'owner' ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300' : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
        }`}
      >
        {c.photo ? <img src={c.photo} alt="" className="h-full w-full object-cover" /> : c.name?.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg">{c.name}</span>
        <span className="block text-xs text-subtle">
          {c.kind === 'owner' ? 'Dueño: pagos, equipo y conexiones' : c.roleName ? `Tu rol: ${c.roleName}` : 'Colaboras con el rol que te dio el dueño'}
          {c.requireTeam2fa ? ' · pide código' : ''}
        </span>
      </span>
      {busy === c.businessId ? (
        <span className="text-xs text-muted">Entrando…</span>
      ) : (
        <Icon name="chevronRight" size={16} className="shrink-0 text-subtle" />
      )}
    </button>
  );

  if (codeFor) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          choose(codeFor, code.trim());
        }}
        className="space-y-4"
      >
        <Notice variant="security">
          <strong>{codeFor.name}</strong> exige verificación en dos pasos. Escribe el código de 6 dígitos que te
          enviamos por correo.
        </Notice>
        {error && <Notice variant="error">{error}</Notice>}
        <Input
          autoFocus
          label="Código"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          autoComplete="one-time-code"
        />
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setCodeFor(null)} className="text-sm font-medium text-muted hover:text-fg">
            Volver
          </button>
          <Button type="submit" disabled={code.length !== 6 || Boolean(busy)}>
            {busy ? 'Verificando…' : 'Entrar'}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {error && <Notice variant="error">{error}</Notice>}
      {owner.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Tu negocio</p>
          {owner.map((c) => (
            <Option key={c.businessId} c={c} />
          ))}
        </div>
      )}
      {member.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Proyectos donde colaboras</p>
          {member.map((c) => (
            <Option key={c.businessId} c={c} />
          ))}
        </div>
      )}
      <Notice variant="security">
        Cada opción abre una sesión aparte. Puedes cambiar después desde el selector de proyecto; para entrar como
        dueño te pediremos confirmar que eres tú.
      </Notice>
      <button type="button" onClick={clearPending} className="w-full text-center text-sm font-medium text-muted hover:text-fg">
        Usar otra cuenta
      </button>
    </div>
  );
}
