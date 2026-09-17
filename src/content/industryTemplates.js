/**
 * Plantillas de arranque por giro: preguntas frecuentes y datos base para que el
 * usuario NO empiece de cero. Se aplican en Entrenamiento (reemplazan FAQs y
 * servicios; el usuario revisa y ajusta antes de guardar). Compiten con el
 * "setup en 72h" de la competencia mejorando la primera impresión.
 */
export const INDUSTRY_TEMPLATES = [
  {
    key: 'legal',
    label: 'Despacho legal',
    botName: 'Asistente Legal',
    tone: 'formal',
    services: ['Consulta legal inicial', 'Contratos', 'Trámites'],
    faqs: [
      { question: '¿Cuánto cuesta una consulta?', answer: 'La consulta inicial tiene un costo accesible y es deducible si contratas nuestros servicios. Con gusto te agendo una cita.' },
      { question: '¿Qué áreas manejan?', answer: 'Atendemos derecho civil, mercantil y laboral. Cuéntame brevemente tu caso y te oriento.' },
      { question: '¿Cuál es su horario de atención?', answer: 'Atendemos de lunes a viernes, de 9:00 a 18:00 h.' },
    ],
  },
  {
    key: 'contable',
    label: 'Contable / fiscal',
    botName: 'Asistente Contable',
    tone: 'formal',
    services: ['Declaraciones mensuales', 'Contabilidad', 'Asesoría fiscal'],
    faqs: [
      { question: '¿Llevan mi contabilidad completa?', answer: 'Sí, llevamos tu contabilidad, declaraciones mensuales y anuales. Cuéntame tu régimen y te doy más detalle.' },
      { question: '¿Cuánto cobran al mes?', answer: 'Depende de tu volumen y régimen. Con gusto agendamos una llamada para darte una cotización a tu medida.' },
      { question: '¿Atienden RESICO y personas físicas?', answer: 'Sí, atendemos personas físicas, RESICO y morales. Dime tu caso y te oriento.' },
    ],
  },
  {
    key: 'consultoria',
    label: 'Consultoría',
    botName: 'Asistente',
    tone: 'cercano',
    services: ['Consultoría', 'Diagnóstico inicial', 'Acompañamiento'],
    faqs: [
      { question: '¿En qué pueden ayudarme?', answer: 'Te acompañamos a resolver retos concretos de tu negocio. Cuéntame qué necesitas y te digo cómo lo abordamos.' },
      { question: '¿Cómo empieza el proceso?', answer: 'Empezamos con un diagnóstico inicial sin costo para entender tu situación y proponerte un plan.' },
      { question: '¿Cuánto dura un proyecto?', answer: 'Depende del alcance; la mayoría va de unas semanas a un par de meses. Agendamos una llamada y lo definimos.' },
    ],
  },
  {
    key: 'agencia',
    label: 'Agencia',
    botName: 'Asistente',
    tone: 'cercano',
    services: ['Redes sociales', 'Publicidad', 'Diseño'],
    faqs: [
      { question: '¿Qué servicios ofrecen?', answer: 'Manejamos redes sociales, campañas de publicidad y diseño. Dime qué buscas y armamos una propuesta.' },
      { question: '¿Manejan el presupuesto de anuncios?', answer: 'Sí, gestionamos tus campañas y su presupuesto para sacarles el mejor rendimiento.' },
      { question: '¿Tienen paquetes?', answer: 'Sí, tenemos paquetes según tus objetivos. Con gusto te comparto opciones.' },
    ],
  },
  {
    key: 'restaurante',
    label: 'Restaurante',
    botName: 'Asistente',
    tone: 'cercano',
    services: ['Reservaciones', 'Menú', 'Pedidos para llevar'],
    faqs: [
      { question: '¿Puedo reservar una mesa?', answer: '¡Claro! Dime para cuántas personas, qué día y a qué hora, y te ayudo a reservar.' },
      { question: '¿Cuál es su horario?', answer: 'Abrimos todos los días; con gusto te confirmo el horario de hoy.' },
      { question: '¿Tienen servicio para llevar?', answer: 'Sí, puedes ordenar para llevar. Dime qué se te antoja y te ayudo con tu pedido.' },
    ],
  },
  {
    key: 'cafeteria',
    label: 'Cafetería',
    botName: 'Asistente',
    tone: 'cercano',
    services: ['Pedidos para llevar', 'Menú y bebidas', 'Cafetería de especialidad'],
    faqs: [
      { question: '¿Cuál es su horario?', answer: 'Con gusto te confirmo el horario de hoy. Por lo general abrimos desde temprano; dime a qué hora piensas venir.' },
      { question: '¿Tienen opciones sin azúcar o veganas?', answer: 'Sí, manejamos opciones sin azúcar y alternativas de leche vegetal. Dime qué buscas y te recomiendo.' },
      { question: '¿Puedo ordenar para llevar?', answer: '¡Claro! Dime qué se te antoja y a qué hora pasas, y te dejo tu pedido listo.' },
    ],
  },
];
