import { useState } from 'react';
import { authApi } from '../../api/endpoints.js';
import { useAuthStore } from '../../store/authStore.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { businessApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { WhatsAppVerification } from '../../components/business/WhatsAppVerification.jsx';
import { ActivityLog } from '../../components/business/ActivityLog.jsx';
import { Card, Button, Input, Select, Alert } from '../../components/ui/index.jsx';

const INDUSTRIES = [
  { value: 'legal', label: 'Despacho legal' },
  { value: 'contable', label: 'Contable / fiscal' },
  { value: 'consultoria', label: 'Consultoría' },
  { value: 'agencia', label: 'Agencia' },
  { value: 'otro', label: 'Otro' },
];

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const { business } = useBusinessStore();

  // Datos personales (nombre editable)
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  async function saveName(e) {
    e.preventDefault();
    setSavingName(true);
    try {
      const { user: updated } = await authApi.updateProfile(name.trim());
      updateUser({ name: updated.name });
      toast.success('Nombre actualizado.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar.');
    } finally {
      setSavingName(false);
    }
  }

  // Verificación en dos pasos (2FA por correo)
  const [twoFA, setTwoFA] = useState(Boolean(user?.twoFactorEnabled));
  const [savingTwoFA, setSavingTwoFA] = useState(false);

  async function toggleTwoFA(next) {
    const prev = twoFA;
    setTwoFA(next); // optimista
    setSavingTwoFA(true);
    try {
      const { user: updated } = await authApi.setTwoFactor(next);
      updateUser({ twoFactorEnabled: updated.twoFactorEnabled });
      toast.success(next ? 'Verificación en dos pasos activada.' : 'Verificación en dos pasos desactivada.');
    } catch (err) {
      setTwoFA(prev); // revertir si falla
      toast.error(err.response?.data?.message || 'No se pudo actualizar.');
    } finally {
      setSavingTwoFA(false);
    }
  }

  // Datos del negocio
  const [biz, setBiz] = useState({
    name: business?.name || '',
    industry: business?.industry || 'otro',
  });
  const [bizMsg, setBizMsg] = useState('');
  const [bizErr, setBizErr] = useState('');
  const [savingBiz, setSavingBiz] = useState(false);

  // Cambio de contraseña (flujo simulado vía forgot/reset)
  const [pwMsg, setPwMsg] = useState('');

  async function saveBusiness(e) {
    e.preventDefault();
    setBizMsg('');
    setBizErr('');
    setSavingBiz(true);
    try {
      const { business: updated } = await businessApi.update(biz);
      useBusinessStore.setState({ business: updated });
      setBizMsg('Datos del negocio actualizados.');
      toast.success('Datos del negocio actualizados.');
    } catch (err) {
      setBizErr(err.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSavingBiz(false);
    }
  }

  async function requestPasswordChange() {
    setPwMsg('');
    try {
      await authApi.forgotPassword(user.email);
      setPwMsg('Te enviamos un enlace a tu correo para elegir una nueva contraseña.');
    } catch {
      setPwMsg('No se pudo iniciar el cambio de contraseña.');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-fg">Perfil</h1>

      {/* Datos personales */}
      <Card>
        <h2 className="mb-4 font-semibold text-fg">Datos personales</h2>
        <form onSubmit={saveName} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
            <Input label="Email" value={user?.email || ''} disabled />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-subtle">
              El correo es tu identidad de acceso y no se cambia por aquí. Rol:{' '}
              <span className="font-medium">{user?.role}</span>.
            </p>
            <Button
              type="submit"
              disabled={savingName || !name.trim() || name.trim() === (user?.name || '')}
            >
              {savingName ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Datos del negocio */}
      <Card>
        <h2 className="mb-4 font-semibold text-fg">Datos del negocio</h2>
        {bizMsg && (
          <div className="mb-3">
            <Alert variant="success">{bizMsg}</Alert>
          </div>
        )}
        {bizErr && (
          <div className="mb-3">
            <Alert variant="error">{bizErr}</Alert>
          </div>
        )}
        <form onSubmit={saveBusiness} className="space-y-4">
          <Input label="Nombre del negocio" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
          <Select label="Rubro" value={biz.industry} onChange={(e) => setBiz({ ...biz, industry: e.target.value })}>
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-subtle">
            El sector y las FAQs se editan a detalle en{' '}
            <span className="font-medium">Entrenamiento</span>.
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingBiz}>
              {savingBiz ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Número de WhatsApp + verificación de propiedad */}
      <WhatsAppVerification />

      {/* Bitácora de auditoría */}
      <ActivityLog />

      {/* Seguridad: verificación en dos pasos */}
      <Card>
        <h2 className="mb-1 font-semibold text-fg">Verificación en dos pasos</h2>
        <p className="mb-4 text-sm text-muted">
          Al iniciar sesión con correo y contraseña te pediremos un código de 6 dígitos enviado a tu
          correo. (No aplica al entrar con Google.)
        </p>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface2 px-4 py-3">
          <span className="text-sm font-medium text-fg">{twoFA ? 'Activada' : 'Desactivada'}</span>
          <button
            type="button"
            role="switch"
            aria-checked={twoFA}
            aria-label="Verificación en dos pasos"
            disabled={savingTwoFA}
            onClick={() => toggleTwoFA(!twoFA)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
              twoFA ? 'bg-brand-600' : 'border border-line bg-canvas'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                twoFA ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Contraseña */}
      <Card>
        <h2 className="mb-2 font-semibold text-fg">Contraseña</h2>
        <p className="text-sm text-muted">
          Te enviaremos un enlace a tu correo para elegir una nueva contraseña.
        </p>
        {pwMsg && (
          <div className="mt-3">
            <Alert variant="info">{pwMsg}</Alert>
          </div>
        )}
        <div className="mt-4">
          <Button variant="secondary" onClick={requestPasswordChange}>
            Cambiar contraseña
          </Button>
        </div>
      </Card>
    </div>
  );
}
