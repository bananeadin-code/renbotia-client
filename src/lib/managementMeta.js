/**
 * Metadatos del módulo de Gestión para la UI (espejo del backend).
 */
export const TYPE_META = {
  cita: { label: 'Cita', plural: 'Citas', icon: 'calendarCheck', scheduled: true },
  reservacion: { label: 'Reservación', plural: 'Reservaciones', icon: 'users', scheduled: true },
  pedido: { label: 'Pedido', plural: 'Pedidos', icon: 'inbox', scheduled: false },
  prospecto: { label: 'Prospecto', plural: 'Prospectos', icon: 'tag', scheduled: false },
};

export const ALL_TYPES = ['cita', 'reservacion', 'pedido', 'prospecto'];

export const STATUS_META = {
  pendiente: { label: 'Pendiente', color: 'amber' },
  confirmado: { label: 'Confirmado', color: 'green' },
  completado: { label: 'Completado', color: 'slate' },
  cancelado: { label: 'Cancelado', color: 'red' },
};

export const STATUS_ORDER = ['pendiente', 'confirmado', 'completado', 'cancelado'];

export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAY_NAMES_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DT_FMT = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const D_FMT = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: '2-digit', month: 'long' });
const T_FMT = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });

export function formatDateTime(iso) {
  if (!iso) return '';
  return DT_FMT.format(new Date(iso));
}
export function formatDate(iso) {
  if (!iso) return '';
  return D_FMT.format(new Date(iso));
}
export function formatTime(iso) {
  if (!iso) return '';
  return T_FMT.format(new Date(iso));
}

/** ¿La fecha ya pasó? (para separar próximos de históricos). */
export function isPast(iso) {
  return iso && new Date(iso).getTime() < Date.now();
}
