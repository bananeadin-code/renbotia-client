import { Children, Fragment, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from './clsx.js';
import { Icon } from './Icon.jsx';

/**
 * Lista de opciones a partir de los hijos (<option> y <optgroup>, como un
 * <select>). Una opción puede llevar `description` para una segunda línea.
 */
function parseOptions(children, group = null, out = []) {
  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) return parseOptions(child.props.children, group, out);
    if (child.type === 'optgroup') return parseOptions(child.props.children, child.props.label, out);
    if (child.type === 'option') {
      const label = Children.toArray(child.props.children).join('');
      out.push({
        value: String(child.props.value ?? label),
        label,
        description: child.props.description || '',
        disabled: Boolean(child.props.disabled),
        group,
      });
    }
  });
  return out;
}

/**
 * Select propio (no el desplegable del sistema): combina con el tema, muestra
 * grupos y descripciones, y se usa con el teclado (flechas, Inicio/Fin, Enter,
 * Escape y escribir para saltar). Misma API que un <select> controlado:
 * `value` + `onChange(e)` con `e.target.value` (texto). El menú se dibuja en
 * un portal para que no lo recorten los modales con scroll.
 */
export function Select({
  label,
  children,
  value,
  onChange,
  name,
  id,
  disabled = false,
  size = 'md',
  fullWidth = true,
  className = '',
  menuClassName = '',
  placeholder = 'Selecciona…',
  'aria-label': ariaLabel,
}) {
  const autoId = useId();
  const triggerId = id || `sel-${autoId}`;
  const listId = `${triggerId}-list`;
  const options = useMemo(() => parseOptions(children), [children]);
  const current = options.find((o) => o.value === String(value ?? ''));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: '', at: 0 });

  const enabledIdx = useMemo(() => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0), [options]);

  // Posición del menú (debajo del botón; arriba si no cabe).
  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const want = Math.min(288, options.length * 44 + 16);
    const below = window.innerHeight - r.bottom - 8;
    const up = below < want && r.top > below;
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 180) - 8)),
      width: r.width,
      top: up ? undefined : r.bottom + 6,
      bottom: up ? window.innerHeight - r.top + 6 : undefined,
      maxHeight: Math.max(160, (up ? r.top : below) - 8),
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (triggerRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    // Escape cierra solo el menú (en captura, antes que el modal que lo contiene).
    const onEsc = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onEsc, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onEsc, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  // Mantener visible la opción activa al navegar con el teclado.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, pos]);

  function openMenu() {
    if (disabled) return;
    const i = options.indexOf(current);
    setActive(i >= 0 && !options[i].disabled ? i : enabledIdx[0] ?? -1);
    setOpen(true);
  }

  function close(focus = true) {
    setOpen(false);
    if (focus) triggerRef.current?.focus();
  }

  function choose(i) {
    const o = options[i];
    if (!o || o.disabled) return;
    close();
    if (o.value !== String(value ?? '')) onChange?.({ target: { value: o.value, name }, currentTarget: { value: o.value, name } });
  }

  function move(delta) {
    if (!enabledIdx.length) return;
    const pos = enabledIdx.indexOf(active);
    const next = pos < 0 ? 0 : Math.min(enabledIdx.length - 1, Math.max(0, pos + delta));
    setActive(enabledIdx[next]);
  }

  // Escribir letras salta a la primera opción que empieza así.
  function typeahead(ch) {
    const now = Date.now();
    typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + ch.toLowerCase(), at: now };
    const q = typed.current.text;
    const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(q));
    if (i >= 0) {
      if (open) setActive(i);
      else choose(i);
    }
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      } else if (e.key.length === 1 && /\S/.test(e.key)) typeahead(e.key);
      return;
    }
    if (e.key === 'ArrowDown') (e.preventDefault(), move(1));
    else if (e.key === 'ArrowUp') (e.preventDefault(), move(-1));
    else if (e.key === 'Home') (e.preventDefault(), setActive(enabledIdx[0] ?? -1));
    else if (e.key === 'End') (e.preventDefault(), setActive(enabledIdx[enabledIdx.length - 1] ?? -1));
    else if (e.key === 'Enter' || e.key === ' ') (e.preventDefault(), choose(active));
    else if (e.key === 'Tab') close(false);
    else if (e.key.length === 1 && /\S/.test(e.key)) typeahead(e.key);
  }

  const shown = current || null;
  let lastGroup = null;

  const trigger = (
    <button
      ref={triggerRef}
      id={triggerId}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
      aria-label={label ? undefined : ariaLabel}
      disabled={disabled}
      onClick={() => (open ? close(false) : openMenu())}
      onKeyDown={onKeyDown}
      className={clsx(
        'group flex items-center gap-2 rounded-lg border bg-surface text-left text-fg outline-none transition',
        'hover:border-brand-300 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line',
        fullWidth && 'w-full',
        size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2.5 text-sm',
        open ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-line',
        className
      )}
    >
      <span className={clsx('min-w-0 flex-1 truncate', !shown && 'text-subtle')}>{shown ? shown.label : placeholder}</span>
      <Icon
        name="chevronRight"
        size={size === 'sm' ? 14 : 16}
        className={clsx('shrink-0 text-subtle transition-transform duration-150', open ? '-rotate-90' : 'rotate-90')}
      />
    </button>
  );

  const menu =
    open && pos
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={triggerId}
            style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.width, maxHeight: Math.min(288, pos.maxHeight) }}
            className={clsx(
              'z-[70] max-w-[min(22rem,calc(100vw-16px))] overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface p-1 shadow-elevated animate-scale-in',
              menuClassName
            )}
            onMouseDown={(e) => e.preventDefault() /* conservar el foco en el botón */}
          >
            {options.map((o, i) => {
              const header = o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              const selected = o === current;
              return (
                <Fragment key={`${o.group || ''}:${o.value}`}>
                  {header && (
                    <li role="presentation" className={clsx('px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-subtle', i > 0 ? 'mt-1 border-t border-line pt-2' : 'pt-1.5')}>
                      {header}
                    </li>
                  )}
                  <li
                    id={`${listId}-${i}`}
                    data-idx={i}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={o.disabled || undefined}
                    onMouseEnter={() => !o.disabled && setActive(i)}
                    onClick={() => choose(i)}
                    className={clsx(
                      'flex cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      o.disabled && 'cursor-not-allowed opacity-50',
                      i === active && !o.disabled ? 'bg-surface2' : '',
                      selected ? 'text-brand-700 dark:text-brand-300' : 'text-fg'
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={clsx('block', selected && 'font-semibold')}>{o.label}</span>
                      {o.description && <span className="mt-0.5 block text-xs leading-snug text-muted">{o.description}</span>}
                    </span>
                    {selected ? (
                      <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
                    ) : (
                      <span className="w-4 shrink-0" aria-hidden="true" />
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div className={label ? 'block' : 'contents'}>
      {label && (
        <label htmlFor={triggerId} className="mb-1 block text-sm font-medium text-fg">
          {label}
        </label>
      )}
      {trigger}
      {name && <input type="hidden" name={name} value={String(value ?? '')} />}
      {menu}
    </div>
  );
}
