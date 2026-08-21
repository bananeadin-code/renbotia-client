import { useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { authApi } from '../../api/endpoints.js';
import { Button, Input, Alert } from '../ui/index.jsx';

/**
 * Formulario de código de 6 dígitos, reutilizable para:
 *  - mode="verify_email": confirmar el correo tras registrarse.
 *  - mode="login_2fa":    segundo factor al iniciar sesión (con "recordar equipo").
 *
 * @param {object} p
 * @param {string} p.email
 * @param {'verify_email'|'login_2fa'} p.mode
 * @param {(user:object)=>void} p.onVerified
 * @param {string} [p.devCode]  En desarrollo, el backend devuelve el código.
 */
export function OtpForm({ email, mode, onVerified, devCode }) {
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const verify2fa = useAuthStore((s) => s.verify2fa);

  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState('');

  const is2fa = mode === 'login_2fa';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = is2fa
        ? await verify2fa(email, code.trim(), remember)
        : await verifyEmail(email, code.trim());
      onVerified(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Código incorrecto o expirado.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError('');
    setResent('');
    try {
      const res = await authApi.resendCode({ email, purpose: mode });
      setResent('Te enviamos un nuevo código.');
      if (res?.devCode) setCode(res.devCode); // solo en desarrollo
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo reenviar el código.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        {is2fa
          ? 'Por seguridad, escribe el código de 6 dígitos que enviamos a '
          : 'Para confirmar tu correo, escribe el código de 6 dígitos que enviamos a '}
        <span className="font-medium text-fg">{email}</span>.
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      {resent && <Alert variant="success">{resent}</Alert>}
      {devCode && (
        <Alert variant="info">Modo desarrollo · código: <b>{devCode}</b></Alert>
      )}
      <Input
        label="Código de verificación"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
      />
      {is2fa && (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
          />
          Recordar este dispositivo (60 días)
        </label>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={loading || code.length !== 6}>
        {loading ? 'Verificando…' : 'Verificar'}
      </Button>
      <button
        type="button"
        onClick={resend}
        className="w-full text-center text-sm font-medium text-brand-600 hover:underline"
      >
        Reenviar código
      </button>
    </form>
  );
}
