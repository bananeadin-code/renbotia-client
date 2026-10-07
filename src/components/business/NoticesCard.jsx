import { useEffect, useState } from 'react';
import { botConfigApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * Avisos temporales (Entrenamiento): información de hoy que el bot comunica a
 * los clientes y que vence sola ("hoy cerramos a las 4", "ya no hay pastel de
 * chocolate"). También se ponen desde el WhatsApp del dueño.
 */
const VALIDITY = [
  ['today', 'Hoy'],
  ['tomorrow', 'Hasta mañana'],
  ['week', 'Una semana'],
  ['none', 'Hasta que lo quite'],
];

function untilFor(kind) {
  const d = new Date();
  if (kind === 'today') d.setHours(23, 59, 0, 0);
  else if (kind === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
  } else if (kind === 'week') d.setDate(d.getDate() + 7);
  else return null;
  return d.toISOString();
}

const fmtUntil = (u) =>
  u
    ? `Vence ${new Date(u).toLocaleString('es-MX', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : 'Sin vencimiento';

export function NoticesCard({ canEdit = true }) {
  const [notices, setNotices] = useState(null);
  const [text, setText] = useState('');
  const [validity, setValidity] = useState('today');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    botConfigApi
      .notices()
      .then((d) => setNotices(d.notices))
      .catch(() => setNotices([]));
  }, []);

  async function add(e) {
    e.preventDefault();
    if (text.trim().length < 3) return toast.error('Escribe el aviso.');
    setSaving(true);
    try {
      const d = await botConfigApi.addNotice({ text: text.trim(), until: untilFor(validity) });
      setNotices(d.notices);
      setText('');
      toast.success('Aviso publicado. El bot ya lo sabe.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar el aviso.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      const d = await botConfigApi.removeNotice(id);
      setNotices(d.notices);
    } catch {
      toast.error('No se pudo quitar.');
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
          <Icon name="alert" size={18} />
        </span>
        <div>
          <h2 className="font-semibold text-fg">Avisos temporales</h2>
          <p className="mt-0.5 text-xs text-muted">
            Lo que cambia hoy: “cerramos a las 4”, “ya no hay pastel de chocolate”, “promo 2x1 este fin”. El bot lo dice a tus
            clientes y el aviso se quita solo. También puedes ponerlos desde tu WhatsApp.
          </p>
        </div>
      </div>

      {notices?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {notices.map((n) => (
            <li key={n.id} className="flex items-start gap-3 rounded-xl border border-line px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-fg">{n.text}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-subtle">
                  {fmtUntil(n.until)}
                  {n.via === 'whatsapp' && (
                    <span className="inline-flex items-center gap-1">
                      · <Icon name="whatsapp" size={11} /> desde WhatsApp
                    </span>
                  )}
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  aria-label="Quitar aviso"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-red-500/10 hover:text-red-500"
                >
                  <Icon name="trash" size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form onSubmit={add} noValidate className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            placeholder="Ej. Hoy cerramos a las 4 pm por inventario"
            aria-label="Nuevo aviso"
            className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
          />
          <select
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
            aria-label="Vigencia del aviso"
            className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none focus:border-brand-500"
          >
            {VALIDITY.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={saving} className="justify-center">
            {saving ? 'Publicando…' : 'Publicar'}
          </Button>
        </form>
      )}
    </Card>
  );
}
