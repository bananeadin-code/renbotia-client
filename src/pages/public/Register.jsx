import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Button, Input, Alert } from '../../components/ui/index.jsx';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { GoogleButton } from '../../components/auth/GoogleButton.jsx';
import { OtpForm } from '../../components/auth/OtpForm.jsx';
import { useSeo } from '../../lib/seo.js';

export default function Register() {
  useSeo({
    title: 'Crea tu cuenta gratis | RenBotIA',
    description: 'Crea tu cuenta y arma tu bot de WhatsApp con IA en minutos. Empieza gratis, sin tarjeta.',
    path: '/registro',
  });
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Estado pendiente de verificación de correo tras registrar.
  const [pending, setPending] = useState(null); // { email, devCode? }

  const mismatch = password2.length > 0 && form.password !== password2;

  // Tras crear/entrar la cuenta: si venía a aceptar una invitación, va a
  // aceptarla; si no, al onboarding (aún no tiene negocio propio).
  function afterAuth() {
    let inviteToken = '';
    try {
      inviteToken = localStorage.getItem('renbotia:inviteToken') || '';
    } catch {
      /* noop */
    }
    if (inviteToken) {
      navigate(`/aceptar-invitacion?token=${inviteToken}`, { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const res = await register(form);
      // El registro ya no inicia sesión: pide verificar el correo por código.
      setPending({ email: res.email || form.email, devCode: res.devCode });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  // Paso de verificación de correo (tras registrar).
  if (pending) {
    return (
      <AuthLayout
        title="Verifica tu correo"
        subtitle="Te enviamos un código de 6 dígitos para activar tu cuenta"
        footer={
          <p className="mt-6 text-center text-sm text-muted">
            ¿Correo equivocado?{' '}
            <button
              onClick={() => setPending(null)}
              className="font-medium text-brand-600 hover:underline"
            >
              Volver
            </button>
          </p>
        }
      >
        <OtpForm
          email={pending.email}
          mode="verify_email"
          devCode={pending.devCode}
          onVerified={() => afterAuth()}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Empieza a construir tu bot en minutos · gratis, sin tarjeta"
      footer={
        <p className="mt-6 text-center text-sm text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <GoogleButton
        onSuccess={afterAuth}
        onError={(e) => setError(e.response?.data?.message || 'No se pudo entrar con Google.')}
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input
          label="Nombre"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Tu nombre"
        />
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
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            placeholder="Vuelve a escribir tu contraseña"
          />
          {mismatch && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Las contraseñas no coinciden.
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading || mismatch}>
          {loading ? 'Creando…' : 'Crear cuenta'}
        </Button>
        <p className="text-center text-xs text-subtle">
          Al crear tu cuenta aceptas los{' '}
          <Link to="/terminos" className="text-brand-600 hover:underline">
            Términos
          </Link>{' '}
          y el{' '}
          <Link to="/privacidad" className="text-brand-600 hover:underline">
            Aviso de Privacidad
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
