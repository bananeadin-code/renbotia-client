import api from './axios.js';

/**
 * Descarga un archivo desde un endpoint autenticado (envía el token) y dispara
 * la descarga en el navegador. Se usa para exportar CSV (conversaciones, leads).
 *
 * @param {string} url        Ruta de la API (ej. '/conversations/export').
 * @param {string} filename   Nombre sugerido del archivo.
 */
export async function downloadFile(url, filename) {
  const res = await api.get(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}
