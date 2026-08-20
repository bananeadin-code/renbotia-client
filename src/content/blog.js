/**
 * Contenido del blog (estático). Orientado a PyMEs y negocios en México, con
 * señales locales SUTILES (sin spam de "bots para Durango"). Cada artículo suma
 * profundidad de contenido y enlaces internos para posicionamiento orgánico.
 *
 * body: bloques { type: 'p'|'h2'|'ul', text?|items? } que BlogPost renderiza.
 */
export const POSTS = [
  {
    slug: 'automatizar-atencion-whatsapp-negocio',
    title: 'Cómo automatizar la atención por WhatsApp de tu negocio (guía 2026)',
    description:
      'Guía práctica para automatizar la atención por WhatsApp con un asistente de IA: qué responde solo, cómo se entrena y qué esperar los primeros días.',
    date: '2026-07-14',
    readingMin: 6,
    tags: ['WhatsApp', 'Automatización', 'Atención al cliente'],
    body: [
      {
        type: 'p',
        text: 'WhatsApp es el canal donde más te escriben tus clientes en México, y también donde más mensajes se quedan sin responder. Un asistente con inteligencia artificial atiende esas conversaciones al instante, a cualquier hora, sin que tú tengas que estar pendiente del teléfono. En esta guía verás cómo automatizarlo paso a paso.',
      },
      { type: 'h2', text: '1. Define qué debe responder el bot' },
      {
        type: 'p',
        text: 'Antes de automatizar, haz una lista de las preguntas que más te repiten: precios, horarios, ubicación, servicios, formas de pago. Esas preguntas frecuentes son el corazón del entrenamiento: el asistente las responderá con las palabras de tu negocio, no con respuestas genéricas.',
      },
      { type: 'h2', text: '2. Entrena al asistente con tu información' },
      {
        type: 'p',
        text: 'Un buen bot no improvisa: se entrena con los datos reales de tu negocio. Cargas tus FAQs, el tono con el que quieres que hable (formal, cercano, técnico) y detalles como tu horario y tus servicios. A partir de ahí responde con criterio, entendiendo lo que el cliente pregunta aunque no lo escriba con las palabras exactas.',
      },
      { type: 'h2', text: '3. Deja que agende y capte clientes solo' },
      {
        type: 'p',
        text: 'La automatización va más allá de responder dudas. Un asistente moderno puede agendar citas revisando tu disponibilidad real, tomar reservaciones o registrar prospectos, y dejártelos organizados para que tú solo confirmes. Así conviertes conversaciones en clientes sin escribir cada mensaje.',
      },
      { type: 'h2', text: '4. Mide y ajusta las primeras semanas' },
      {
        type: 'ul',
        items: [
          'Revisa las conversaciones reales y corrige respuestas que no quedaron claras.',
          'Agrega las preguntas nuevas que aparezcan a tus FAQs.',
          'Ajusta el tono si sientes que suena demasiado frío o demasiado informal.',
        ],
      },
      {
        type: 'p',
        text: 'Con RenBotIA puedes probar todo esto en un simulador antes de conectarlo a WhatsApp real: escribes como si fueras el cliente y ves exactamente cómo responde tu bot. Empezar es gratis.',
      },
    ],
  },
  {
    slug: 'senales-negocio-necesita-bot-whatsapp',
    title: '5 señales de que tu negocio ya necesita un bot de WhatsApp con IA',
    description:
      '¿Vale la pena automatizar tu WhatsApp? Estas cinco señales indican que tu negocio está perdiendo clientes por no responder a tiempo.',
    date: '2026-07-28',
    readingMin: 5,
    tags: ['WhatsApp', 'PyMEs', 'Productividad'],
    body: [
      {
        type: 'p',
        text: 'No todos los negocios necesitan automatizar su atención el primer día. Pero hay señales claras de que ya estás dejando dinero sobre la mesa por no responder a tiempo. Si te identificas con varias de estas, un asistente de WhatsApp con IA se paga solo.',
      },
      { type: 'h2', text: '1. Respondes las mismas preguntas todo el día' },
      {
        type: 'p',
        text: '"¿Cuánto cuesta?", "¿A qué hora abren?", "¿Dónde están?". Si sientes que copias y pegas las mismas respuestas una y otra vez, ese tiempo puede automatizarse por completo y liberarte para lo que sí requiere tu atención.',
      },
      { type: 'h2', text: '2. Pierdes mensajes fuera de horario' },
      {
        type: 'p',
        text: 'Muchos clientes escriben en la noche o el fin de semana. Si contestas hasta el día siguiente, para entonces ya le compraron a alguien más. Un bot responde en segundos las 24 horas y no deja enfriar al prospecto.',
      },
      { type: 'h2', text: '3. Se te olvida dar seguimiento' },
      {
        type: 'p',
        text: 'Entre tantas conversaciones, es fácil que un cliente interesado se pierda en la lista. Cuando el asistente capta y organiza cada solicitud (cita, pedido o prospecto), nada se te escapa.',
      },
      { type: 'h2', text: '4. Tu equipo está saturado de chats' },
      {
        type: 'p',
        text: 'Si una persona pasa medio día en WhatsApp respondiendo lo básico, ese es tiempo caro. El bot se encarga de lo repetitivo y tu equipo entra solo cuando la conversación lo amerita.',
      },
      { type: 'h2', text: '5. Quieres crecer sin contratar más gente' },
      {
        type: 'p',
        text: 'Atender el doble de clientes normalmente significa contratar más personal. Con un asistente de IA, tu capacidad de respuesta crece sin que crezca tu nómina al mismo ritmo.',
      },
      {
        type: 'p',
        text: 'Si marcaste tres o más, es buen momento para probarlo. En RenBotIA puedes armar tu bot y probarlo gratis en minutos.',
      },
    ],
  },
  {
    slug: 'atencion-cliente-whatsapp-pymes-mexico',
    title: 'Atención al cliente por WhatsApp: qué esperan los clientes de las PyMEs en México',
    description:
      'Los clientes mexicanos tienen expectativas claras al escribir por WhatsApp a un negocio. Esto es lo que esperan y cómo cumplirlo sin vivir pegado al celular.',
    date: '2026-08-11',
    readingMin: 6,
    tags: ['WhatsApp', 'México', 'Experiencia del cliente'],
    body: [
      {
        type: 'p',
        text: 'En México, WhatsApp no es un canal más: para muchos negocios es EL canal. Desde despachos y consultorios hasta restaurantes y tiendas de barrio, el primer contacto con un cliente suele empezar con un mensaje. Y ese cliente llega con expectativas muy concretas.',
      },
      { type: 'h2', text: 'Respuesta rápida, casi inmediata' },
      {
        type: 'p',
        text: 'La paciencia por WhatsApp es corta. Si un negocio tarda horas en contestar, el cliente asume que no le van a atender bien y busca otra opción. La expectativa real es de minutos, no de horas, y eso es difícil de sostener a mano cuando llegan muchos mensajes a la vez.',
      },
      { type: 'h2', text: 'Trato cercano y en su idioma' },
      {
        type: 'p',
        text: 'El cliente mexicano valora el trato humano y cercano. Un buen asistente de IA no suena como un robot frío: habla con el tono de tu negocio, entiende modismos y responde con naturalidad, manteniendo la calidez que la gente espera de un negocio local.',
      },
      { type: 'h2', text: 'Información correcta a la primera' },
      {
        type: 'p',
        text: 'Precios, horarios, ubicación y servicios: el cliente espera datos exactos, no un "déjame confirmo y te aviso". Cuando el bot se entrena con la información real del negocio, responde bien a la primera y proyecta profesionalismo.',
      },
      { type: 'h2', text: 'Cercanía local, alcance nacional' },
      {
        type: 'p',
        text: 'Un negocio en una ciudad como Durango compite hoy con marcas de todo el país, pero tiene una ventaja: la cercanía. Responder rápido, conocer al cliente y resolverle en su propio idioma es justo lo que las grandes cadenas hacen mal. Automatizar la atención por WhatsApp te deja competir a nivel nacional sin perder ese trato de negocio local.',
      },
      { type: 'h2', text: 'Cómo cumplir todo esto sin vivir en el celular' },
      {
        type: 'ul',
        items: [
          'Automatiza lo repetitivo y reserva tu tiempo para lo importante.',
          'Entrena al asistente con tus datos para que responda correcto y con tu tono.',
          'Deja que agende y capte clientes mientras tú atiendes tu negocio.',
        ],
      },
      {
        type: 'p',
        text: 'RenBotIA está pensado para negocios y PyMEs en México que quieren dar una atención de primer nivel por WhatsApp sin complicarse. Puedes empezar gratis y probarlo con tu propia información.',
      },
    ],
  },
];

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug);
}
