import { useCallback, useEffect, useRef, useState } from 'react';
import { ownerControlApi } from '../../api/endpoints.js';
import { toast } from '../../store/toastStore.js';
import { confirm } from '../../store/confirmStore.js';
import { Card, Button, Notice } from '../ui/index.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * "Maneja tu bot desde tu WhatsApp" (Conexiones → WhatsApp, solo el dueño).
 * Genera un código de un solo uso y abre WhatsApp con el código ya escrito para
 * enviarlo al número del bot desde el celular a vincular. Mientras el código
 * está vigente, se revisa cada pocos segundos si ya quedó vinculado.
 */
const EXAMPLES = ['¿Cómo vamos hoy?', 'Pásame los leads', 'Pausa el bot hasta las 6', 'Hoy cerramos a las 4'];

export function OwnerControlCard() {
  const [state, setState] = useState(null);
  const [code, setCode] = useState(null); // { code, waLink, expiresAt, botNumber }
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const linkedCount = useRef(0);

  const load = useCallback(async () => {
    const d = await ownerControlApi.get();
    setState(d);
    return d;
  }, []);

  useEffect(() => {
    load().then((d) => (linkedCount.current = d.linked.length)).catch(() => setState({ error: true }));
  }, [load]);

  // Con un código vigente: cuenta regresiva y revisión de si ya se vinculó.
  useEffect(() => {
    if (!code) return undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      try {
        const d = await load();
        if (d.linked.length > linkedCount.current) {
          linkedCount.current = d.linked.length;
          setCode(null);
          toast.success('¡Listo! Tu WhatsApp ya maneja el bot.');
        }
      } catch {
        /* reintenta */
      }
    }, 4000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [code, load]);

  async function generate() {
    setBusy(true);
    try {
      const c = await ownerControlApi.linkCode();
      setCode(c);
      if (c.waLink) window.open(c.waLink, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo generar el código.');
    } finally {
      setBusy(false);
    }
  }

  async function unlink(item) {
    const ok = await confirm({
      title: 'Desvincular número',
      message: `${item.number} dejará de manejar el bot por WhatsApp. ¿Continuar?`,
      tone: 'danger',
      confirmLabel: 'Desvincular',
    });
    if (!ok) return;
    try {
      await ownerControlApi.unlink(item.id);
      const d = await load();
      linkedCount.current = d.linked.length;
      toast.success('Número desvinculado.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo desvincular.');
    }
  }

  if (!state || state.error) return null;
  const secondsLeft = code ? Math.max(0, Math.round((new Date(code.expiresAt).getTime() - now) / 1000)) : 0;
  const expired = code && secondsLeft === 0;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <Icon name="phone" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-fg">Maneja tu bot desde tu WhatsApp</h2>
          <p className="mt-0.5 text-sm text-muted">
            Escríbele al número de tu bot desde tu celular y te contesta como tu asistente: resultados, leads, pausar el bot,
            avisos del día y nuevas respuestas.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((e) => (
              <span key={e} className="rounded-full bg-surface2 px-2.5 py-0.5 text-xs text-muted">
                “{e}”
              </span>
            ))}
          </div>
        </div>
      </div>

      {state.linked.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {state.linked.map((o) => (
            <li key={o.id} className="flex items-center gap-3 px-3 py-2.5">
              <Icon name="checkCircle" size={16} className="shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-fg tabular">{o.number}</div>
                <div className="text-xs text-subtle">
                  Último uso: {new Date(o.lastUsedAt || o.linkedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => unlink(o)} className="text-red-500 hover:bg-red-500/10">
                Desvincular
              </Button>
            </li>
          ))}
        </ul>
      )}

      {code && !expired ? (
        <div className="mt-4 rounded-xl border border-brand-400/40 bg-brand-500/[0.05] p-4 animate-fade-up">
          <p className="text-sm text-fg">
            Envía este código <strong>desde el celular que quieres vincular</strong> al número de tu bot
            {code.botNumber ? ` (${code.botNumber})` : ''}:
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-surface px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-fg">{code.code}</span>
            <span className="text-xs text-subtle">
              Vence en {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </span>
          </div>
          {code.waLink && (
            <a
              href={code.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Icon name="whatsapp" size={16} /> Abrir WhatsApp con el código
            </a>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <Icon name="spinner" size={12} className="animate-spin" /> Esperando tu mensaje…
          </p>
        </div>
      ) : (
        state.linked.length < state.maxNumbers &&
        (state.whatsappConnected ? (
          <div className="mt-4">
            <Button onClick={generate} disabled={busy}>
              <Icon name="link" size={16} /> {state.linked.length ? 'Vincular otro número' : 'Vincular mi WhatsApp'}
            </Button>
            {expired && <p className="mt-2 text-xs text-amber-600">El código venció. Genera uno nuevo.</p>}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Conecta primero el WhatsApp de tu negocio.</p>
        ))
      )}

      <Notice variant="security" className="mt-4">
Solo el dueño puede vincular números (máximo {state.maxNumbers}). Los cambios piden que respondas “sí”, quedan en la
          bitácora y la vinculación vence tras 30 días sin uso. Para probar tu bot como cliente escribe “modo cliente”.
</Notice>
    </Card>
  );
}
