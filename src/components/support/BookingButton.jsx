import { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

// Lo que conviene tener listo si en la sesión se va a conectar WhatsApp (flujo de Meta).
const PREP_CONNECT = [
  'Un chip nuevo, dedicado solo al bot (no tu WhatsApp personal), en un teléfono a la mano para recibir el código por SMS o llamada.',
  'Que ese número no tenga cuenta activa en WhatsApp ni WhatsApp Business; si la tiene, elimínala antes desde la app.',
  'Tu Facebook (el de quien administra el negocio) con su contraseña, y el celular donde te llegan sus códigos de seguridad: Meta suele pedirlos.',
  'El nombre del negocio como quieres que lo vean tus clientes en WhatsApp; Meta lo revisa y debe coincidir con tu negocio.',
  'Conectarte desde una computadora (no desde el celular) y permitir ventanas emergentes en el navegador.',
];

// Para dejar el bot respondiendo bien en la misma llamada.
const PREP_TRAIN = ['Horarios, dirección, servicios y precios.', 'Las preguntas que más te hacen tus clientes.'];

function List({ items }) {
  return (
    <ul className="space-y-2 text-sm text-muted">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2">
          <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand-600" />
          {t}
        </li>
      ))}
    </ul>
  );
}

/**
 * Botón para agendar la sesión de orientación. Antes de abrir la agenda muestra
 * un consejo breve: qué preparar para conectar WhatsApp y entrenar el bot en la
 * misma llamada.
 *
 * @param {object} props
 * @param {string} props.url        Página de reservas (SUPPORT_BOOKING_URL).
 * @param {string} [props.label]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.variant]
 * @param {string} [props.className]
 */
export function BookingButton({ url, label = 'Agendar videollamada', size = 'sm', variant = 'primary', className = '' }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  function go() {
    setOpen(false);
    // Se abre en el mismo clic del usuario (sin bloqueo de ventanas emergentes).
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Antes de tu sesión" size="md">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Es una sesión gratuita y sin compromiso de <strong className="text-fg">orientación general</strong>,{' '}
            <strong className="text-fg">conexión asistida</strong> o ambas, según lo que necesites: entrenamiento, planes,
            conexiones, conversaciones y analíticas.
          </p>
          <div className="flex items-start gap-3 rounded-xl bg-brand-500/[0.07] px-3.5 py-3">
            <Icon name="whatsapp" size={20} className="mt-0.5 shrink-0 text-brand-600" />
            <p className="text-sm text-fg">
              Si tu objetivo es <strong>conectar tu WhatsApp</strong>, ten esto listo para dejarlo funcionando en la misma
              llamada:
            </p>
          </div>
          <List items={PREP_CONNECT} />
          <div>
            <p className="text-sm font-medium text-fg">Recomendado, no indispensable</p>
            <p className="mb-2 text-xs text-subtle">El entrenamiento de tu bot también lo vemos juntos en la orientación; si tienes esto a la mano, avanzamos más rápido.</p>
            <List items={PREP_TRAIN} />
          </div>
          <p className="text-xs text-subtle">Si solo buscas orientación general, no necesitas preparar nada.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={go}>
              Entendido, agendar <Icon name="arrowRight" size={15} />
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
