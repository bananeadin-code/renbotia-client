import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints.js';
import { Button, Input, Alert } from '../../components/ui/index.jsx';
import { Logo } from '../../components/ui/Logo.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';

/**
 * Solicitud de restablecimiento: el usuario escribe su email y le enviamos un
 * enlace real (por Resend) que abre la página /restablecer para fijar la nueva
 * contraseña. En desarrollo, si el backend devuelve el token, mostramos el
 * enlace directo para probar sin correo.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.forgotPassword(email);
      if (data?.resetToken) setDevLink(`/restablecer?token=${data.resetToken}`);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error');
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

          {!sent ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <p className="text-sm text-muted">
                Escribe tu email y te enviaremos un enlace para restablecer tu contraseña.
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
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <Alert variant="success">
                Si el email existe, te enviamos un enlace para restablecer tu contraseña. Revisa tu
                bandeja (y la carpeta de spam).
              </Alert>
              {devLink && (
                <Alert variant="info">
                  Modo desarrollo:{' '}
                  <Link to={devLink} className="font-semibold text-brand-600 hover:underline">
                    abrir enlace de restablecimiento
                  </Link>
                </Alert>
              )}
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
