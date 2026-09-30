import { create } from 'zustand';

/**
 * Diálogo de confirmación propio (reemplaza window.confirm y su "renbotia.com
 * dice"). Combina con el tema del sitio y es una promesa: se resuelve a true si
 * el usuario confirma, false si cancela/cierra.
 *
 * Uso sin hook:
 *   import { confirm } from '.../store/confirmStore.js';
 *   if (await confirm({ title, message, tone: 'danger', confirmLabel: 'Eliminar' })) { ... }
 *   // o simple: if (await confirm('¿Seguro?')) { ... }
 */
export const useConfirmStore = create((set, get) => ({
  state: null, // { opts, resolve } | null

  request: (opts) =>
    new Promise((resolve) => {
      set({ state: { opts: typeof opts === 'string' ? { message: opts } : opts || {}, resolve } });
    }),

  resolve: (result) => {
    const { state } = get();
    state?.resolve(Boolean(result));
    set({ state: null });
  },
}));

/** Atajo imperativo: devuelve una promesa<boolean>. */
export const confirm = (opts) => useConfirmStore.getState().request(opts);
