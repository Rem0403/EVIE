import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { missingConfig } from './lib/config.js';
import './styles.css';

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
