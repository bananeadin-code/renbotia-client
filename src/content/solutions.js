/**
 * Páginas por caso de uso / industria (SEO programático). Cada una rankea para
 * búsquedas específicas del nicho ("bot de WhatsApp para despachos legales") en
 * vez de competir solo con la landing genérica. Contenido en español, orientado
 * a PyMEs de México, con enlaces internos hacia precios / registro / blog.
 *
 * Estructura por entrada: slug, industria, título/meta SEO, dolores, beneficios,
 * un ejemplo de conversación y FAQs específicas (para el schema FAQPage).
 */
export const SOLUTIONS = [
  {
    slug: 'despachos-legales',
    industry: 'Despachos y abogados',
    icon: 'building',
    title: 'Bot de WhatsApp con IA para despachos legales | RenBotIA',
    description:
      'Automatiza la atención de tu despacho por WhatsApp: responde consultas frecuentes, filtra casos y agenda citas 24/7 sin descuidar la asesoría.',
    h1: 'Un asistente de WhatsApp para tu despacho legal',
    lede: 'Deja que un asistente con IA atienda las primeras dudas de tus clientes —costos, áreas, documentos, citas— mientras tú te concentras en los casos.',
    pains: [
      'Te escriben a toda hora preguntando lo mismo: cuánto cuesta una consulta, qué áreas manejan, qué documentos llevar.',
      'Los mensajes fuera de horario se enfrían y el prospecto se va con otro despacho.',
      'Filtrar quién tiene un caso real y quién solo pregunta te consume tiempo facturable.',
    ],
    benefits: [
      'Responde al instante las consultas frecuentes con la información y el tono de tu despacho.',
      'Agenda la consulta inicial revisando tu disponibilidad real, sin choques de horario.',
      'Capta y organiza a los interesados para que tú solo confirmes y des seguimiento.',
    ],
    example: {
      user: '¿Cuánto cuesta una consulta y qué necesito llevar?',
      bot: 'La consulta inicial cuesta $500 MXN, deducible si contratas. Para tu primera cita basta una identificación y los documentos relacionados con tu caso. ¿Te agendo esta semana?',
    },
    faqs: [
      {
        q: '¿El bot da asesoría legal?',
        a: 'No sustituye a un abogado: responde dudas frecuentes (costos, áreas, documentos, horarios) y agenda la consulta. La asesoría la das tú.',
      },
      {
        q: '¿Puedo definir qué áreas del derecho maneja?',
        a: 'Sí. Entrenas al bot con tus áreas, precios y requisitos, y solo responde con esa información como fuente de verdad.',
      },
    ],
  },
  {
    slug: 'despachos-contables',
    industry: 'Contadores y despachos fiscales',
    icon: 'chart',
    title: 'Bot de WhatsApp con IA para despachos contables | RenBotIA',
    description:
      'Atiende por WhatsApp las dudas fiscales frecuentes de tus clientes, recuerda fechas y agenda citas, sin saturar a tu equipo en temporada de impuestos.',
    h1: 'Atención por WhatsApp para tu despacho contable',
    lede: 'Responde las preguntas de siempre —qué papeles necesito, cuándo vence, cuánto cuesta— y deja a tu equipo el trabajo que sí requiere criterio.',
    pains: [
      'En cada declaración, los mismos mensajes: qué documentos, qué fechas, cuánto cobran.',
      'La temporada fiscal satura a tu equipo con consultas repetidas de bajo valor.',
      'Un cliente que no recibe respuesta rápida duda de que estés al pendiente de su contabilidad.',
    ],
    benefits: [
      'Contesta al momento las dudas frecuentes con la información de tu despacho.',
      'Explica qué documentos hacen falta para cada trámite sin que intervengas.',
      'Agenda citas y capta prospectos para que tu equipo se enfoque en los números.',
    ],
    example: {
      user: '¿Qué necesito para mi declaración anual?',
      bot: 'Para tu declaración anual normalmente necesitas tus CFDI de ingresos y gastos, constancias de retenciones y tu e.firma vigente. ¿Quieres que te agende una cita para revisarlo con un contador?',
    },
    faqs: [
      {
        q: '¿El bot puede dar información fiscal específica de mi cliente?',
        a: 'Responde con la información general que tú cargas (requisitos, fechas, precios). Los datos particulares de cada cliente los maneja tu equipo.',
      },
      {
        q: '¿Sirve en temporada de declaraciones?',
        a: 'Especialmente. Absorbe la ola de consultas repetidas para que tu equipo atienda solo lo que requiere criterio.',
      },
    ],
  },
  {
    slug: 'consultoras',
    industry: 'Consultoras y servicios profesionales',
    icon: 'sparkles',
    title: 'Bot de WhatsApp con IA para consultoras | RenBotIA',
    description:
      'Convierte las consultas por WhatsApp en reuniones agendadas: tu asistente con IA responde, califica y agenda mientras tú entregas el proyecto.',
    h1: 'Capta más reuniones para tu consultora, por WhatsApp',
    lede: 'Un asistente que responde las dudas iniciales, explica cómo trabajas y agenda la llamada de diagnóstico, sin que pierdas foco en los proyectos.',
    pains: [
      'Los prospectos preguntan por WhatsApp y, si tardas, pierden el interés.',
      'Explicar una y otra vez cómo trabajas y qué incluyes te quita horas.',
      'Sin seguimiento ordenado, se te escapan oportunidades entre proyecto y proyecto.',
    ],
    benefits: [
      'Explica tus servicios, enfoque y precios con tu propio tono, al instante.',
      'Agenda la llamada de diagnóstico revisando tu disponibilidad real.',
      'Registra a cada interesado para que hagas seguimiento sin que se pierda ninguno.',
    ],
    example: {
      user: 'Hola, ¿cómo trabajan y cuánto cobran?',
      bot: 'Trabajamos por proyecto con una llamada de diagnóstico gratuita para entender tu caso y proponerte un plan. ¿Te agendo esa llamada esta semana?',
    },
    faqs: [
      {
        q: '¿Puede calificar prospectos?',
        a: 'Sí: hace las preguntas iniciales que tú definas y registra a los interesados con su contexto para que priorices a quién llamar.',
      },
      {
        q: '¿Se adapta a mi forma de trabajar?',
        a: 'Lo entrenas con tu enfoque, servicios y tono en el contexto ampliado del plan Pro o Elite.',
      },
    ],
  },
  {
    slug: 'agencias-marketing',
    industry: 'Agencias de marketing',
    icon: 'message',
    title: 'Bot de WhatsApp con IA para agencias de marketing | RenBotIA',
    description:
      'Atiende y califica leads por WhatsApp 24/7: tu asistente con IA responde, muestra tus servicios y agenda la llamada, para que cierres más.',
    h1: 'Atiende y califica leads por WhatsApp, sin frenar la operación',
    lede: 'Tu agencia vive de responder rápido. Deja que un asistente con IA atienda el primer contacto, muestre lo que haces y agende la llamada de venta.',
    pains: [
      'Los leads llegan por WhatsApp a cualquier hora y responder tarde te cuesta cierres.',
      'Tu equipo pierde tiempo en preguntas repetidas de precios y servicios.',
      'Sin un primer filtro, te reúnes con prospectos que no calzan con tu servicio.',
    ],
    benefits: [
      'Responde al instante sobre tus servicios, paquetes y casos, con la voz de tu marca.',
      'Filtra y califica al lead antes de pasarlo a una llamada con tu equipo.',
      'Agenda la reunión de venta y registra al prospecto automáticamente.',
    ],
    example: {
      user: '¿Manejan campañas de Ads y cuánto cuesta?',
      bot: 'Sí, gestionamos campañas de Ads dentro de nuestros paquetes desde $4,999 MXN/mes. ¿Quieres que agendemos una llamada de diagnóstico gratis para armar el tuyo?',
    },
    faqs: [
      {
        q: '¿Puede mostrar mis paquetes o casos?',
        a: 'En el plan Elite el bot puede enviar imágenes (paquetes, casos, catálogos) cuando el cliente las pide.',
      },
      {
        q: '¿Reemplaza a mi equipo de ventas?',
        a: 'No: hace el primer contacto y filtro 24/7, y te pasa leads ya calificados para que tu equipo cierre.',
      },
    ],
  },
  {
    slug: 'restaurantes',
    industry: 'Restaurantes y negocios locales',
    icon: 'sparkles',
    title: 'Bot de WhatsApp con IA para restaurantes | RenBotIA',
    description:
      'Toma reservaciones y pedidos por WhatsApp y responde dudas de menú, horarios y ubicación 24/7, sin tener a alguien pegado al teléfono.',
    h1: 'Reservaciones y pedidos por WhatsApp, sin descuidar el servicio',
    lede: 'Deja que un asistente con IA responda por el menú, tome reservaciones con tu disponibilidad real y capte pedidos, mientras tu equipo atiende a la gente.',
    pains: [
      'El teléfono no para: menú, horarios, ubicación, "¿tienen mesa?".',
      'En hora pico nadie alcanza a contestar WhatsApp y se pierden reservaciones.',
      'Anotar pedidos y reservaciones a mano genera errores y dobles reservas.',
    ],
    benefits: [
      'Responde al instante menú, horarios, ubicación y formas de pago.',
      'Toma reservaciones con criterio real de cupo y horario, sin sobre-agendar.',
      'Capta pedidos y los deja organizados para que tú solo confirmes.',
    ],
    example: {
      user: '¿Tienen mesa para 4 el viernes en la noche?',
      bot: 'Para el viernes tengo lugar a las 8:00 y a las 9:30 pm para 4 personas. ¿Cuál te acomoda? Te aparto la mesa a nombre de quien me digas.',
    },
    faqs: [
      {
        q: '¿Puede tomar reservaciones sin sobre-agendar?',
        a: 'Sí: agenda según el cupo y el horario que configuras, y un espacio ocupado deja de ofrecerse automáticamente (módulo de gestión, plan Elite).',
      },
      {
        q: '¿Puede enviar el menú?',
        a: 'En el plan Elite el bot envía imágenes como el menú o el catálogo cuando el cliente las pide.',
      },
    ],
  },
];

export function getSolution(slug) {
  return SOLUTIONS.find((s) => s.slug === slug);
}
