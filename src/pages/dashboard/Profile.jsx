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
  const { user } = useAuthStore();
  const { business } = useBusinessStore();

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
      const data = await authApi.forgotPassword(user.email);
      setPwMsg(
        data?.resetToken
          ? 'Se generó un enlace de recuperación (simulado). Ve a "Recuperar contraseña" para fijar una nueva.'
          : 'Se generó un enlace de recuperación (simulado).'
      );
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" value={user?.name || ''} disabled />
          <Input label="Email" value={user?.email || ''} disabled />
        </div>
        <p className="mt-3 text-xs text-subtle">
          La edición del nombre/email se habilitará más adelante. Rol actual:{' '}
          <span className="font-medium">{user?.role}</span>.
        </p>
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

      {/* Contraseña */}
      <Card>
        <h2 className="mb-2 font-semibold text-fg">Contraseña</h2>
        <p className="text-sm text-muted">
          Iniciamos un flujo de cambio de contraseña (simulado, sin email real).
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
