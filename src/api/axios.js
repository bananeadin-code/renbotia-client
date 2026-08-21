import axios from 'axios';

/**
 * Instancia de axios para la API. Usa el proxy de Vite (/api) por defecto.
 * withCredentials: true para enviar la cookie httpOnly del refresh token.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// El access token vive en memoria (no en localStorage, por seguridad XSS).
// El authStore lo inyecta aquí tras login/refresh.
let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
}

// Proyecto activo (switcher owner/colaborador). Se envía como header X-Business-Id;
// el backend valida SIEMPRE el acceso antes de usarlo. Persistido en localStorage.
const ACTIVE_KEY = 'renbotia:activeBusinessId';
let activeBusinessId = null;
try {
  activeBusinessId = localStorage.getItem(ACTIVE_KEY) || null;
} catch {
  /* sin localStorage: usa el negocio por defecto */
}
export function setActiveBusinessId(id) {
  activeBusinessId = id || null;
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* noop */
  }
}
export function getActiveBusinessId() {
  return activeBusinessId;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (activeBusinessId) {
    config.headers['X-Business-Id'] = activeBusinessId;
  }
  return config;
});

/**
 * Interceptor de respuesta: si un request falla con 401 (token expirado),
 * intenta UNA vez renovar el access token vía /auth/refresh y reintenta.
 * Evita bucles con la bandera _retry y no intenta refrescar el propio refresh.
 */
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        // Comparte una sola promesa de refresh entre requests concurrentes.
        refreshing =
          refreshing ||
          api.post('/auth/refresh').finally(() => {
            refreshing = null;
          });
        const { data } = await refreshing;
        const newToken = data?.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        // El refresh falló: la sesión expiró de verdad.
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
