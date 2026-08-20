import { useState } from 'react';
import { businessApi } from '../../api/endpoints.js';
import { useBusinessStore } from '../../store/businessStore.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button, Input, Alert, Badge } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Verificación de propiedad del número de WhatsApp por código (OTP). Confirma
 * que el número es del negocio antes de dedicarlo al bot. El SMS está mockeado
 * por ahora: en modo prueba el código se muestra en pantalla (devCode); en
 * producción llegará por SMS/WhatsApp y, al conectar la Cloud API, Meta añade su
 * propia verificación.
 */
export function WhatsAppVerification() {
  const business = useBusinessStore((s) => s.business);
  const verified = Boolean(business?.whatsappVerified && business?.whatsappNumber);

  const [phone, setPhone] = useState(business?.whatsappNumber || '');
  const [editing, setEditing] = useState(!verified);
  const [step, setStep] = useState('phone'); // phone | code
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [devCode, setDevCode] = useState('');

  async function sendCode() {
    setErr('');
    setMsg('');
    setSending(true);
    try {
      const data = await businessApi.sendWhatsappCode(phone);
      setPhone(data.phone); // normalizado a E.164
      setDevCode(data.devCode || '');
      setStep('code');
      setMsg(data.isMexican ? 'Código enviado.' : 'Código enviado (número fuera de México).');
    } catch (e) {
      setErr(e.response?.data?.message || 'No se pudo enviar el código.');
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    setErr('');
    setMsg('');
    setVerifying(true);
    try {
      const { business: updated } = await businessApi.verifyWhatsapp(code);
      useBusinessStore.setState({ business: updated });
      setStep('phone');
      setEditing(false);
      setCode('');
      setDevCode('');
      setMsg('¡Número verificado!');
      toast.success('Número de WhatsApp verificado.');
    } catch (e) {
      setErr(e.response?.data?.message || 'No se pudo verificar el código.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="message" size={18} className="text-brand-600" />
          <h2 className="font-semibold text-fg">Número de WhatsApp del bot</h2>
        </div>
        {verified && <Badge color="green">Verificado</Badge>}
      </div>
      <p className="mb-4 text-sm text-muted">
        Confirmamos que el número es tuyo con un código. Al conectar WhatsApp real quedará dedicado
        al bot. Priorizamos números de México (+52).
      </p>

      {msg && (
        <div className="mb-3">
          <Alert variant="success">{msg}</Alert>
        </div>
      )}
      {err && (
        <div className="mb-3">
          <Alert variant="error">{err}</Alert>
        </div>
      )}

      {verified && !editing && step === 'phone' ? (
        <div className="flex items-center justify-between rounded-lg border border-line bg-surface2 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-fg">{business.whatsappNumber}</div>
            <div className="text-xs text-subtle">Propiedad confirmada</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Cambiar número
          </Button>
        </div>
      ) : step === 'phone' ? (
        <div className="space-y-3">
          <Input
            label="Número de WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="618 123 4567 o +52 618 123 4567"
          />
          <div className="flex justify-end gap-2">
            {verified && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
            <Button onClick={sendCode} disabled={sending || !phone.trim()}>
              {sending ? 'Enviando…' : 'Enviar código'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Enviamos un código de 6 dígitos a <strong>{phone}</strong>.
          </p>
          {devCode && (
            <Alert variant="info">
              Modo prueba: tu código es <strong>{devCode}</strong>. En producción llega por
              SMS/WhatsApp.
            </Alert>
          )}
          <Input
            label="Código de 6 dígitos"
            value={code}
            inputMode="numeric"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep('phone');
                setCode('');
              }}
            >
              Cambiar número
            </Button>
            <Button variant="secondary" size="sm" onClick={sendCode} disabled={sending}>
              Reenviar
            </Button>
            <Button onClick={verify} disabled={verifying || code.length !== 6}>
              {verifying ? 'Verificando…' : 'Verificar'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
