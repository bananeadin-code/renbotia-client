import api from './axios.js';

/**
 * Capa fina sobre los endpoints del backend. Todas devuelven `response.data.data`
 * (el payload útil) o lanzan el error de axios para que la UI lo maneje.
 */
const unwrap = (p) => p.then((res) => res.data.data);

export const authApi = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  google: (credential, ref) => unwrap(api.post('/auth/google', { credential, ...(ref ? { ref } : {}) })),
  config: () => unwrap(api.get('/auth/config')),
  logout: () => api.post('/auth/logout'),
  refresh: () => unwrap(api.post('/auth/refresh')),
  me: () => unwrap(api.get('/auth/me')),
  forgotPassword: (email) => unwrap(api.post('/auth/forgot-password', { email })),
  resetPassword: (body) => api.post('/auth/reset-password', body),
  // Verificación de correo (registro) y 2FA de login por código.
  verifyEmail: (body) => unwrap(api.post('/auth/verify-email', body)),
  verify2fa: (body) => unwrap(api.post('/auth/verify-2fa', body)),
  resendCode: (body) => unwrap(api.post('/auth/resend-code', body)),
  setTwoFactor: (enabled) => unwrap(api.patch('/auth/2fa', { enabled })),
  updateProfile: (name) => unwrap(api.patch('/auth/profile', { name })),
  requestEmailChange: (newEmail) => unwrap(api.post('/auth/email/request', { newEmail })),
  verifyEmailChange: (code) => unwrap(api.post('/auth/email/verify', { code })),
  // Eliminación de cuenta (irreversible). password o confirm='ELIMINAR'.
  deleteAccount: (body) => unwrap(api.delete('/auth/account', { data: body })),
};

export const onboardingApi = {
  status: () => unwrap(api.get('/onboarding/status')),
  complete: (body) => unwrap(api.post('/onboarding', body)),
};

export const planApi = {
  list: () => unwrap(api.get('/plans')),
};

export const businessApi = {
  me: () => unwrap(api.get('/business/me')),
  update: (body) => unwrap(api.patch('/business/me', body)),
  audit: () => unwrap(api.get('/business/audit')),
  // Proyectos accesibles (propio + colaboración) para el switcher.
  projects: () => unwrap(api.get('/business/projects')),
  // Verificación de propiedad del número de WhatsApp (OTP).
  sendWhatsappCode: (phone) => unwrap(api.post('/business/whatsapp/send-code', { phone })),
  verifyWhatsapp: (code) => unwrap(api.post('/business/whatsapp/verify', { code })),
};

export const subscriptionApi = {
  me: () => unwrap(api.get('/subscription/me')),
};

export const botConfigApi = {
  get: () => unwrap(api.get('/botconfig')),
  update: (body) => unwrap(api.put('/botconfig', body)),
  // Avisos temporales (vencen solos; también se ponen desde el WhatsApp del dueño).
  notices: () => unwrap(api.get('/botconfig/notices')),
  addNotice: (body) => unwrap(api.post('/botconfig/notices', body)),
  removeNotice: (id) => unwrap(api.delete(`/botconfig/notices/${id}`)),
};

export const usageApi = {
  summary: (days = 30) => unwrap(api.get(`/usage?days=${days}`)),
  impact: () => unwrap(api.get('/usage/impact')),
  analytics: () => unwrap(api.get('/usage/analytics')),
};

export const chatApi = {
  list: () => unwrap(api.get('/chats')),
  get: (id) => unwrap(api.get(`/chats/${id}`)),
  remove: (id) => api.delete(`/chats/${id}`),
};

export const simulatorApi = {
  // Devuelve la respuesta completa para poder distinguir el 402 (límite).
  // file (opcional): { kind:'image'|'pdf', mediaType, data(base64), name } para probar
  // cómo responde el bot a una foto o un PDF.
  send: (message, chatId, file) =>
    api.post('/simulator/message', { message, chatId, ...(file ? { file } : {}) }),
};

export const demoApi = {
  // Demo pública (sin registro). history = [{role, content}] corto.
  send: (message, history = [], profileToken) =>
    unwrap(api.post('/demo/message', { message, history, ...(profileToken ? { profileToken } : {}) })),
  // "Pruébalo con tu negocio": arma un bot con el sitio o la descripción del visitante.
  profile: (body) => unwrap(api.post('/demo/profile', body)),
};

