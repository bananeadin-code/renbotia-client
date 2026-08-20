import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { membersApi } from '../../api/endpoints.js';
import { useAuthStore } from '../../store/authStore.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { Button, Alert, Spinner } from '../../components/ui/index.jsx';
import { Logo } from '../../components/ui/Logo.jsx';
import { Icon } from '../../components/ui/Icon.jsx';

const INVITE_KEY = 'renbotia:inviteToken';

/**
 * Aceptar una invitación a colaborar. Si el usuario está autenticado, acepta al
 * instante; si no, guarda el token y lo manda a iniciar sesión / crear cuenta con
 * el correo invitado (al volver, se acepta solo).
 */
export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadBusiness = useBusinessStore((s) => s.load);

  const [status, setStatus] = useState('idle'); // idle | working | done | error | needAuth
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus('error');
      setMessage('El enlace de invitación no es válido.');
      return;
    }
    if (!isAuthenticated) {
      // Guarda el token para retomar tras autenticarse.
      try {
        localStorage.setItem(INVITE_KEY, token);
      } catch {
        /* noop */
      }
      setStatus('needAuth');
      return;
    }

    setStatus('working');
    membersApi
      .accept(token)
      .then(async (res) => {
        try {
          localStorage.removeItem(INVITE_KEY);
        } catch {
          /* noop */
        }
        await loadBusiness();
        setMessage(`Te uniste a ${res.businessName || 'el negocio'}.`);
        setStatus('done');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'No se pudo aceptar la invitación.');
      });
  }, [token, isAuthenticated, loadBusiness]);

  const here = `/aceptar-invitacion?token=${token}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="mb-6 inline-flex justify-center">
          <Logo size={32} />
        </Link>
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-card">
          {status === 'working' && (
            <>
              <Spinner className="mx-auto text-brand-600" />
              <p className="mt-4 text-sm text-muted">Uniéndote al negocio…</p>
            </>
          )}

          {status === 'needAuth' && (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
                <Icon name="user" size={26} />
              </span>
              <h1 className="mt-4 text-lg font-bold text-fg">Te invitaron a colaborar</h1>
              <p className="mt-1 text-sm text-muted">
                Inicia sesión o crea una cuenta <strong>con el correo al que te invitaron</strong> para
                aceptar.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link to="/login" state={{ from: { pathname: '/aceptar-invitacion', search: `?token=${token}` } }}>
                  <Button className="w-full">Iniciar sesión</Button>
                </Link>
                <Link to="/registro">
                  <Button variant="secondary" className="w-full">
                    Crear cuenta
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'done' && (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
                <Icon name="checkCircle" size={28} />
              </span>
              <h1 className="mt-4 text-lg font-bold text-fg">¡Listo!</h1>
              <p className="mt-1 text-sm text-muted">{message}</p>
              <Button className="mt-6 w-full" onClick={() => navigate('/dashboard', { replace: true })}>
                Ir al panel
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <Icon name="alert" size={26} />
              </span>
              <h1 className="mt-4 text-lg font-bold text-fg">No se pudo aceptar</h1>
              <Alert variant="error">{message}</Alert>
              <Link to="/" className="mt-6 inline-block">
                <Button variant="secondary">Ir al inicio</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
