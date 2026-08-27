import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { AuthProvider } from './features/auth/AuthProvider';
import { LanguageProvider } from './i18n/LanguageProvider';
import './index.css';
import { createQueryClient } from './lib/query-client';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root was not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={createQueryClient()}>
      {/* Vite's base path, so the router agrees with the asset URLs when the
          app is served from a sub-path (an IIS application, say). */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          {/* Inside AuthProvider: crossing the sign-in boundary resets the
              language, so login and the signed-in app both start in Thai. */}
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
