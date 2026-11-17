import { create } from 'zustand';

/**
 * Sistema de notificaciones tipo "toast" para confirmación inmediata de acciones
 * (guardar, activar, comprar…). Cada acción del usuario debe tener feedback claro.
 * Uso: `import { toast } from '...'; toast.success('Guardado')` — sin hook.
 */
let seq = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  // Modales abiertos: mientras haya uno, los toasts se retienen (fuera del modal
  // la página es inerte y el aviso se perdería) y se muestran al cerrarlo. El
  // conteo de tiempo de cada toast empieza cuando se ve (ver Toaster).
  modals: 0,
  modalOpened: () => set((s) => ({ modals: s.modals + 1 })),
  modalClosed: () => set((s) => ({ modals: Math.max(0, s.modals - 1) })),
  push: ({ type = 'success', message, duration = 3800 }) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
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
