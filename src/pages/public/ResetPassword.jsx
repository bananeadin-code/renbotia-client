import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/endpoints.js';
import { Button, Input, Alert } from '../../components/ui/index.jsx';
import { Logo } from '../../components/ui/Logo.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';

/**
 * Página a la que llega el enlace del correo: /restablecer?token=…
 * El usuario escribe la nueva contraseña y la repite. Al confirmar, se fija y
 * puede iniciar sesión.
 */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mismatch = password2.length > 0 && password !== password2;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'El enlace es inválido o expiró. Solicita uno nuevo.');
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
          <h1 className="text-xl font-bold text-fg">Nueva contraseña</h1>

          {!token ? (
            <div className="mt-6 space-y-4">
              <Alert variant="error">
                Falta el token del enlace. Abre el enlace desde tu correo o solicita uno nuevo.
              </Alert>
              <Link to="/recuperar">
                <Button size="lg" className="w-full">
                  Solicitar enlace
                </Button>
              </Link>
            </div>
          ) : done ? (
            <div className="mt-6 space-y-4">
              <Alert variant="success">Tu contraseña se actualizó correctamente.</Alert>
              <Link to="/login">
                <Button size="lg" className="w-full">
                  Ir a iniciar sesión
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <p className="text-sm text-muted">Elige una nueva contraseña para tu cuenta.</p>
              {error && <Alert variant="error">{error}</Alert>}
              <Input
                label="Nueva contraseña"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <div>
                <Input
                  label="Repetir contraseña"
                  type="password"
                  required
                  minLength={8}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Vuelve a escribir la contraseña"
                />
                {mismatch && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Las contraseñas no coinciden.
                  </p>
                )}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading || mismatch}>
                {loading ? 'Guardando…' : 'Cambiar contraseña'}
              </Button>
            </form>
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
