import { create } from 'zustand';
import { authApi } from '../api/endpoints.js';
import { setAccessToken } from '../api/axios.js';

/**
 * Estado de autenticación. El access token se guarda en memoria (y se inyecta
 * en axios); el refresh token vive en una cookie httpOnly que maneja el backend.
 *
 * bootstrap() se llama al cargar la app: intenta refrescar la sesión con la
 * cookie para recuperar al usuario sin pedir login de nuevo.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true, // true hasta que bootstrap termina

  setSession(user, accessToken) {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true });
  },

  async register(body) {
    const { user, accessToken } = await authApi.register(body);
    get().setSession(user, accessToken);
    return user;
  },

  async login(body) {
    const { user, accessToken } = await authApi.login(body);
    get().setSession(user, accessToken);
    return user;
  },

  async googleLogin(credential) {
    const { user, accessToken } = await authApi.google(credential);
    get().setSession(user, accessToken);
    return user;
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  updateUser(patch) {
    set((s) => ({ user: { ...s.user, ...patch } }));
  },

  async bootstrap() {
    try {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      const { user } = await authApi.me();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },
}));
