import { create } from 'zustand';

/**
 * Estado del tema: 'light' | 'dark' | 'system'.
 * - Persiste la elección en localStorage.
 * - 'system' sigue la preferencia del dispositivo (prefers-color-scheme) y
 *   reacciona en vivo si el usuario la cambia.
 * - Aplica/quita la clase `dark` en <html> (Tailwind darkMode: 'class').
 *
 * El parpadeo inicial ya se evita con el script inline de index.html; aquí
 * solo mantenemos el estado sincronizado en runtime.
 */
const STORAGE_KEY = 'theme';
const mql = window.matchMedia('(prefers-color-scheme: dark)');

function resolveIsDark(pref) {
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  return mql.matches; // system
}

function apply(pref) {
  document.documentElement.classList.toggle('dark', resolveIsDark(pref));
}

const initial = localStorage.getItem(STORAGE_KEY) || 'system';

export const useThemeStore = create((set, get) => ({
  theme: initial, // preferencia elegida
  isDark: resolveIsDark(initial), // resultado efectivo

  setTheme(pref) {
    localStorage.setItem(STORAGE_KEY, pref);
    apply(pref);
    set({ theme: pref, isDark: resolveIsDark(pref) });
  },

  // Alterna claro↔oscuro de forma explícita (deja de seguir al sistema).
  toggle() {
    const next = get().isDark ? 'light' : 'dark';
    get().setTheme(next);
  },

  // Se llama una vez al montar la app para escuchar cambios del sistema.
  init() {
    const onChange = () => {
      if (get().theme === 'system') {
        apply('system');
        set({ isDark: mql.matches });
      }
    };
    mql.addEventListener('change', onChange);
    apply(get().theme);
  },
}));
