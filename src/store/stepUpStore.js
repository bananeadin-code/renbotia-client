import { create } from 'zustand';

/**
 * "Confirma que eres tú" (modo sudo). Cuando el servidor responde
 * STEP_UP_REQUIRED, el interceptor de axios llama a requestStepUp() y espera:
 * se abre el diálogo, la persona confirma (contraseña o código) y la petición
 * original se reintenta sola. Si cancela, la petición falla como antes.
 *
 * Varias peticiones a la vez comparten el mismo diálogo.
 */
export const useStepUpStore = create((set, get) => ({
  open: false,
  mfaOnly: false, // el servidor pidió un segundo factor: solo código por correo
  waiters: [],

  request({ mfaOnly = false } = {}) {
    return new Promise((resolve, reject) => {
      set((s) => ({ open: true, mfaOnly: s.open ? s.mfaOnly || mfaOnly : mfaOnly, waiters: [...s.waiters, { resolve, reject }] }));
    });
  },

  done() {
    get().waiters.forEach((w) => w.resolve());
    set({ open: false, mfaOnly: false, waiters: [] });
  },

  cancel() {
    get().waiters.forEach((w) => w.reject(new Error('cancelled')));
    set({ open: false, mfaOnly: false, waiters: [] });
  },
}));

export const requestStepUp = (opts) => useStepUpStore.getState().request(opts);
