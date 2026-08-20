import { useThemeStore } from '../../store/themeStore.js';
import { Icon } from './Icon.jsx';

/**
 * Botón visible para alternar claro/oscuro. Muestra el ícono del tema al que
 * cambiará (sol en oscuro, luna en claro). El tema inicial sigue al sistema.
 */
export function ThemeToggle({ className = '' }) {
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg ${className}`}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
