import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Button, Input, Alert } from '../../components/ui/index.jsx';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { GoogleButton } from '../../components/auth/GoogleButton.jsx';
import { OtpForm } from '../../components/auth/OtpForm.jsx';
import { useSeo } from '../../lib/seo.js';

export default function Login() {
  useSeo({ title: 'Inicia sesión | RenBotIA', description: 'Entra a tu panel de RenBotIA.', path: '/login' });
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Paso pendiente: 2FA de login o verificación de correo (registrado sin verificar).
  const [pending, setPending] = useState(null); // { mode, email, devCode? }

  // Preserva la ruta COMPLETA de origen (incluye ?token=… de una invitación).
  const fromState = location.state?.from;
  const from = fromState
    ? `${fromState.pathname}${fromState.search || ''}`
    : '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      if (res.needs2fa) {
        setPending({ mode: 'login_2fa', email: res.email, devCode: res.devCode });
      } else if (res.needsEmailVerification) {
        setPending({ mode: 'verify_email', email: res.email, devCode: res.devCode });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  // Paso de código (2FA o verificación de correo).
  if (pending) {
    return (
      <AuthLayout
        title={pending.mode === 'login_2fa' ? 'Verificación en dos pasos' : 'Verifica tu correo'}
        subtitle="Escribe el código de 6 dígitos que enviamos a tu correo"
        footer={
          <p className="mt-6 text-center text-sm text-muted">
            <button
              onClick={() => setPending(null)}
              className="font-medium text-brand-600 hover:underline"
            >
              Volver a iniciar sesión
            </button>
          </p>
        }
      >
        <OtpForm
          email={pending.email}
          mode={pending.mode}
          devCode={pending.devCode}
          onVerified={() => navigate(from, { replace: true })}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Entra a tu panel de RenBotIA"
      footer={
        <p className="mt-6 text-center text-sm text-muted">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-medium text-brand-600 hover:underline">
            Crear cuenta
          </Link>
        </p>
      }
    >
      <GoogleButton
        onSuccess={() => navigate(from, { replace: true })}
        onError={(e) => setError(e.response?.data?.message || 'No se pudo entrar con Google.')}
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="tu@email.com"
        />
        <Input
          label="Contraseña"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="••••••••"
        />
        <div className="text-right">
          <Link to="/recuperar" className="text-sm text-brand-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  );
}
