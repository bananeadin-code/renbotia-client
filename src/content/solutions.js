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
  {
    slug: 'consultorios-dentales',
    industry: 'Dentistas y consultorios dentales',
    icon: 'calendarCheck',
    title: 'Bot de WhatsApp con IA para dentistas y consultorios dentales | RenBotIA',
    description:
      'Agenda citas, responde precios de limpiezas y tratamientos y confirma pacientes por WhatsApp las 24 horas, sin cargar a tu recepción.',
    h1: 'Un asistente de WhatsApp para tu consultorio dental',
    lede: 'Responde al instante precios, tratamientos y horarios, y agenda la cita del paciente con tu disponibilidad real, aunque estés en consulta.',
    pains: [
      'Mientras atiendes a un paciente, otros escriben preguntando por precios de limpieza, blanqueamiento u ortodoncia.',
      'Los mensajes de la noche y el fin de semana se quedan sin responder y el paciente agenda en otro lado.',
      'Las citas que no se confirman terminan en huecos en tu agenda.',
    ],
    benefits: [
      'Contesta precios, tratamientos, formas de pago y ubicación con la información de tu consultorio.',
      'Agenda citas según tu horario real y deja anotado el motivo de la consulta.',
      'Detecta pacientes listos para agendar y te avisa para que les des seguimiento prioritario.',
    ],
    example: {
      user: '¿Cuánto cuesta una limpieza y tienen espacio esta semana?',
      bot: 'La limpieza dental cuesta $450 e incluye revisión. Esta semana tengo espacio el jueves a las 11:00 o el viernes a las 5:00 pm. ¿Cuál te aparto?',
    },
    faqs: [
      {
        q: '¿El bot da diagnósticos?',
        a: 'No. Responde dudas de precios, tratamientos y horarios, y agenda la valoración. El diagnóstico siempre lo da el dentista.',
      },
      {
        q: '¿Puede atender urgencias?',
        a: 'Cuando detecta una urgencia, como dolor fuerte o una infección, marca la conversación para que la atienda una persona del consultorio y te avisa.',
      },
    ],
  },
  {
    slug: 'clinicas-y-consultorios-medicos',
    industry: 'Clínicas y consultorios médicos',
    icon: 'shieldCheck',
    title: 'Bot de WhatsApp con IA para clínicas y consultorios médicos | RenBotIA',
    description:
      'Atiende por WhatsApp las dudas de tus pacientes, agenda consultas y orienta sobre especialidades y estudios las 24 horas, con un trato profesional.',
    h1: 'Atención por WhatsApp para tu clínica, sin saturar la recepción',
    lede: 'Un asistente con IA responde especialidades, costos de consulta, estudios y horarios, y agenda pacientes con criterio, mientras tu equipo atiende a quien está en la clínica.',
    pains: [
      'La recepción no alcanza a contestar teléfono, WhatsApp y a los pacientes presentes al mismo tiempo.',
      'Te preguntan mil veces lo mismo: costo de consulta, qué especialistas hay, si aceptan seguros.',
      'Los pacientes que escriben de noche no reciben respuesta hasta el día siguiente.',
    ],
    benefits: [
      'Responde especialidades, costos, preparación para estudios y horarios con la información de tu clínica.',
      'Agenda consultas por especialidad y deja los datos del paciente listos para confirmar.',
      'Pide ayuda a una persona cuando el caso lo requiere, en lugar de improvisar.',
    ],
    example: {
      user: '¿Cuánto cuesta la consulta con el pediatra y qué días viene?',
      bot: 'La consulta de pediatría cuesta $700. La pediatra atiende lunes, miércoles y viernes de 9:00 a 14:00. ¿Te agendo una cita para tu hijo?',
    },
    faqs: [
      {
        q: '¿El bot da indicaciones médicas?',
        a: 'No. Da información administrativa (costos, horarios, especialidades, preparación para estudios que tú definas) y agenda. Las indicaciones médicas las da tu equipo.',
      },
      {
        q: '¿Puedo pedir que ciertas preguntas las conteste una persona?',
        a: 'Sí. El bot escala a una persona cuando detecta un tema delicado, y tú puedes tomar cualquier conversación en modo manual desde la bandeja.',
      },
    ],
  },
  {
    slug: 'esteticas-y-barberias',
    industry: 'Estéticas, barberías y spas',
    icon: 'sparkles',
    title: 'Bot de WhatsApp con IA para estéticas, barberías y spas | RenBotIA',
    description:
      'Agenda citas, responde precios de cortes, uñas y tratamientos y llena tu agenda por WhatsApp, Instagram y tu sitio, aunque tengas las manos ocupadas.',
    h1: 'Tu agenda llena por WhatsApp, aunque estés atendiendo',
    lede: 'Mientras cortas, pintas o das un masaje, un asistente con IA responde precios y agenda la siguiente cita con el horario disponible.',
    pains: [
      'No puedes contestar el celular con las manos ocupadas y los mensajes se acumulan.',
      'Te preguntan los mismos precios todos los días: corte, tinte, uñas, faciales.',
      'Las citas que se agendan por mensaje se cruzan o se olvidan.',
    ],
    benefits: [
      'Responde precios, servicios, promociones y ubicación con tu forma de hablar.',
      'Agenda citas sin cruces y te deja la lista del día organizada.',
      'Atiende también los mensajes directos de Instagram, donde te descubren tus clientes.',
    ],
    example: {
      user: 'Hola, ¿cuánto el corte con barba? ¿Tienes hoy en la tarde?',
      bot: 'Corte con barba cuesta $200. Hoy tengo libre a las 5:30 y a las 7:00. ¿Te aparto alguna?',
    },
    faqs: [
      {
        q: '¿Puede atender mi Instagram?',
        a: 'Sí. El mismo bot responde WhatsApp, los mensajes directos de Instagram, Messenger y el chat de tu sitio web.',
      },
      {
        q: '¿Cómo aprende mis precios?',
        a: 'Puedes escribirlos o importar tus chats de WhatsApp: el bot aprende las preguntas que más te hacen y cómo las respondes tú.',
      },
    ],
  },
  {
    slug: 'inmobiliarias',
    industry: 'Inmobiliarias y asesores inmobiliarios',
    icon: 'home',
    title: 'Bot de WhatsApp con IA para inmobiliarias y asesores | RenBotIA',
    description:
      'Responde al instante por WhatsApp a quienes preguntan por tus propiedades, filtra prospectos por presupuesto y zona y agenda visitas las 24 horas.',
    h1: 'Responde cada prospecto inmobiliario en segundos',
    lede: 'Quien pregunta por una casa o un departamento escribe a varios asesores a la vez: el primero que responde se queda con el cliente. Tu asistente con IA responde al instante, califica y agenda la visita.',
    pains: [
      'Los anuncios generan decenas de mensajes y no alcanzas a contestar a tiempo.',
      'Muchos prospectos no tienen el presupuesto o buscan otra zona, y te quitan tiempo.',
      'Coordinar visitas por mensaje es un ir y venir interminable.',
    ],
    benefits: [
      'Responde precio, ubicación, metros, requisitos y formas de pago de cada propiedad.',
      'Pregunta presupuesto, zona y tipo de crédito, y te marca los prospectos calientes.',
      'Agenda visitas con tu disponibilidad y te deja los datos del interesado.',
    ],
    example: {
      user: 'Hola, ¿sigue disponible la casa de 3 recámaras? ¿Aceptan Infonavit?',
      bot: 'Sí, sigue disponible: 3 recámaras, 2 baños, $1,850,000, y sí aceptamos crédito Infonavit. ¿Te gustaría visitarla este sábado por la mañana?',
    },
    faqs: [
      {
        q: '¿Puede enviar fotos de las propiedades?',
        a: 'En el plan Elite el bot envía las imágenes que cargues (fachadas, planos, interiores) cuando el cliente las pide.',
      },
      {
        q: '¿Cómo sé quién está realmente interesado?',
        a: 'El bot detecta la intención de compra y marca esas conversaciones como leads calientes; además te avisa por correo para que llames primero a esos.',
      },
    ],
  },
  {
    slug: 'gimnasios',
    industry: 'Gimnasios y estudios fitness',
    icon: 'zap',
    title: 'Bot de WhatsApp con IA para gimnasios y estudios fitness | RenBotIA',
    description:
      'Responde por WhatsApp precios de mensualidad, horarios de clases y promociones, y convierte a quien pregunta en socio, las 24 horas.',
    h1: 'Convierte cada mensaje en un nuevo socio',
    lede: 'Quien pregunta por tu gimnasio quiere empezar ya. Tu asistente responde mensualidades, clases y horarios al momento e invita a la clase de prueba.',
    pains: [
      'Te escriben de noche o muy temprano y nadie contesta hasta horas después.',
      'Las mismas preguntas todo el día: mensualidad, inscripción, horarios de clases.',
      'Los interesados que no reciben respuesta rápida se inscriben en otro lado.',
    ],
    benefits: [
      'Responde mensualidades, inscripción, promociones y horarios de cada clase.',
      'Invita a la clase de prueba y deja anotado al interesado.',
      'Da seguimiento automático a quien preguntó y dejó de responder.',
    ],
    example: {
      user: '¿Cuánto es la mensualidad y a qué hora son las clases de spinning?',
      bot: 'La mensualidad es de $650 y la inscripción está en promoción este mes. Spinning es de lunes a viernes a las 7:00 am y 7:00 pm. ¿Quieres venir a una clase de prueba gratis?',
    },
    faqs: [
      {
        q: '¿Puede dar seguimiento a quien no se inscribió?',
        a: 'Sí. Con el seguimiento automático, el bot le escribe una vez a quien dejó de responder para retomar la conversación.',
      },
      {
        q: '¿Funciona en Instagram?',
        a: 'Sí. El mismo bot atiende WhatsApp, Instagram, Messenger y el chat de tu sitio web.',
      },
    ],
  },
  {
    slug: 'escuelas-y-cursos',
    industry: 'Escuelas, academias y cursos',
    icon: 'academic',
    title: 'Bot de WhatsApp con IA para escuelas, academias y cursos | RenBotIA',
    description:
      'Informa colegiaturas, horarios, requisitos de inscripción y fechas de inicio por WhatsApp y capta a los interesados las 24 horas.',
    h1: 'Inscripciones por WhatsApp, sin saturar a control escolar',
    lede: 'Padres y alumnos preguntan lo mismo en cada temporada de inscripción. Tu asistente con IA lo responde al instante y te deja a los interesados listos para inscribir.',
    pains: [
      'En temporada de inscripciones los mensajes se multiplican y nadie se da abasto.',
      'Colegiaturas, requisitos, horarios y fechas de inicio: siempre las mismas preguntas.',
      'Los interesados que no reciben respuesta a tiempo eligen otra escuela.',
    ],
    benefits: [
      'Responde colegiaturas, requisitos, horarios, becas y fechas de inicio.',
      'Agenda visitas o clases muestra y registra a los interesados.',
      'Marca como prioridad a quienes están listos para inscribirse.',
    ],
    example: {
      user: '¿Cuándo empieza el curso de inglés y cuánto cuesta?',
      bot: 'El siguiente grupo empieza el lunes 3. Son clases de lunes a jueves de 6 a 8 pm y la mensualidad es de $1,200. ¿Te aparto un lugar o prefieres una clase muestra?',
    },
    faqs: [
      {
        q: '¿Puede atender a muchos interesados al mismo tiempo?',
        a: 'Sí. Atiende a todos en paralelo, sin filas ni esperas, a cualquier hora.',
      },
      {
        q: '¿Puedo poner información distinta por nivel o curso?',
        a: 'Sí. Cargas la información de cada nivel o curso y el bot responde según lo que pregunte cada persona.',
      },
    ],
  },
  {
    slug: 'tiendas-en-linea',
    industry: 'Tiendas en línea y comercios',
    icon: 'cart',
    title: 'Bot de WhatsApp con IA para tiendas en línea y comercios | RenBotIA',
    description:
      'Responde existencias, precios, tallas, envíos y formas de pago por WhatsApp, Instagram y tu sitio, y toma pedidos las 24 horas.',
    h1: 'Vende por WhatsApp e Instagram aunque estés dormido',
    lede: 'Tus clientes preguntan antes de comprar. Tu asistente con IA responde precios, tallas, envíos y formas de pago al momento, y toma el pedido.',
    pains: [
      'Las ventas se pierden porque el cliente preguntó y nadie respondió a tiempo.',
      'Tallas, colores, envíos, formas de pago: respondes lo mismo decenas de veces.',
      'Los pedidos por mensaje se desordenan entre WhatsApp, Instagram y Facebook.',
    ],
    benefits: [
      'Responde catálogo, precios, tallas, envíos y métodos de pago con tu información.',
      'Toma pedidos y los deja organizados en tu panel para que solo confirmes.',
      'Atiende WhatsApp, Instagram, Messenger y tu sitio desde una sola bandeja.',
    ],
    example: {
      user: '¿Tienen la funda en negro para iPhone 16 y cuánto tarda el envío?',
      bot: 'Sí, la tenemos en negro a $349. El envío a todo México tarda de 2 a 4 días hábiles y es gratis en compras desde $599. ¿Te la aparto?',
    },
    faqs: [
      {
        q: '¿Puede mostrar fotos de los productos?',
        a: 'En el plan Elite el bot envía las fotos de tu catálogo cuando el cliente las pide.',
      },
      {
        q: '¿Se conecta con mi sitio web?',
        a: 'Sí. Pegas una línea de código en tu sitio y aparece un chat con el mismo bot, que también atiende WhatsApp e Instagram.',
      },
    ],
  },
];

export function getSolution(slug) {
  return SOLUTIONS.find((s) => s.slug === slug);
}
