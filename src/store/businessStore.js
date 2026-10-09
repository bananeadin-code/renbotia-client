import { create } from 'zustand';
import { businessApi, subscriptionApi } from '../api/endpoints.js';
import { setActiveBusinessId } from '../api/axios.js';

/**
 * Estado del negocio activo del usuario (tenant) y su balance de tokens.
 * `hasBusiness` distingue si debe ir al onboarding o al dashboard.
 * `projects` alimenta el switcher (negocio propio + colaboración, máx. 2).
 */
export const useBusinessStore = create((set, get) => ({
  business: null,
  subscription: null,
  balance: null,
  role: null, // rol del usuario en el negocio: 'owner' | 'colaborador'
  permissions: null, // permisos del colaborador (simulador, entrenar, datos, conexiones)
  hasBusiness: null, // null = aún no se sabe
  projects: [], // [{ id, name, role }]
  smsEnabled: false, // ¿hay proveedor de SMS para verificar el número?
  loading: false,

  async load(_retry = false) {
    set({ loading: true });
    try {
      const [{ business, role, permissions, access, smsEnabled }, subData] = await Promise.all([
        businessApi.me(),
        subscriptionApi.me(),
      ]);
      set({
        business,
        role,
        permissions: permissions || null,
        // IAM: { roleKey, roleName, modules: {módulo: none|view|edit}, channels }
        access: access || null,
        smsEnabled: Boolean(smsEnabled),
        subscription: subData.subscription,
        balance: subData.balance,
        hasBusiness: true,
        loading: false,
      });
      // Cargar la lista de proyectos en segundo plano (no bloquea el dashboard).
      get().loadProjects();
      return true;
    } catch (err) {
      // 404 con code NO_BUSINESS → el usuario aún no completó el onboarding.
      if (err.response?.status === 404) {
        set({ hasBusiness: false, loading: false });
        return false;
      }
      // 403 → el proyecto activo elegido ya no es accesible (p. ej. lo quitaron
      // como colaborador). Volvemos al negocio por defecto y reintentamos una vez.
      if (err.response?.status === 403 && !_retry) {
        setActiveBusinessId(null);
        set({ loading: false });
        return get().load(true);
      }
      set({ loading: false });
      throw err;
    }
  },

  async loadProjects() {
    try {
      const { projects } = await businessApi.projects();
      set({ projects: projects || [] });
    } catch {
      /* no bloquea: el switcher simplemente no aparece */
    }
  },

  // Cambia de proyecto (dueño ↔ colaborador). El servidor abre una sesión NUEVA
  // para ese contexto y cierra la anterior (entrar como dueño pide confirmar
  // identidad: el diálogo lo maneja axios). Luego recarga todo el panel.
  async switchTo(id) {
    const current = get().business?.id || get().business?._id;
    if (!id || String(id) === String(current)) return;
    const { authApi } = await import('../api/endpoints.js');
    const { setAccessToken } = await import('../api/axios.js');
    const data = await authApi.switchContext(id);
    if (data?.accessToken) setAccessToken(data.accessToken);
    setActiveBusinessId(id);
    window.location.assign('/dashboard');
  },

  setBalance(balance) {
    set({ balance });
  },

  reset() {
    set({
      business: null,
      subscription: null,
      balance: null,
      role: null,
      permissions: null,
      access: null,
      hasBusiness: null,
      projects: [],
    });
  },
}));
