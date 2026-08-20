import { create } from 'zustand';

/**
 * Sistema de notificaciones tipo "toast" para confirmación inmediata de acciones
 * (guardar, activar, comprar…). Cada acción del usuario debe tener feedback claro.
 * Uso: `import { toast } from '...'; toast.success('Guardado')` — sin hook.
 */
let seq = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: ({ type = 'success', message, duration = 3800 }) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    if (duration > 0) {
      setTimeout(() => get().remove(id), duration);
    }
    return id;
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Atajos para disparar toasts desde cualquier parte sin usar el hook.
export const toast = {
  success: (message, opts) => useToastStore.getState().push({ type: 'success', message, ...opts }),
  error: (message, opts) => useToastStore.getState().push({ type: 'error', message, ...opts }),
  info: (message, opts) => useToastStore.getState().push({ type: 'info', message, ...opts }),
};