export const contactApi = {
  // Formulario de contacto público (envía a tu buzón vía Resend en el backend).
  submit: (body) => unwrap(api.post('/contact', body)),
};

export const waitlistApi = {
  // Lista de espera de planes de pago ("avísame cuando esté").
  join: (email, planKey) => unwrap(api.post('/waitlist', { email, planKey })),
  adminList: () => unwrap(api.get('/admin/waitlist')),
};

export const siteAssistantApi = {
  // Asistente del sitio (widget flotante). Público + admin.
  getConfig: () => unwrap(api.get('/site-assistant/config')),
  send: (message, history = []) => unwrap(api.post('/site-assistant/message', { message, history })),
  adminGet: () => unwrap(api.get('/admin/site-assistant')),
  adminUpdate: (body) => unwrap(api.put('/admin/site-assistant', body)),
};

export const billingApi = {
  // Pago embebido (PaymentElement, sin redirect). createIntent crea el
  // PaymentIntent; confirm lo verifica y entrega el plan/créditos.
  createIntent: (body) => unwrap(api.post('/billing/intent', body)),
  confirm: (body) => unwrap(api.post('/billing/confirm', body)),
  payments: () => unwrap(api.get('/billing/payments')),
  cancel: () => unwrap(api.post('/billing/cancel')),
  resume: () => unwrap(api.post('/billing/resume')),
  changePlan: (planKey) => unwrap(api.post('/billing/change-plan', { planKey })),
  // Tarjeta guardada (Stripe Elements) + recarga automática
  config: () => unwrap(api.get('/billing/config')),
  // Estado público de planes (sin sesión) para la página de Precios.
  publicConfig: () => unwrap(api.get('/billing/public-config')),
  setupIntent: () => unwrap(api.post('/billing/setup-intent')),
  getPaymentMethod: () => unwrap(api.get('/billing/payment-method')),
  savePaymentMethod: (paymentMethodId) =>
    unwrap(api.post('/billing/payment-method', { paymentMethodId })),
  deletePaymentMethod: () => unwrap(api.delete('/billing/payment-method')),
  updateAutoRecharge: (body) => unwrap(api.put('/billing/auto-recharge', body)),
};

export const conversationsApi = {
  // scope: 'real' (clientes de los canales) | 'simulator' (pruebas del equipo).
  list: (scope = 'real') => unwrap(api.get('/conversations', { params: { scope } })),
  get: (id) => unwrap(api.get(`/conversations/${id}`)),
  setMode: (id, handoffMode) => unwrap(api.patch(`/conversations/${id}`, { handoffMode })),
  rename: (id, title) => unwrap(api.patch(`/conversations/${id}`, { title })),
  setTags: (id, tags) => unwrap(api.patch(`/conversations/${id}`, { tags })),
  setHotLead: (id, hotLead) => unwrap(api.patch(`/conversations/${id}`, { hotLead })),
  summarize: (id) => unwrap(api.post(`/conversations/${id}/summary`)),
  reply: (id, message) => unwrap(api.post(`/conversations/${id}/reply`, { message })),
  rate: (id, index, rating) => unwrap(api.post(`/conversations/${id}/rate`, { index, rating })),
  // Plantillas de WhatsApp (para reactivar fuera de la ventana de 24h).
  templates: () => unwrap(api.get('/conversations/templates')),
  sendTemplate: (id, body) => unwrap(api.post(`/conversations/${id}/template`, body)),
  // PDF que envió el cliente (descarga autenticada como Blob).
  downloadFile: (id, fileId) =>
    api.get(`/conversations/${id}/files/${fileId}`, { responseType: 'blob' }).then((r) => r.data),
};

export const managementApi = {
  getConfig: () => unwrap(api.get('/management/config')),
  updateConfig: (body) => unwrap(api.put('/management/config', body)),
  stats: () => unwrap(api.get('/management/stats')),
  records: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    ).toString();
    return unwrap(api.get(`/management/records${qs ? `?${qs}` : ''}`));
  },
  createRecord: (body) => unwrap(api.post('/management/records', body)),
  updateRecord: (id, body) => unwrap(api.patch(`/management/records/${id}`, body)),
  deleteRecord: (id) => api.delete(`/management/records/${id}`),
  availability: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    ).toString();
    return unwrap(api.get(`/management/availability${qs ? `?${qs}` : ''}`));
  },
};

