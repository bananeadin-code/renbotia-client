import { Fragment } from 'react';

/**
 * Muestra un texto con el formato de WhatsApp (*negrita*, _cursiva_, ~tachado~)
 * como se ve en el teléfono, en vez de enseñar los símbolos. Solo crea elementos
 * de React (nunca HTML crudo), así que es seguro con texto de clientes.
 */
const TOKEN = /(^|[\s(¡¿"'])([*_~])(?=\S)([^\n]*?\S)\2(?=$|[\s.,;:!?)"'])/g;
const TAG = { '*': 'strong', _: 'em', '~': 's' };

function renderLine(line, key) {
  const out = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const [whole, before, mark, inner] = m;
    const start = m.index + before.length;
    if (start > last) out.push(line.slice(last, start));
    const Tag = TAG[mark];
    out.push(<Tag key={`${key}-${m.index}`}>{inner}</Tag>);
    last = m.index + whole.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export function WaText({ text }) {
  const lines = String(text || '').split('\n');
  return lines.map((line, i) => (
    <Fragment key={i}>
      {renderLine(line, i)}
      {i < lines.length - 1 && '\n'}
    </Fragment>
  ));
}
