/**
 * Documentos legales (Aviso de Privacidad + Términos y Condiciones). Plantillas
 * base orientadas a México (LFPDPPP). Datos: RenBotIA, operado por Damián,
 * contacto servicios@renbotia.com, dominio renbotia.com.
 *
 * NOTA para el operador: son una base razonable para un MVP; conviene que un
 * profesional legal las revise antes de escalar con clientes de paga.
 */
export const LEGAL = {
  privacidad: {
    slug: 'privacidad',
    title: 'Aviso de Privacidad',
    updated: '20 de agosto de 2026',
    description:
      'Aviso de Privacidad de RenBotIA: qué datos recabamos, para qué, con quién los compartimos y cómo ejercer tus derechos ARCO.',
    intro:
      'En RenBotIA valoramos tu privacidad. Este Aviso explica qué datos personales tratamos, con qué fines y cómo puedes ejercer tus derechos, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) de México.',
    sections: [
      {
        h: '1. Responsable de tus datos',
        p: [
          'El responsable del tratamiento de tus datos es Damián, quien opera el servicio “RenBotIA” (en adelante, “RenBotIA”, “nosotros”), con ubicación en Durango, México. Puedes contactarnos en cualquier momento en servicios@renbotia.com.',
        ],
      },
      {
        h: '2. Qué datos recabamos',
        p: ['Tratamos dos tipos de datos:'],
        ul: [
          'De la cuenta: tu nombre, correo electrónico, una contraseña (que guardamos cifrada) y los datos de tu negocio (nombre, giro, número de WhatsApp). Los datos de tu tarjeta los procesa directamente nuestro proveedor de pagos; RenBotIA no los almacena.',
          'Del funcionamiento del bot: el contenido de las conversaciones que tu bot atiende, que puede incluir datos que tus propios clientes proporcionen. Respecto de esos datos de terceros, tú eres el responsable y RenBotIA actúa como encargado que los trata por tu cuenta y siguiendo tus instrucciones.',
          'No recabamos de forma deliberada datos personales sensibles.',
        ],
      },
      {
        h: '3. Para qué usamos tus datos',
        p: ['Finalidades primarias (necesarias para el servicio):'],
        ul: [
          'Crear y administrar tu cuenta y tu negocio.',
          'Operar el bot y el simulador con la información que configuras.',
          'Procesar tus pagos y enviarte comprobantes.',
          'Darte soporte y avisarte de eventos del servicio (por ejemplo, crédito bajo).',
        ],
        p2: [
          'Finalidades secundarias: mejorar el servicio y comunicarte novedades. Puedes oponerte a estas últimas escribiéndonos a servicios@renbotia.com sin que afecte tu uso del servicio.',
        ],
      },
      {
        h: '4. Con quién compartimos datos',
        p: [
          'Nos apoyamos en proveedores que tratan datos por nuestra cuenta (encargados) únicamente para prestar el servicio: procesamiento de inteligencia artificial (Anthropic — Claude), pagos (Stripe), envío de correos (Resend), alojamiento y base de datos y, en el futuro, la plataforma de mensajería de WhatsApp (Meta). No vendemos tus datos personales a terceros.',
        ],
      },
      {
        h: '5. Tus derechos ARCO',
        p: [
          'Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos, así como a revocar tu consentimiento. Para ejercerlos, escríbenos a servicios@renbotia.com indicando tu solicitud y un medio para contactarte; atenderemos tu petición en los plazos que marca la ley.',
        ],
      },
      {
        h: '6. Cookies y almacenamiento local',
        p: [
          'Usamos almacenamiento local del navegador para recordar tu sesión y tus preferencias (como el tema claro u oscuro). No usamos cookies de publicidad de terceros.',
        ],
      },
      {
        h: '7. Conservación de los datos',
        p: [
          'Conservamos tus datos mientras tu cuenta esté activa y durante el tiempo necesario para cumplir obligaciones legales. Si cierras tu cuenta, eliminaremos o anonimizaremos tus datos salvo que la ley exija conservarlos.',
        ],
      },
      {
        h: '8. Cambios a este aviso',
        p: [
          'Podemos actualizar este Aviso de Privacidad. Publicaremos la versión vigente en renbotia.com/privacidad, indicando la fecha de la última actualización.',
        ],
      },
      {
        h: '9. Consentimiento',
        p: [
          'Al registrarte y usar RenBotIA, manifiestas que leíste y aceptas este Aviso de Privacidad.',
        ],
      },
    ],
  },

  terminos: {
    slug: 'terminos',
    title: 'Términos y Condiciones',
    updated: '20 de agosto de 2026',
    description:
      'Términos y Condiciones de uso de RenBotIA: qué es el servicio, planes y pagos, uso aceptable, contenido generado por IA y responsabilidades.',
    intro:
      'Estos Términos y Condiciones regulan el uso de RenBotIA. Al crear una cuenta o utilizar el servicio, aceptas estos términos en su totalidad.',
    sections: [
      {
        h: '1. El servicio',
        p: [
          'RenBotIA ofrece un asistente de atención por WhatsApp con inteligencia artificial que responde con la información que tú configuras para tu negocio, además de un simulador para probarlo, herramientas de entrenamiento, planes de suscripción y paquetes de créditos.',
        ],
      },
      {
        h: '2. Tu cuenta',
        p: [
          'Eres responsable de la veracidad de la información que proporcionas y del resguardo de tus credenciales. Cualquier actividad realizada desde tu cuenta se presume hecha por ti. Avísanos de inmediato a servicios@renbotia.com si detectas un uso no autorizado.',
        ],
      },
      {
        h: '3. Planes, créditos y pagos',
        p: [
          'Ofrecemos planes de suscripción y paquetes de créditos (tokens de uso), en pesos mexicanos, procesados por nuestro proveedor de pagos (Stripe). Los créditos se consumen conforme al uso del bot. Salvo que la ley disponga lo contrario, los pagos no son reembolsables. Puedes cancelar la renovación cuando quieras; conservarás el acceso hasta que termine el periodo ya pagado.',
        ],
      },
      {
        h: '4. Uso aceptable',
        p: ['No puedes usar RenBotIA para:'],
        ul: [
          'Actividades ilícitas, fraudulentas o engañosas.',
          'Envío de mensajes masivos no solicitados (spam) o comunicaciones sin el consentimiento de las personas destinatarias.',
          'Recabar datos personales sin fundamento legal, o violar la privacidad de terceros.',
        ],
        p2: [
          'Eres responsable del contenido con el que entrenas tu bot y de cumplir las políticas de WhatsApp/Meta y las leyes aplicables, incluida la obtención del consentimiento de las personas que contactes.',
        ],
      },
      {
        h: '5. Contenido generado por IA',
        p: [
          'Las respuestas del bot se generan de forma automática mediante inteligencia artificial y pueden contener imprecisiones. Debes supervisarlas y no depender de ellas para decisiones críticas (por ejemplo, legales, médicas o financieras). RenBotIA no es responsable por las respuestas que tu bot proporcione a tus clientes ni por las decisiones que se tomen con base en ellas.',
        ],
      },
      {
        h: '6. Disponibilidad del servicio',
        p: [
          'El servicio se ofrece “tal cual” y “según disponibilidad”. Procuramos una alta disponibilidad, pero no garantizamos que sea ininterrumpido o libre de errores, especialmente durante esta etapa temprana del producto.',
        ],
      },
      {
        h: '7. Propiedad intelectual',
        p: [
          'El software, la marca y los elementos de RenBotIA son de nuestra propiedad. El contenido que tú cargas (FAQs, textos, imágenes) es tuyo; nos otorgas una licencia limitada para procesarlo con el único fin de operar el servicio para ti.',
        ],
      },
      {
        h: '8. Limitación de responsabilidad',
        p: [
          'En la máxima medida que permita la ley, RenBotIA no será responsable por daños indirectos, incidentales o pérdida de ganancias. Nuestra responsabilidad total frente a ti se limita al monto que hayas pagado por el servicio en los tres meses previos al evento que originó la reclamación.',
        ],
      },
      {
        h: '9. Terminación',
        p: [
          'Puedes dejar de usar el servicio y cancelar tu plan en cualquier momento. Podemos suspender o cancelar cuentas que incumplan estos términos.',
        ],
      },
      {
        h: '10. Cambios a los términos',
        p: [
          'Podemos actualizar estos términos. La versión vigente se publicará en renbotia.com/terminos. El uso continuado del servicio implica la aceptación de los cambios.',
        ],
      },
      {
        h: '11. Ley aplicable y jurisdicción',
        p: [
          'Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a los tribunales competentes de la ciudad de Durango, Durango, renunciando a cualquier otro fuero.',
        ],
      },
      {
        h: '12. Contacto',
        p: ['Para dudas sobre estos términos, escríbenos a servicios@renbotia.com.'],
      },
    ],
  },
};

export function getLegal(slug) {
  return LEGAL[slug];
}
