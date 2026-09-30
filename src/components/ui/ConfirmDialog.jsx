import { useConfirmStore } from '../../store/confirmStore.js';
import { Modal } from './Modal.jsx';
import { Button } from './index.jsx';
import { Icon } from './Icon.jsx';

/**
 * Host del diálogo de confirmación. Se monta UNA vez (en App). Escucha el store
 * y muestra un modal temático en lugar del confirm nativo del navegador.
 */
export function ConfirmDialog() {
  const state = useConfirmStore((s) => s.state);
  const resolve = useConfirmStore((s) => s.resolve);
  const o = state?.opts || {};
  const danger = o.tone === 'danger';

  return (
    <Modal
      open={Boolean(state)}
      onClose={() => resolve(false)}
      title={o.title || 'Confirmar acción'}
      size="sm"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            danger ? 'bg-red-500/10 text-red-600' : 'bg-brand-500/10 text-brand-600'
          }`}
        >
          <Icon name={danger ? 'alert' : 'checkCircle'} size={22} />
        </span>
        <p className="pt-1.5 text-sm leading-relaxed text-muted">{o.message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => resolve(false)}>
          {o.cancelLabel || 'Cancelar'}
        </Button>
        <Button autoFocus variant={danger ? 'danger' : 'primary'} onClick={() => resolve(true)}>
          {o.confirmLabel || 'Confirmar'}
        </Button>
      </div>
    </Modal>
  );
}
