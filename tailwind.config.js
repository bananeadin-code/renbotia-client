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
        // Display con carácter (Space Grotesk) para títulos — sale de lo genérico
        // (Inter en todo) manteniendo un tono profesional para servicios B2B.
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
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
      // Curvas de easing fuertes (Emil Kowalski) como utilidades: ease-out-strong, etc.
      transitionTimingFunction: {
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Entrada para popovers/menús: nunca desde scale(0) (Emil).
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Bottom-sheet (móvil): sube desde abajo con curva estilo iOS.
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(0.23, 1, 0.32, 1) both',
        'scale-in': 'scale-in .18s cubic-bezier(0.23, 1, 0.32, 1) both',
        'slide-up': 'slide-up .35s cubic-bezier(0.32, 0.72, 0, 1) both',
      },
    },
  },
  plugins: [],
};
