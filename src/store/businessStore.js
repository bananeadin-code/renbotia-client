import { create } from 'zustand';
import { businessApi, subscriptionApi } from '../api/endpoints.js';

/**
 * Estado del negocio activo del usuario (tenant) y su balance de tokens.
 * `hasBusiness` distingue si debe ir al onboarding o al dashboard.
 */
export const useBusinessStore = create((set) => ({
  business: null,
  subscription: null,
  balance: null,
  role: null, // rol del usuario en el negocio: 'owner' | 'colaborador'
  hasBusiness: null, // null = aún no se sabe
  loading: false,

  async load() {
    set({ loading: true });
    try {
      const [{ business, role }, subData] = await Promise.all([
        businessApi.me(),
        subscriptionApi.me(),
      ]);
      set({
        business,
        role,
        subscription: subData.subscription,
        balance: subData.balance,
        hasBusiness: true,
        loading: false,
      });
      return true;
    } catch (err) {
      // 404 con code NO_BUSINESS → el usuario aún no completó el onboarding.
      if (err.response?.status === 404) {
        set({ hasBusiness: false, loading: false });
        return false;
      }
      set({ loading: false });
      throw err;
    }
  },

  setBalance(balance) {
    set({ balance });
  },

  reset() {
    set({ business: null, subscription: null, balance: null, role: null, hasBusiness: null });
  },
}));
