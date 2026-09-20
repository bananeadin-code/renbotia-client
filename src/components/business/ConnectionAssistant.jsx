import { useEffect, useState } from 'react';
import { useBusinessStore } from '../../store/businessStore.js';
import { Card } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

const SUPPORT_EMAIL = 'servicios@renbotia.com';

// Requisitos que evitan que el usuario se atore a mitad de la conexión (el punto
// de mayor abandono). Se confirman antes de abrir el modal de Meta.
const CHECKLIST = [
  {
    key: 'numero',
    title: 'Tengo un número dedicado',
    detail: 'Un chip o número que usarás solo para el bot (no tu WhatsApp personal).',
  },
  {
    key: 'libre',
    title: 'No está activo en WhatsApp',
    detail: 'Ese número no debe tener una cuenta activa en WhatsApp ni WhatsApp Business. Si la tiene, elimínala primero desde la app.',
  },
  {
    key: 'senal',
    title: 'Puedo recibir SMS o llamada',
    detail: 'Meta te enviará un código de verificación a ese número. Ten el teléfono a la mano.',
  },
];

// Atascos frecuentes (los que vimos en la práctica) con su solución, para que el
// usuario no se rinda ante un error de Meta.
const BLOCKERS = [
  {
    q: 'No me llega el código de verificación',
    a: 'Espera 1–2 minutos y prueba la opción de llamada. Si el número es nuevo, a veces tarda en activarse; intenta de nuevo más tarde. Evita pedir muchos códigos seguidos: Meta limita los intentos.',
  },
  {
    q: 'Dice que el número ya está registrado',
    a: 'Ese número ya tiene una cuenta de WhatsApp. Abre WhatsApp (o WhatsApp Business) en un teléfono, entra a Ajustes y elimina esa cuenta; luego vuelve a intentar la conexión aquí.',
  },
  {
    q: 'No me deja elegir o crear el portafolio',
    a: 'En la ventana de Meta, elige “Crear un portafolio nuevo” en lugar de reutilizar uno existente. Usa un nombre simple, sin acentos ni símbolos.',
  },
  {
    q: 'Cerré la ventana o se quedó cargando',
    a: 'No pasa nada: no se conectó nada a medias. Vuelve a pulsar “Conectar WhatsApp” y repite el proceso con calma.',
  },
];

/**
 * Asistente de conexión: guía al dueño para conectar su WhatsApp sin atorarse.
 * Checklist previo (recordado por negocio), solución de atascos comunes y una
 * vía de ayuda directa para no perder a un interesado. Solo se muestra mientras
 * el canal NO está conectado.
 */
export function ConnectionAssistant() {
  const business = useBusinessStore((s) => s.business);
  const storageKey = `rb_conn_ready_${business?.id || business?._id || 'x'}`;
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      /* sin persistencia: se empieza vacío */
    }
  }, [storageKey]);

  function toggle(key) {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* modo privado: no persiste */
      }
      return next;
    });
  }

  const done = CHECKLIST.filter((c) => checked[c.key]).length;
  const allReady = done === CHECKLIST.length;

  return (
    <Card className="space-y-5">
      {/* Checklist previo */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
            <Icon name="checkCircle" size={17} />
          </span>
          <h2 className="font-semibold text-fg">Antes de conectar (2 minutos)</h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Confirma estos puntos para que la conexión salga a la primera. Toma unos minutos y es el
          proceso oficial de Meta.
        </p>

        <div className="mt-3 space-y-2">
          {CHECKLIST.map((item) => {
            const on = Boolean(checked[item.key]);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggle(item.key)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                  on ? 'border-brand-400/60 bg-brand-500/[0.06]' : 'border-line bg-surface hover:border-brand-300'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                    on ? 'border-brand-500 bg-brand-500 text-white' : 'border-line text-transparent'
                  }`}
                >
                  <Icon name="check" size={13} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">{item.title}</span>
                  <span className="block text-xs text-muted">{item.detail}</span>
                </span>
              </button>
            );
          })}
        </div>

        {allReady && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-600">
            <Icon name="checkCircle" size={16} /> Todo listo. Pulsa “Conectar WhatsApp” abajo.
          </p>
        )}
      </div>

      {/* Solución de atascos */}
      <div className="border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-fg">¿Se atoró la conexión? Soluciones rápidas</h3>
        <div className="mt-2 space-y-1.5">
          {BLOCKERS.map((b) => (
            <details key={b.q} className="group rounded-lg border border-line bg-surface2/40 px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-fg">
                {b.q}
                <Icon
                  name="chevronRight"
                  size={15}
                  className="shrink-0 text-subtle transition group-open:rotate-90"
                />
              </summary>
              <p className="mt-1.5 text-sm text-muted">{b.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Ayuda directa (concierge) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-400/30 bg-brand-500/[0.05] p-3">
        <p className="text-sm text-muted">
          <span className="font-medium text-fg">¿Prefieres que lo hagamos contigo?</span> Te ayudamos
          a conectar tu número sin complicaciones.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
            'Ayuda para conectar mi WhatsApp'
          )}&body=${encodeURIComponent(
            'Hola, quiero conectar mi WhatsApp a RenBotIA y me gustaría que me ayuden. Mi negocio es: '
          )}`}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Pedir ayuda
        </a>
      </div>
    </Card>
  );
}
