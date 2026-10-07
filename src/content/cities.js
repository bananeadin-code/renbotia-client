/**
 * Ciudades de México para el SEO local por giro ("bot de WhatsApp para dentistas
 * en Monterrey"). Cada combinación giro × ciudad tiene su página con contenido
 * propio de la ciudad (no es una copia con el nombre cambiado): saludo y ejemplo
 * locales, ciudades cercanas y los demás giros de esa ciudad.
 *
 * Datos: nombre, estado y región (para enlazar ciudades cercanas). No inventamos
 * cifras locales: solo hechos verificables (estado, región, zona horaria).
 */
export const CITIES = [
  { slug: 'ciudad-de-mexico', name: 'Ciudad de México', state: 'CDMX', region: 'centro' },
  { slug: 'guadalajara', name: 'Guadalajara', state: 'Jalisco', region: 'occidente' },
  { slug: 'monterrey', name: 'Monterrey', state: 'Nuevo León', region: 'noreste' },
  { slug: 'puebla', name: 'Puebla', state: 'Puebla', region: 'centro' },
  { slug: 'queretaro', name: 'Querétaro', state: 'Querétaro', region: 'bajio' },
  { slug: 'leon', name: 'León', state: 'Guanajuato', region: 'bajio' },
  { slug: 'tijuana', name: 'Tijuana', state: 'Baja California', region: 'noroeste', timezone: 'Pacífico' },
  { slug: 'merida', name: 'Mérida', state: 'Yucatán', region: 'sureste' },
  { slug: 'cancun', name: 'Cancún', state: 'Quintana Roo', region: 'sureste', timezone: 'Sureste' },
  { slug: 'toluca', name: 'Toluca', state: 'Estado de México', region: 'centro' },
  { slug: 'chihuahua', name: 'Chihuahua', state: 'Chihuahua', region: 'norte' },
  { slug: 'ciudad-juarez', name: 'Ciudad Juárez', state: 'Chihuahua', region: 'norte' },
  { slug: 'aguascalientes', name: 'Aguascalientes', state: 'Aguascalientes', region: 'bajio' },
  { slug: 'san-luis-potosi', name: 'San Luis Potosí', state: 'San Luis Potosí', region: 'bajio' },
  { slug: 'hermosillo', name: 'Hermosillo', state: 'Sonora', region: 'noroeste', timezone: 'Sonora' },
  { slug: 'saltillo', name: 'Saltillo', state: 'Coahuila', region: 'noreste' },
  { slug: 'morelia', name: 'Morelia', state: 'Michoacán', region: 'occidente' },
  { slug: 'culiacan', name: 'Culiacán', state: 'Sinaloa', region: 'noroeste', timezone: 'Pacífico' },
  { slug: 'mazatlan', name: 'Mazatlán', state: 'Sinaloa', region: 'noroeste', timezone: 'Pacífico' },
  { slug: 'torreon', name: 'Torreón', state: 'Coahuila', region: 'norte' },
  { slug: 'durango', name: 'Durango', state: 'Durango', region: 'norte' },
  { slug: 'gomez-palacio', name: 'Gómez Palacio', state: 'Durango', region: 'norte' },
  { slug: 'zacatecas', name: 'Zacatecas', state: 'Zacatecas', region: 'norte' },
  { slug: 'veracruz', name: 'Veracruz', state: 'Veracruz', region: 'golfo' },
  { slug: 'xalapa', name: 'Xalapa', state: 'Veracruz', region: 'golfo' },
  { slug: 'villahermosa', name: 'Villahermosa', state: 'Tabasco', region: 'golfo' },
  { slug: 'oaxaca', name: 'Oaxaca', state: 'Oaxaca', region: 'sur' },
  { slug: 'tuxtla-gutierrez', name: 'Tuxtla Gutiérrez', state: 'Chiapas', region: 'sur' },
  { slug: 'acapulco', name: 'Acapulco', state: 'Guerrero', region: 'sur' },
  { slug: 'cuernavaca', name: 'Cuernavaca', state: 'Morelos', region: 'centro' },
  { slug: 'pachuca', name: 'Pachuca', state: 'Hidalgo', region: 'centro' },
  { slug: 'tepic', name: 'Tepic', state: 'Nayarit', region: 'occidente', timezone: 'Pacífico' },
  { slug: 'colima', name: 'Colima', state: 'Colima', region: 'occidente' },
  { slug: 'la-paz', name: 'La Paz', state: 'Baja California Sur', region: 'noroeste', timezone: 'Pacífico' },
  { slug: 'mexicali', name: 'Mexicali', state: 'Baja California', region: 'noroeste', timezone: 'Pacífico' },
  { slug: 'campeche', name: 'Campeche', state: 'Campeche', region: 'sureste' },
];

export function getCity(slug) {
  return CITIES.find((c) => c.slug === slug);
}

/** Ciudades de la misma región (para enlazado interno "cerca de ti"). */
export function nearbyCities(city, limit = 4) {
  return CITIES.filter((c) => c.region === city.region && c.slug !== city.slug).slice(0, limit);
}

/**
 * Textos locales de la página giro × ciudad. Se arman con datos reales de la
 * ciudad (nombre, estado, zona horaria) para que cada página diga algo propio.
 */
export function localCopy(sol, city) {
  const tz = city.timezone
    ? ` El bot respeta tu zona horaria (${city.timezone}) para tu horario de atención.`
    : '';
  return {
    title: `${sol.title.split(' | ')[0]} en ${city.name} | RenBotIA`,
    description: `${sol.description.replace(/\.$/, '')} Para negocios en ${city.name}, ${city.state}.`,
    h1: `${sol.h1} en ${city.name}`,
    lede: `${sol.lede} Pensado para ${sol.industry.toLowerCase()} de ${city.name}, ${city.state}.`,
    local: `En ${city.name}, como en todo México, tus clientes prefieren escribir por WhatsApp antes que llamar. Si un negocio de ${city.state} tarda horas en responder, el cliente pregunta en el siguiente. Con RenBotIA atiendes al instante, a cualquier hora, con la información y los precios de tu negocio en ${city.name}.${tz}`,
    faq: {
      q: `¿RenBotIA funciona para ${sol.industry.toLowerCase()} en ${city.name}?`,
      a: `Sí. Funciona en cualquier ciudad de México, incluida ${city.name}: conectas tu propio WhatsApp, Instagram, Messenger o tu sitio web, y el bot responde con los datos de tu negocio. No necesitas oficina ni equipo técnico; se configura en línea en minutos.`,
    },
  };
}