export const connectionsApi = {
  // Estado + config para el Embedded Signup de WhatsApp (módulo Conexiones).
  get: () => unwrap(api.get('/connections')),
  connectWhatsApp: (body) => unwrap(api.post('/connections/whatsapp', body)),
  disconnectWhatsApp: () => unwrap(api.post('/connections/whatsapp/disconnect')),
  // Facebook Messenger (Página): conectar con el token del FB Login (el servidor lo
  // verifica con Meta), elegir Página si concedió varias, y desconectar.
  connectMessenger: (accessToken) => unwrap(api.post('/connections/messenger', { accessToken })),
  selectMessengerPage: (pageId) => unwrap(api.post('/connections/messenger/select', { pageId })),
  disconnectMessenger: () => unwrap(api.post('/connections/messenger/disconnect')),
  // Instagram DMs (cuenta profesional ligada a una Página): mismo patrón.
  connectInstagram: (accessToken) => unwrap(api.post('/connections/instagram', { accessToken })),
  selectInstagramAccount: (accountId) => unwrap(api.post('/connections/instagram/select', { accountId })),
  disconnectInstagram: () => unwrap(api.post('/connections/instagram/disconnect')),
  // Ajustes por canal: pausa del bot, preguntas iniciales y saludo de Messenger.
  updateSettings: (body) => unwrap(api.put('/connections/settings', body)),
  // Perfil de WhatsApp Business (lo que el cliente ve en el chat).
  getProfile: () => unwrap(api.get('/connections/whatsapp/profile')),
  updateProfile: (body) => unwrap(api.put('/connections/whatsapp/profile', body)),
  // Plantillas de la WABA (crear/listar desde el sitio).
  listTemplates: () => unwrap(api.get('/connections/whatsapp/templates')),
  createTemplate: (body) => unwrap(api.post('/connections/whatsapp/templates', body)),
};

export const widgetApi = {
  // Panel: configuración del chat incrustable del sitio web (Pro/Elite).
  get: () => unwrap(api.get('/widget')),
  update: (body) => unwrap(api.put('/widget', body)),
  // Público (dentro del iframe /w/:key): apariencia, enviar y sondear mensajes.
  // `host`: sitio donde está incrustado el chat (para "dominios permitidos").
  publicConfig: (key, host = '') =>
    unwrap(api.get(`/widget/public/${encodeURIComponent(key)}`, { params: host ? { host } : {} })),
  send: (key, body) => unwrap(api.post(`/widget/public/${encodeURIComponent(key)}/message`, body)),
  thread: (key, sessionId, after = 0, host = '') =>
    unwrap(
      api.get(`/widget/public/${encodeURIComponent(key)}/messages`, {
        params: { sessionId, after, ...(host ? { host } : {}) },
      })
    ),
};

export const ownerControlApi = {
  // Manejar el bot desde el WhatsApp del dueño (solo el dueño).
  get: () => unwrap(api.get('/owner-control')),
  linkCode: () => unwrap(api.post('/owner-control/link-code')),
  unlink: (id) => unwrap(api.delete(`/owner-control/${id}`)),
};

export const referralApi = {
  // Invita y gana: enlace y avance hacia el próximo mes de Pro.
  get: () => unwrap(api.get('/referrals')),
};

export const importApi = {
  // "Entrénalo con lo que ya tienes": propuesta desde chats, sitio o texto.
  analyze: (body) => unwrap(api.post('/import', body)),
};

export const learningApi = {
  // "Aprende de ti": lo que el bot podría aprender de la operación diaria.
  list: () => unwrap(api.get('/learning')),
  accept: (id, body) => unwrap(api.post(`/learning/${id}/accept`, body)),
  dismiss: (id) => unwrap(api.post(`/learning/${id}/dismiss`)),
};

export const membersApi = {
  list: () => unwrap(api.get('/members')),
  invite: (email) => unwrap(api.post('/members/invite', { email })),
  accept: (token) => unwrap(api.post('/members/accept', { token })),
  cancelInvite: (id) => api.delete(`/members/invite/${id}`),
  remove: (userId) => api.delete(`/members/${userId}`),
  // El dueño da o quita permisos a un colaborador.
  setPermissions: (userId, body) => unwrap(api.patch(`/members/${userId}/permissions`, body)),
};

export const adminApi = {
  businesses: () => unwrap(api.get('/admin/businesses')),
  // Control fiscal (RESICO): ingresos del sitio + estimación de impuestos.
  fiscal: () => unwrap(api.get('/admin/fiscal')),
};
