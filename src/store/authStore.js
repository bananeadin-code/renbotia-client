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

  // Registro: ya NO inicia sesión de inmediato. Devuelve un estado pendiente
  // { needsEmailVerification, email, devCode? } para que el usuario confirme el
  // código enviado a su correo (verifyEmail).
  async register(body) {
    return authApi.register(body);
  },

  // Login: puede devolver la sesión, o un estado pendiente
  // { needs2fa | needsEmailVerification, email, devCode? }.
  async login(body) {
    const data = await authApi.login(body);
    if (data.needs2fa || data.needsEmailVerification) return data;
    get().setSession(data.user, data.accessToken);
    return { user: data.user };
  },

  // Confirma el correo con el código e inicia sesión.
  async verifyEmail(email, code) {
    const { user, accessToken } = await authApi.verifyEmail({ email, code });
    get().setSession(user, accessToken);
    return user;
  },

  // Verifica el 2FA del login e inicia sesión (opcional recordar dispositivo).
  async verify2fa(email, code, rememberDevice) {
    const { user, accessToken } = await authApi.verify2fa({ email, code, rememberDevice });
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
