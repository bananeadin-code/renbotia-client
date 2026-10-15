/**
 * Título y descripción de las páginas públicas fijas. Una sola fuente para la
 * página en React (useSeo) y para el HTML pre-renderizado (scripts/prerender-seo.mjs),
 * que es lo que leen Google y las vistas previas de WhatsApp/Facebook sin ejecutar JS.
 */
export const PAGE_SEO = {
  home: {
    path: '/',
    title: 'RenBotIA — Bot de WhatsApp con IA para negocios en México',
    description:
      'Automatiza la atención por WhatsApp de tu negocio con un asistente de IA entrenado con tu información. Responde dudas, agenda citas y capta clientes 24/7. Empieza gratis.',
  },
  precios: {
    path: '/precios',
    title: 'Precios — Planes desde $0 | RenBotIA',
    description:
      'Planes simples y transparentes para tu bot de WhatsApp con IA: empieza gratis y escala a Pro o Elite según tu volumen. Sin contratos, en pesos mexicanos.',
  },
  blog: {
    path: '/blog',
    title: 'Blog — Atención por WhatsApp con IA para negocios | RenBotIA',
    description:
      'Guías y consejos prácticos para automatizar la atención por WhatsApp de tu negocio en México: bots con IA, agendado de citas y experiencia del cliente.',
  },
  soluciones: {
    path: '/soluciones',
    title: 'Soluciones por industria — Bot de WhatsApp con IA | RenBotIA',
    description:
      'Bots de WhatsApp con IA para despachos, consultorios, clínicas, estéticas, inmobiliarias, gimnasios, escuelas, tiendas y restaurantes en todo México. Encuentra la solución para tu sector y tu ciudad.',
  },
  contacto: {
    path: '/contacto',
    title: 'Contacto | RenBotIA',
    description: 'Escríbenos: dudas sobre planes, conexión de WhatsApp, facturación o soporte. Te respondemos pronto.',
  },
  status: {
    path: '/status',
    title: 'Estado del servicio | RenBotIA',
    description: 'Estado en tiempo real de los sistemas de RenBotIA: sitio, API y base de datos.',
  },
  registro: {
    path: '/registro',
    title: 'Crea tu cuenta gratis | RenBotIA',
    description: 'Crea tu cuenta y arma tu bot de WhatsApp con IA en minutos. Empieza gratis, sin tarjeta.',
  },
  login: {
    path: '/login',
    title: 'Inicia sesión | RenBotIA',
    description: 'Entra a tu panel de RenBotIA.',
  },
};

/**
 * Resumen de planes para el HTML pre-renderizado de /precios (la página en React
 * los trae de la API). Debe coincidir con server/src/config/constants.js.
 */
export const PRICE_SUMMARY = [
  { name: 'Free', price: 0, detail: '50,000 tokens de IA al mes, sin tarjeta y sin límite de días.' },
  { name: 'Pro', price: 429, detail: '1,000,000 de tokens de IA al mes, tono personalizable, colaboradores, chat para tu sitio web y seguimiento automático.' },
  { name: 'Elite', price: 999, detail: '5,000,000 de tokens de IA al mes, gestión de citas, pedidos y prospectos, imágenes y documentos de contexto.' },
];
