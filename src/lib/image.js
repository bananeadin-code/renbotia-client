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
