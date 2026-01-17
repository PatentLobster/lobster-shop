import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import { loadRuntimeConfig } from './services/api';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Load runtime configuration before rendering the app
// This ensures we get backend URLs from environment, not build-time
loadRuntimeConfig()
  .then((config) => {
    console.log('✅ Runtime config loaded:', config);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error('❌ Failed to load runtime config:', error);
    // Render anyway with fallback config
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
