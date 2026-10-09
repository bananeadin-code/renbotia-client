import { create } from 'zustand';
import { authApi } from '../api/endpoints.js';
import { setAccessToken, setActiveBusinessId } from '../api/axios.js';
import { getReferral } from '../lib/referral.js';

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
  // Tras autenticarse con varios contextos: { contexts, contextToken, name }.
  pendingContext: null,

  setSession(user, accessToken, context) {
    setAccessToken(accessToken);
    if (context?.businessId) setActiveBusinessId(context.businessId);
    set({ user, isAuthenticated: true, pendingContext: null });
  },

  // Respuesta de un login ya autenticado: sesión directa o elegir contexto.
  _finish(data) {
    if (data.needsContext) {
      set({ pendingContext: { contexts: data.contexts || [], contextToken: data.contextToken, name: data.name || '', needsCode: Boolean(data.needsCode) } });
      return { needsContext: true };
    }
    get().setSession(data.user, data.accessToken, data.context);
    return { user: data.user };
  },

  // Elige a qué entrar (dueño o proyecto). Puede pedir un código si el proyecto
  // exige verificación en dos pasos.
  async selectContext(businessId, code) {
    const p = get().pendingContext;
    const data = await authApi.selectContext({ contextToken: p.contextToken, businessId, ...(code ? { code } : {}) });
    if (data.needsCode) return { needsCode: true };
    get().setSession(data.user, data.accessToken, data.context);
    return { user: data.user };
  },

  clearPendingContext() {
    set({ pendingContext: null });
  },

  // Registro: ya NO inicia sesión de inmediato. Devuelve un estado pendiente
  // { needsEmailVerification, email, devCode? } para que el usuario confirme el
  // código enviado a su correo (verifyEmail).
  async register(body) {
    // Código de referido del enlace de invitación (si llegó por uno).
    return authApi.register({ ...body, ...(getReferral() ? { ref: getReferral() } : {}) });
  },

  // Login: puede devolver la sesión, o un estado pendiente
  // { needs2fa | needsEmailVerification, email, devCode? }.
  async login(body) {
    const data = await authApi.login(body);
    if (data.needs2fa || data.needsEmailVerification) return data;
    return get()._finish(data);
  },

  // Confirma el correo con el código e inicia sesión.
  async verifyEmail(email, code) {
    const data = await authApi.verifyEmail({ email, code });
    const r = get()._finish(data);
    return r.needsContext ? r : r.user;
  },

  // Verifica el 2FA del login e inicia sesión (opcional recordar dispositivo).
  async verify2fa(email, code, rememberDevice) {
    const data = await authApi.verify2fa({ email, code, rememberDevice });
    const r = get()._finish(data);
    return r.needsContext ? r : r.user;
  },

  async googleLogin(credential) {
    const data = await authApi.google(credential, getReferral());
    const r = get()._finish(data);
    return r.needsContext ? r : r.user;
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
