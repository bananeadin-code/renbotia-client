import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El backend corre en :5000. Usamos un proxy en dev para llamar a /api sin CORS
// ni configurar URLs absolutas. En producción se sirve detrás del mismo dominio
// o se ajusta VITE_API_URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
