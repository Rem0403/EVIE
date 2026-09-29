import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { missingConfig } from './lib/config.js';
import './styles.css';
import { applyPalette, applyTheme, loadPalette, loadTheme } from './lib/theme.js';

// Apply the saved Light / Dark choice before the first paint, so the wrong theme never flashes.
applyTheme(loadTheme());
applyPalette(loadPalette());

// Offline app shell and home-screen install. Dev skips it so edits always show.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => console.error('service worker', err));
}

const root = ReactDOM.createRoot(document.getElementById('root'));
const missing = missingConfig(import.meta.env);

// firebase.js throws on import without config, before any error boundary can catch it,
// so only load the app once the config is known to be there.
if (missing.length) {
  root.render(
    <div className="center">
      <p>EVIE isn't configured yet.</p>
      <p className="muted small">Add these to .env.local and restart: {missing.join(', ')}</p>
    </div>,
  );
} else {
  import('./App.jsx').then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
  });
}
