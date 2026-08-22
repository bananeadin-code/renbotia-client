import { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { waitlistApi } from '../api/endpoints.js';
import { Button, Input } from './ui/index.jsx';

/**
 * Botón "Avísame cuando esté" para los planes de pago mientras no se pueden
 * comprar. Guarda el correo en la lista de espera. Prellena el correo del usuario
 * si tiene sesión iniciada.
 */
export function WaitlistButton({ planKey, planName }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await waitlistApi.join(email.trim(), planKey);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2.5 text-center text-sm font-medium text-brand-700 dark:text-brand-300">
        ¡Listo! Te avisamos cuando {planName || 'este plan'} esté disponible.
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" className="mt-6 w-full" onClick={() => setOpen(true)}>
        Avísame cuando esté
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-2">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        aria-label="Correo para la lista de espera"
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
        {loading ? 'Enviando…' : 'Avisarme'}
      </Button>
    </form>
  );
}
