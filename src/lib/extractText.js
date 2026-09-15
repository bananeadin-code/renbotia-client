/**
 * Extrae TEXTO de un archivo para usarlo como documento de contexto del bot.
 *  - PDF: usa pdfjs-dist (import dinámico → solo se carga al subir un PDF).
 *  - txt / md / otros de texto: se leen directo.
 * Devuelve el texto (recortado a un máximo razonable).
 */
const MAX_CHARS = 20000; // tope por documento (coincide con la validación del backend)

export async function extractTextFromFile(file) {
  const name = file?.name || '';
  const type = file?.type || '';

  if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
    const pdfjs = await import('pdfjs-dist');
    // Worker autoservido (bundleado por Vite), compatible con la CSP del sitio.
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(' ') + '\n';
      if (text.length > MAX_CHARS) break;
    }
    return text.trim().slice(0, MAX_CHARS);
  }

  // Texto plano (txt, md, csv…).
  const raw = await file.text();
  return raw.trim().slice(0, MAX_CHARS);
}
