import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ErrorBoundary, reloadOnceForNewVersion } from './components/ui/ErrorBoundary.jsx';
import './styles/index.css';
import { captureAttribution } from './lib/attribution.js';
import { initTracking } from './lib/tracking.js';

// Origen de la visita (campaña/anuncio) y medición con consentimiento.
captureAttribution();
initTracking();

// Vite avisa cuando no pudo precargar un archivo (versión vieja tras un deploy).
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForNewVersion()) event.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
