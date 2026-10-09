import { useEffect, useState } from 'react';
import { authApi } from '../../api/endpoints.js';
import { useStepUpStore } from '../../store/stepUpStore.js';
import { Modal } from '../ui/Modal.jsx';
import { Button, Input, PasswordInput, Notice } from '../ui/index.jsx';

/**
 * Diálogo "Confirma que eres tú". Pide la contraseña o, si la cuenta entra con
 * Google (o el proyecto exige un segundo factor), un código por correo. Vale 10
 * minutos: dentro de ese tiempo no se vuelve a pedir.
 */
export function StepUpDialog() {
  const { open, mfaOnly, done, cancel } = useStepUpStore();
  const [mode, setMode] = useState('password'); // password | code
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setCode('');
    setError('');
    setSent(false);
    setMode(mfaOnly ? 'code' : 'password');
    if (mfaOnly) sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function sendCode() {
    setError('');
    try {
      await authApi.stepUpCode();
      setSent(true);
    } catch (err) {
      // 429: ya se envió uno hace poco; el anterior sigue sirviendo.
      if (err.response?.status === 429) setSent(true);
      else setError(err.response?.data?.message || 'No se pudo enviar el código.');
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authApi.stepUp(mode === 'code' ? { code: code.trim() } : { password });
      done();
    } catch (err) {
      const c = err.response?.data?.details?.code;
      if (c === 'USE_CODE') {
        setMode('code');
        await sendCode();
      } else {
        setError(err.response?.data?.message || 'No se pudo confirmar.');
      }
    } finally {
      setBusy(false);
    }
  }

  function useCode() {
    setMode('code');
    if (!sent) sendCode();
  }

  return (
    <Modal open={open} onClose={cancel} title="Confirma que eres tú" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">
          {mfaOnly
            ? 'Este proyecto exige verificación en dos pasos. Escribe el código que te enviamos por correo.'
            : 'Por seguridad, confirma tu identidad antes de este cambio. No te lo volveremos a pedir en los próximos 10 minutos.'}
        </p>

        {error && <Notice variant="error">{error}</Notice>}

        {mode === 'password' ? (
          <PasswordInput
            autoFocus
            label="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        ) : (
          <div className="space-y-2">
            {sent && <Notice variant="info">Te enviamos un código de 6 dígitos a tu correo.</Notice>}
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
            <button type="button" onClick={sendCode} className="text-xs font-medium text-brand-600 hover:underline">
              Reenviar código
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {mode === 'password' && !mfaOnly ? (
            <button type="button" onClick={useCode} className="text-xs font-medium text-muted hover:text-fg hover:underline">
              Prefiero un código por correo
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={cancel} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || (mode === 'password' ? !password : code.length !== 6)}>
              {busy ? 'Confirmando…' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
