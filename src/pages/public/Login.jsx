import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Button, Input, Alert, PasswordInput } from '../../components/ui/index.jsx';
import { useForm, v } from '../../lib/useForm.js';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { GoogleButton } from '../../components/auth/GoogleButton.jsx';
import { OtpForm } from '../../components/auth/OtpForm.jsx';
import { ContextChooser } from '../../components/auth/ContextChooser.jsx';
import { useSeo } from '../../lib/seo.js';
import { PAGE_SEO } from '../../content/pages.js';
import { Icon } from '../../components/ui/Icon.jsx';
import { passkeysSupported, PasskeyCancelled } from '../../lib/passkeys.js';

export default function Login() {
  useSeo(PAGE_SEO.login);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const passkeyLogin = useAuthStore((s) => s.passkeyLogin);
  const [canPasskey] = useState(() => passkeysSupported());
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const pendingContext = useAuthStore((s) => s.pendingContext);
  const f = useForm(
    { email: '', password: '' },
    {
      email: v.compose(v.required('Escribe tu correo'), v.email()),
      password: v.required('Escribe tu contraseña'),
    }
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Paso pendiente: 2FA de login o verificación de correo (registrado sin verificar).
  const [pending, setPending] = useState(null); // { mode, email, devCode? }

  // Preserva la ruta COMPLETA de origen (incluye ?token=… de una invitación).
  // Solo rutas internas: nada de `//dominio` ni `/\dominio` (redirección abierta).
  const fromState = location.state?.from;
  const fromPath = fromState ? `${fromState.pathname || ''}${fromState.search || ''}` : '';
  const from = /^\/(?![/\\])/.test(fromPath) ? fromPath : '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!f.validate()) return;
    setLoading(true);
    try {
      const res = await login(f.values);
      if (res.needsContext) {
        // El selector se muestra solo (estado del store).
      } else if (res.needs2fa) {
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

  async function enterWithPasskey() {
    setError('');
    setPasskeyBusy(true);
    try {
      const r = await passkeyLogin();
      if (!r?.needsContext) navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof PasskeyCancelled) return;
      setError(err.response?.data?.message || err.message || 'No se pudo entrar con tu llave de acceso.');
    } finally {
      setPasskeyBusy(false);
    }
  }

  // Tiene su negocio y además colabora en otros: elige a dónde entrar.
  if (pendingContext) {
    return (
      <AuthLayout
        title={pendingContext.name ? `Hola, ${pendingContext.name.split(' ')[0]}` : '¿A dónde quieres entrar?'}
        subtitle="Elige si entras como dueño de tu negocio o a un proyecto donde colaboras"
      >
        <ContextChooser onDone={() => navigate(from, { replace: true })} />
      </AuthLayout>
    );
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
      {canPasskey && (
        <Button type="button" variant="secondary" size="lg" className="mb-3 w-full" onClick={enterWithPasskey} disabled={passkeyBusy}>
          <Icon name="shieldCheck" size={18} />
          {passkeyBusy ? 'Esperando tu dispositivo…' : 'Entrar con huella, cara o PIN'}
        </Button>
      )}
      <GoogleButton
        onSuccess={() => navigate(from, { replace: true })}
        onError={(e) => setError(e.response?.data?.message || 'No se pudo entrar con Google.')}
      />
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <Input
          label="Email"
          type="email"
          value={f.values.email}
          onChange={f.setField('email')}
          error={f.errors.email}
          placeholder="tu@email.com"
        />
        <PasswordInput
          label="Contraseña"
          value={f.values.password}
          onChange={f.setField('password')}
          error={f.errors.password}
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
