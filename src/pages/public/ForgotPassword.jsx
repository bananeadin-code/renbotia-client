import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints.js';
import { Button, Input, Alert } from '../../components/ui/index.jsx';
import { Logo } from '../../components/ui/Logo.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';

/**
 * Recuperación de contraseña SIMULADA. El backend no envía email real; en dev
 * devuelve el token de reset, que aquí mostramos para completar el flujo y
 * permitir fijar una nueva contraseña.
 */
export default function ForgotPassword() {
  const [step, setStep] = useState('request'); // request | reset | done
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.forgotPassword(email);
      // En dev el backend incluye el token para simular el enlace del email.
      if (data?.resetToken) {
        setToken(data.resetToken);
        setMsg('Email simulado: usamos el token generado para continuar (no se envió correo real).');
      } else {
        setMsg('Si el email existe, se generó un enlace de recuperación.');
      }
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Token inválido o expirado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center" aria-label="RenBotIA — inicio">
          <Logo size={32} />
        </Link>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-bold text-fg">Recuperar contraseña</h1>

          {step === 'request' && (
            <form onSubmit={handleRequest} className="mt-6 space-y-4">
              <p className="text-sm text-muted">
                Escribe tu email y te ayudamos a restablecer tu contraseña.
              </p>
              {error && <Alert variant="error">{error}</Alert>}
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Enviando…' : 'Continuar'}
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              {msg && <Alert variant="info">{msg}</Alert>}
              {error && <Alert variant="error">{error}</Alert>}
              <Input
                label="Token de recuperación"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pega aquí el token"
              />
              <Input
                label="Nueva contraseña"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Guardando…' : 'Cambiar contraseña'}
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="mt-6 space-y-4">
              <Alert variant="success">Tu contraseña se actualizó correctamente.</Alert>
              <Link to="/login">
                <Button size="lg" className="w-full">
                  Ir a iniciar sesión
                </Button>
              </Link>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/login" className="font-medium text-brand-600 hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
