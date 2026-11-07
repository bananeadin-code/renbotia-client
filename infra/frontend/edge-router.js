// GENERADO por scripts/gen-edge-router.mjs — no editar a mano.
// CloudFront Function (cloudfront-js-2.0), evento viewer-request.
var PAGES = {"/":1,"/blog":1,"/contacto":1,"/eliminar-datos":1,"/login":1,"/precios":1,"/privacidad":1,"/registro":1,"/soluciones":1,"/status":1,"/terminos":1};
var GIROS = {"agencias-marketing":1,"clinicas-y-consultorios-medicos":1,"consultoras":1,"consultorios-dentales":1,"despachos-contables":1,"despachos-legales":1,"escuelas-y-cursos":1,"esteticas-y-barberias":1,"gimnasios":1,"inmobiliarias":1,"restaurantes":1,"tiendas-en-linea":1};
var CIUDADES = {"acapulco":1,"aguascalientes":1,"campeche":1,"cancun":1,"chihuahua":1,"ciudad-de-mexico":1,"ciudad-juarez":1,"colima":1,"cuernavaca":1,"culiacan":1,"durango":1,"gomez-palacio":1,"guadalajara":1,"hermosillo":1,"la-paz":1,"leon":1,"mazatlan":1,"merida":1,"mexicali":1,"monterrey":1,"morelia":1,"oaxaca":1,"pachuca":1,"puebla":1,"queretaro":1,"saltillo":1,"san-luis-potosi":1,"tepic":1,"tijuana":1,"toluca":1,"torreon":1,"tuxtla-gutierrez":1,"veracruz":1,"villahermosa":1,"xalapa":1,"zacatecas":1};
var BLOG = {"atencion-cliente-whatsapp-pymes-mexico":1,"automatizar-atencion-whatsapp-negocio":1,"bot-whatsapp-restaurantes-cafeterias":1,"que-preguntas-debe-responder-bot-whatsapp":1,"responder-whatsapp-fuera-de-horario":1,"senales-negocio-necesita-bot-whatsapp":1,"whatsapp-negocios-durango-guia-local":1};
var API_ORIGIN = 'https://api.renbotia.com';
var APEX = 'renbotia.com';

function qs(q) {
  var parts = [];
  for (var k in q) {
    var v = q[k];
    if (v.multiValue) {
      for (var i = 0; i < v.multiValue.length; i++) parts.push(k + '=' + v.multiValue[i].value);
    } else {
      parts.push(v.value === '' ? k : k + '=' + v.value);
    }
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function redirect(code, location) {
  return { statusCode: code, statusDescription: code === 301 ? 'Moved Permanently' : 'Found', headers: { location: { value: location } } };
}

function handler(event) {
  var req = event.request;
  var uri = req.uri;
  var host = req.headers.host ? req.headers.host.value : '';

  // www → dominio principal
  if (host.indexOf('www.') === 0) return redirect(301, 'https://' + APEX + uri + qs(req.querystring));

  // API (media y widget los atiende CloudFront con Render como origen)
  if (uri.indexOf('/api/') === 0) return redirect(302, API_ORIGIN + uri + qs(req.querystring));

  // Archivos (tienen extensión): se sirven tal cual desde S3
  var last = uri.substring(uri.lastIndexOf('/') + 1);
  if (last.indexOf('.') !== -1) return req;

  // Sin diagonal final (salvo la raíz)
  var p = uri.length > 1 && uri.charAt(uri.length - 1) === '/' ? uri.slice(0, -1) : uri;
  var seg = p.split('/'); // ['', 'soluciones', 'giro', 'ciudad']

  var pre =
    PAGES[p] ||
    (seg[1] === 'soluciones' && GIROS[seg[2]] && (seg.length === 3 || (seg.length === 4 && CIUDADES[seg[3]]))) ||
    (seg[1] === 'bot-whatsapp' && seg.length === 3 && CIUDADES[seg[2]]) ||
    (seg[1] === 'blog' && seg.length === 3 && BLOG[seg[2]]);

  req.uri = pre ? (p === '/' ? '/index.html' : p + '/index.html') : '/app.html';
  return req;
}
