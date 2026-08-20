import api from './axios.js';

/**
 * Capa fina sobre los endpoints del backend. Todas devuelven `response.data.data`
 * (el payload útil) o lanzan el error de axios para que la UI lo maneje.
 */
const unwrap = (p) => p.then((res) => res.data.data);

export const authApi = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  google: (credential) => unwrap(api.post('/auth/google', { credential })),
  config: () => unwrap(api.get('/auth/config')),
  logout: () => api.post('/auth/logout'),
  refresh: () => unwrap(api.post('/auth/refresh')),
  me: () => unwrap(api.get('/auth/me')),
  forgotPassword: (email) => unwrap(api.post('/auth/forgot-password', { email })),
  resetPassword: (body) => api.post('/auth/reset-password', body),
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
};

export const usageApi = {
  summary: (days = 30) => unwrap(api.get(`/usage?days=${days}`)),
};

export const chatApi = {
  list: () => unwrap(api.get('/chats')),
  get: (id) => unwrap(api.get(`/chats/${id}`)),
  remove: (id) => api.delete(`/chats/${id}`),
};

export const simulatorApi = {
  // Devuelve la respuesta completa para poder distinguir el 402 (límite).
  send: (message, chatId) => api.post('/simulator/message', { message, chatId }),
};

export const demoApi = {
  // Demo pública (sin registro). history = [{role, content}] corto.
  send: (message, history = []) => unwrap(api.post('/demo/message', { message, history })),
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
  setupIntent: () => unwrap(api.post('/billing/setup-intent')),
  getPaymentMethod: () => unwrap(api.get('/billing/payment-method')),
  savePaymentMethod: (paymentMethodId) =>
    unwrap(api.post('/billing/payment-method', { paymentMethodId })),
  deletePaymentMethod: () => unwrap(api.delete('/billing/payment-method')),
  updateAutoRecharge: (body) => unwrap(api.put('/billing/auto-recharge', body)),
};

export const conversationsApi = {
  list: () => unwrap(api.get('/conversations')),
  get: (id) => unwrap(api.get(`/conversations/${id}`)),
  setMode: (id, handoffMode) => unwrap(api.patch(`/conversations/${id}`, { handoffMode })),
  reply: (id, message) => unwrap(api.post(`/conversations/${id}/reply`, { message })),
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

export const membersApi = {
  list: () => unwrap(api.get('/members')),
  invite: (email) => unwrap(api.post('/members/invite', { email })),
  accept: (token) => unwrap(api.post('/members/accept', { token })),
  cancelInvite: (id) => api.delete(`/members/invite/${id}`),
  remove: (userId) => api.delete(`/members/${userId}`),
};

export const adminApi = {
  businesses: () => unwrap(api.get('/admin/businesses')),
};
