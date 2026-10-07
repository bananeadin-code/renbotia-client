import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { learningApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { Card, Button } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * "Aprende de ti" en Entrenamiento: lo que el bot no supo, lo que calificaste mal
 * y lo que contestaste a mano en la bandeja. Con un clic se vuelve pregunta
 * frecuente. Si no hay nada pendiente, no ocupa espacio.
 *
 * @param {object} props
 * @param {(faq: {question:string, answer:string}) => void} props.onLearned  agrega la FAQ al estado local de la página
 */
const SOURCE = {
  agent: { label: 'Lo contestaste tú', icon: 'user', tone: 'text-brand-600 bg-brand-500/10' },
  rating: { label: 'Respuesta mal calificada', icon: 'thumbsDown', tone: 'text-amber-600 bg-amber-500/10' },
  escalation: { label: 'El bot no supo', icon: 'alert', tone: 'text-red-500 bg-red-500/10' },
};

export function LearningCard({ onLearned }) {
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState('');

  useEffect(() => {
    learningApi
      .list()
      .then((d) => {
        setItems(d.items || []);
        setTotal(d.total || 0);
        setDrafts(Object.fromEntries((d.items || []).map((s) => [s.id, { question: s.question, answer: s.answer || '' }])));
        if (window.location.hash === '#aprender' && d.items?.length) {
          setTimeout(() => document.getElementById('aprender')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        }
      })
      .catch(() => setItems([]));
  }, []);

  const remove = (id) => {
    setItems((prev) => prev.filter((s) => s.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  };

  async function accept(s) {
    const d = drafts[s.id] || {};
    if ((d.answer || '').trim().length < 2) {
      toast.error('Escribe la respuesta que debe dar el bot.');
      return;
    }
    setBusy(s.id);
    try {
      const res = await learningApi.accept(s.id, { question: d.question.trim(), answer: d.answer.trim() });
      onLearned?.(res.faq);
      remove(s.id);
      toast.success('Listo, el bot ya lo sabe.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar.');
    } finally {
      setBusy('');
    }
  }

  async function dismiss(s) {
    setBusy(s.id);
    try {
      await learningApi.dismiss(s.id);
      remove(s.id);
    } catch {
      toast.error('No se pudo descartar.');
    } finally {
      setBusy('');
    }
  }

  if (!items || items.length === 0) return null;

  return (
    <div id="aprender" className="scroll-mt-20">
    <Card className="border-brand-400/30">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
          <Icon name="sparkles" size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 font-semibold text-fg">
            Aprende de ti
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-600">
              {total} por enseñar
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Preguntas reales de tus clientes que el bot todavía no domina. Revisa la respuesta y enséñasela con un clic.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((s) => {
          const src = SOURCE[s.source] || SOURCE.escalation;
          const d = drafts[s.id] || { question: s.question, answer: '' };
          const set = (patch) => setDrafts((prev) => ({ ...prev, [s.id]: { ...d, ...patch } }));
          return (
            <li key={s.id} className="rounded-xl border border-line p-3 animate-fade-up">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${src.tone}`}>
                  <Icon name={src.icon} size={11} /> {src.label}
                </span>
                {s.chatId && (
                  <Link to="/dashboard/conversaciones" className="text-[11px] font-medium text-muted hover:text-fg">
                    Ver conversaciones
                  </Link>
                )}
              </div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-subtle" htmlFor={`lq-${s.id}`}>
                El cliente preguntó
              </label>
              <input
                id={`lq-${s.id}`}
                value={d.question}
                maxLength={500}
                onChange={(e) => set({ question: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
              />
              <label className="mt-2 block text-[11px] font-medium uppercase tracking-wide text-subtle" htmlFor={`la-${s.id}`}>
                El bot debe responder
              </label>
              <textarea
                id={`la-${s.id}`}
                rows={2}
                value={d.answer}
                maxLength={2000}
                onChange={(e) => set({ answer: e.target.value })}
                placeholder="Escribe la respuesta correcta…"
                className="mt-1 w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition focus:border-brand-500"
              />
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" disabled={busy === s.id} onClick={() => dismiss(s)}>
                  Descartar
                </Button>
                <Button size="sm" disabled={busy === s.id} onClick={() => accept(s)}>
                  <Icon name="check" size={15} />
                  {busy === s.id ? 'Guardando…' : 'Enseñar al bot'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
    </div>
  );
}
