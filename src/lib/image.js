/**
 * Comprime una imagen a un avatar pequeño (JPEG data URI) para la foto del
 * negocio. Reduce a MAX_DIM px por lado y baja la calidad hasta caber en
 * MAX_BYTES, para no inflar el documento en la base de datos. Todo en el cliente.
 */
const MAX_DIM = 160;
const MAX_BYTES = 90_000; // ~90 KB de data URI (por debajo del tope del backend)

export function fileToAvatarDataUri(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('La imagen no es válida.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        let q = 0.85;
        let uri = canvas.toDataURL('image/jpeg', q);
        while (uri.length > MAX_BYTES && q > 0.4) {
          q -= 0.1;
          uri = canvas.toDataURL('image/jpeg', q);
        }
        resolve(uri);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Prepara una foto para enviarla al bot (chat del sitio): la reduce a 1600 px
 * por lado y la recomprime en JPEG hasta ~3 MB. Devuelve base64 SIN prefijo
 * (como lo espera la API) y la vista previa como data URI.
 * @returns {Promise<{ mediaType: string, data: string, preview: string }>}
 */
export function compressImageForUpload(file, maxDim = 1600, maxBytes = 3_000_000) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('La imagen no es válida.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        let q = 0.85;
        let uri = canvas.toDataURL('image/jpeg', q);
        while (uri.length * 0.75 > maxBytes && q > 0.4) {
          q -= 0.1;
          uri = canvas.toDataURL('image/jpeg', q);
        }
        resolve({ mediaType: 'image/jpeg', data: uri.split(',')[1], preview: uri });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Lee un archivo como base64 sin prefijo (p. ej. un PDF). */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(file);
  });
}
