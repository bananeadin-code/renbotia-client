import { Component } from 'react';
import { Icon } from './Icon.jsx';

/**
 * Tras un deploy, los archivos de la versión anterior dejan de existir: si alguien
 * tenía la app abierta y entra a otra sección, la descarga falla. En ese caso se
 * recarga UNA vez (marca en sessionStorage para no entrar en bucle).
 */
const RELOAD_KEY = 'rb_chunk_reload';

export function isChunkLoadError(err) {
  const msg = String(err?.message || err || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(msg);
}

export function reloadOnceForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (Date.now() - last < 60_000) return false; // ya se intentó hace poco
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* sin sessionStorage: se recarga igual */
  }
  window.location.reload();
  return true;
}

/** Último recurso: cualquier error de render muestra esto en vez de una pantalla en blanco. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error) && reloadOnceForNewVersion()) return;
    // eslint-disable-next-line no-console
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const update = isChunkLoadError(this.state.error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-surface2 text-muted">
            <Icon name={update ? 'refresh' : 'alert'} size={24} />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-fg">
            {update ? 'Hay una versión nueva de RenBotIA' : 'Algo no salió como esperábamos'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {update
              ? 'Recarga la página para seguir con la versión más reciente. No pierdes nada de lo que ya guardaste.'
              : 'Recarga la página para continuar. Si vuelve a pasar, escríbenos a servicios@renbotia.com.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-fg px-4 text-sm font-semibold text-canvas transition hover:opacity-90"
            >
              <Icon name="refresh" size={16} /> Recargar
            </button>
            <a
              href="/"
              className="inline-flex min-h-[40px] items-center rounded-md border border-line px-4 text-sm font-medium text-fg transition hover:bg-surface2"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }
}
