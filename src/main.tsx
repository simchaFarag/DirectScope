import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import App from './App';
import { StoreProvider } from './data/store';
import { ToastProvider } from './components/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initNativeApp } from './lib/native';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
void initNativeApp();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* toasts wrap the store so failed server saves can be reported */}
      <ToastProvider>
        <ErrorBoundary>
          <StoreProvider>
            <ScrollToTop />
            <App />
          </StoreProvider>
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
