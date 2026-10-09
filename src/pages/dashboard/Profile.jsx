import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints.js';
import { useAuthStore } from '../../store/authStore.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { businessApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { ConnectedChannels } from '../../components/business/ConnectedChannels.jsx';
import { ActivityLog } from '../../components/business/ActivityLog.jsx';
import { ActiveSessions } from '../../components/account/ActiveSessions.jsx';
import { Card, Button, Input, Select, Alert } from '../../components/ui/index.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { fileToAvatarDataUri } from '../../lib/image.js';
import { v } from '../../lib/useForm.js';
import { useCan } from '../../router/RequirePermission.jsx';

const INDUSTRIES = [
  { value: 'legal', label: 'Despacho legal' },
  { value: 'contable', label: 'Contable / fiscal' },
  { value: 'consultoria', label: 'Consultoría' },
  { value: 'agencia', label: 'Agencia' },
  { value: 'otro', label: 'Otro' },
];

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore();
  const { business } = useBusinessStore();
  const navigate = useNavigate();

  // Datos personales (nombre editable)
  const [name, setName] = useState(user?.name || '');
  const [nameErr, setNameErr] = useState('');
  const [savingName, setSavingName] = useState(false);

  async function saveName(e) {
    e.preventDefault();
    const msg = v.minLen(2, 'Escribe tu nombre (mínimo 2 letras).')(name.trim());
    setNameErr(msg);
    if (msg) return;
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

  // Cambio de correo (con re-verificación al correo nuevo)
  const [emailStep, setEmailStep] = useState('idle'); // idle | request | verify
  const [newEmail, setNewEmail] = useState('');
  const [newEmailErr, setNewEmailErr] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailDevCode, setEmailDevCode] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  async function requestEmailChange(e) {
    e.preventDefault();
    const msg = v.email('Escribe un correo válido.')(newEmail);
    setNewEmailErr(msg);
    if (msg) return;
    setEmailBusy(true);
    try {
      const res = await authApi.requestEmailChange(newEmail.trim());
      setEmailDevCode(res.devCode || '');
      setEmailStep('verify');
      toast.success('Te enviamos un código al correo nuevo.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo enviar el código.');
    } finally {
      setEmailBusy(false);
    }
  }

  async function confirmEmailChange(e) {
    e.preventDefault();
    setEmailBusy(true);
    try {
      const { user: updated } = await authApi.verifyEmailChange(emailCode.trim());
      updateUser({ email: updated.email });
      toast.success('Correo actualizado.');
      setEmailStep('idle');
      setNewEmail('');
      setEmailCode('');
      setEmailDevCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Código incorrecto o expirado.');
    } finally {
      setEmailBusy(false);
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
  const [bizNameErr, setBizNameErr] = useState('');
  const [savingBiz, setSavingBiz] = useState(false);
  // Datos del negocio: el dueño o un colaborador con permiso (Equipo).
  const canProfile = useCan('profile');

  // Foto/avatar del negocio: se comprime en el navegador y se guarda al momento.
  const photoInputRef = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  async function savePhoto(photo) {
    setPhotoBusy(true);
    try {
      const { business: updated } = await businessApi.update({ photo });
      useBusinessStore.setState({ business: updated });
      toast.success(photo ? 'Foto del negocio actualizada.' : 'Foto eliminada.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar la foto.');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onPhotoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;
    try {
      const dataUri = await fileToAvatarDataUri(file);
      await savePhoto(dataUri);
    } catch (err) {
      toast.error(err.message || 'No se pudo procesar la imagen.');
    }
  }

  // Cambio de contraseña (flujo simulado vía forgot/reset)
  const [pwMsg, setPwMsg] = useState('');

  async function saveBusiness(e) {
    e.preventDefault();
    setBizMsg('');
    setBizErr('');
    const msg = v.minLen(2, 'Escribe el nombre del negocio.')(biz.name.trim());
    setBizNameErr(msg);
    if (msg) return;
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

  // Eliminar cuenta (irreversible). Reautentica con contraseña; si la cuenta es
  // de Google (sin contraseña), el backend acepta la palabra "ELIMINAR".
  const [delOpen, setDelOpen] = useState(false);
  const [delPassword, setDelPassword] = useState('');
  const [delConfirm, setDelConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  function closeDelete() {
    setDelOpen(false);
    setDelPassword('');
    setDelConfirm('');
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleting(true);
    try {
      await authApi.deleteAccount({ password: delPassword, confirm: delConfirm.trim() });
      toast.success('Tu cuenta y todos tus datos fueron eliminados.');
      await logout();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar la cuenta.');
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-fg">Perfil</h1>

      {/* Datos personales */}
      <Card>
        <h2 className="mb-4 font-semibold text-fg">Datos personales</h2>
        <form onSubmit={saveName} noValidate className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameErr) setNameErr('');
            }}
            error={nameErr}
            maxLength={80}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-subtle">
              Rol: <span className="font-medium">{user?.role}</span>.
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

      {/* Correo electrónico (cambio con re-verificación) */}
      <Card>
        <h2 className="mb-1 font-semibold text-fg">Correo electrónico</h2>
        <p className="mb-4 text-sm text-muted">
          Tu correo es tu identidad de acceso. Para cambiarlo, te enviamos un código al{' '}
          <strong>correo nuevo</strong> para confirmar que es tuyo.
        </p>

        {emailStep === 'idle' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface2 px-4 py-3">
            <span className="min-w-0 truncate text-sm font-medium text-fg">{user?.email}</span>
            <Button variant="secondary" size="sm" onClick={() => setEmailStep('request')}>
              Cambiar correo
            </Button>
          </div>
        )}

        {emailStep === 'request' && (
          <form onSubmit={requestEmailChange} noValidate className="space-y-3">
            <Input
              label="Nuevo correo"
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (newEmailErr) setNewEmailErr('');
              }}
              error={newEmailErr}
              placeholder="nuevo@correo.com"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setEmailStep('idle')}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={emailBusy || !newEmail.trim()}>
                {emailBusy ? 'Enviando…' : 'Enviar código'}
              </Button>
            </div>
          </form>
        )}

        {emailStep === 'verify' && (
          <form onSubmit={confirmEmailChange} className="space-y-3">
            <p className="text-sm text-muted">
              Escribe el código de 6 dígitos que enviamos a <strong>{newEmail}</strong>.
            </p>
            {emailDevCode && (
              <Alert variant="info">
                Modo desarrollo · código: <b>{emailDevCode}</b>
              </Alert>
            )}
            <Input
              label="Código"
              inputMode="numeric"
              required
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setEmailStep('idle')}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={emailBusy || emailCode.length !== 6}>
                {emailBusy ? 'Confirmando…' : 'Confirmar cambio'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Datos del negocio */}
      <Card>
        <h2 className="mb-4 font-semibold text-fg">Datos del negocio</h2>

        {!canProfile && (
          <p className="mb-4 flex items-start gap-1.5 rounded-lg bg-surface2/60 px-3 py-2 text-xs text-muted">
            <Icon name="shield" size={13} className="mt-0.5 shrink-0" />
            Solo lectura: el dueño no te ha dado permiso para cambiar los datos del negocio.
          </p>
        )}
        <fieldset disabled={!canProfile} className="min-w-0 disabled:opacity-70">
        {/* Foto / avatar del negocio (reemplaza la inicial en el panel) */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-500/15 text-xl font-bold text-brand-700 dark:text-brand-300">
            {business?.photo ? (
              <img src={business.photo} alt="Foto del negocio" className="h-full w-full object-cover" />
            ) : (
              business?.name?.charAt(0).toUpperCase() || 'N'
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-fg">Foto del negocio</div>
            <p className="text-xs text-muted">Aparece en tu panel. Cuadrada se ve mejor (JPG o PNG).</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={onPhotoPick}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={photoBusy}
                onClick={() => photoInputRef.current?.click()}
              >
                <Icon name="camera" size={15} />
                {photoBusy ? 'Guardando…' : business?.photo ? 'Cambiar' : 'Subir foto'}
              </Button>
              {business?.photo && (
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => savePhoto('')}
                  className="text-xs font-medium text-muted transition hover:text-red-500 disabled:opacity-50"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>

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
        <form onSubmit={saveBusiness} noValidate className="space-y-4">
          <Input
            label="Nombre del negocio"
            value={biz.name}
            onChange={(e) => {
              setBiz({ ...biz, name: e.target.value });
              if (bizNameErr) setBizNameErr('');
            }}
            error={bizNameErr}
          />
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
        </fieldset>
      </Card>

      {/* Canales conectados (informativo) */}
      <ConnectedChannels />

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

      {/* Sesiones activas (dispositivos con la cuenta abierta) */}
      <ActiveSessions />

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

      {/* Eliminar cuenta (zona de riesgo) */}
      <Card className="border-red-500/30">
        <h2 className="mb-1 font-semibold text-red-600">Eliminar cuenta</h2>
        <p className="mb-4 text-sm text-muted">
          Elimina de forma permanente tu cuenta y todos tus datos: tu negocio, la configuración y el
          entrenamiento del bot, el historial de conversaciones, los registros de gestión, tu
          facturación (incluida la tarjeta guardada) y la conexión con WhatsApp.{' '}
          <strong className="text-fg">Esta acción no se puede deshacer.</strong>
        </p>

        {!delOpen ? (
          <Button
            variant="ghost"
            onClick={() => setDelOpen(true)}
            className="text-red-600 hover:bg-red-500/10"
          >
            Eliminar mi cuenta
          </Button>
        ) : (
          <form
            onSubmit={handleDeleteAccount}
            className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4"
          >
            <p className="text-sm text-fg">
              Para confirmar, escribe <strong>ELIMINAR</strong> y tu contraseña.
            </p>
            <Input
              label="Escribe ELIMINAR"
              value={delConfirm}
              onChange={(e) => setDelConfirm(e.target.value)}
              placeholder="ELIMINAR"
              autoComplete="off"
            />
            <Input
              label="Contraseña"
              type="password"
              value={delPassword}
              onChange={(e) => setDelPassword(e.target.value)}
              placeholder="Déjala vacía si entraste con Google"
              autoComplete="current-password"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={closeDelete}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={deleting || delConfirm.trim() !== 'ELIMINAR'}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleting ? 'Eliminando…' : 'Eliminar definitivamente'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
