/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Marca (emerald-teal refinado) — funciona en claro y oscuro
        brand: {
          50: '#ecfdf6',
          100: '#d1fae7',
          200: '#a7f0d1',
          300: '#6fe0b6',
          400: '#34c99a',
          500: '#12a97f',
          600: '#0e8a68',
          700: '#0c6f55',
          800: '#0d5844',
          900: '#0b4638',
        },
        // Tokens semánticos (cambian con el tema vía variables CSS en index.css)
        canvas: 'rgb(var(--canvas) / <alpha-value>)', // fondo de página
        surface: 'rgb(var(--surface) / <alpha-value>)', // cards/paneles
        surface2: 'rgb(var(--surface-2) / <alpha-value>)', // insets/hover
        fg: 'rgb(var(--fg) / <alpha-value>)', // texto principal
        muted: 'rgb(var(--muted) / <alpha-value>)', // texto secundario
        subtle: 'rgb(var(--subtle) / <alpha-value>)', // captions/placeholder
        line: 'rgb(var(--line) / <alpha-value>)', // bordes
        // Escala neutra estática (para casos puntuales)
        ink: { 400: '#94a3b8', 500: '#64748b', 700: '#334155', 900: '#0f172a' },
        whatsapp: {
          // Tema claro
          bg: '#efeae2',
          header: '#008069',
          bubbleIn: '#ffffff',
          bubbleOut: '#d9fdd3',
          // Tema oscuro (paleta oficial de WhatsApp dark)
          darkBg: '#0b141a',
          darkHeader: '#202c33',
          darkBubbleIn: '#202c33',
          darkBubbleOut: '#005c4b',
          darkText: '#e9edef',
          darkTime: '#8696a0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(2,6,23,.06)',
        elevated: '0 4px 12px -2px rgba(2,6,23,.10)',
        pop: '0 12px 32px -8px rgba(2,6,23,.18)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .4s ease-out both',
      },
    },
  },
  plugins: [],
};
