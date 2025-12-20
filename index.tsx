
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { I18nProvider } from './context/I18nContext';
import { DeviceProvider } from './context/DeviceContext';
import { DatabaseInitializer } from './components/DatabaseInitializer';
import { ErrorBoundary } from './components/ErrorBoundary';

// Service Worker management
// Importante: em desenvolvimento NÃO fazemos nada com service workers
// para evitar qualquer erro/ruído no console. Só registramos em produção.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Production: Register service worker
  navigator.serviceWorker.getRegistrations().then((registrations) => {
      // First, unregister ALL existing service workers to force fresh start
      registrations.forEach((registration) => {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[SW] Service Worker unregistered');
          }
        });
      });
      
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName).then((success) => {
              if (success) {
                console.log('[SW] Cache deleted:', cacheName);
              }
            });
          });
        });
      }
      
      // Register new service worker after cleanup
      setTimeout(() => {
        navigator.serviceWorker
          .register('/service-worker.js?v=' + Date.now(), { 
            updateViaCache: 'none',
            scope: '/' 
          })
          .then((registration) => {
            if (registration) {
              console.log('[SW] Service Worker registered successfully');
              // Force immediate update if method exists
              if (registration.update && typeof registration.update === 'function') {
                registration.update();
              }
              // Check for updates every 5 minutes
              setInterval(() => {
                if (registration && registration.update && typeof registration.update === 'function') {
                  registration.update();
                }
              }, 300000);
            }
          })
          .catch((registrationError) => {
            // Only log errors in production, and ignore "disabled in development" errors
            if (import.meta.env.PROD && !registrationError.message?.includes('disabled in development')) {
              console.error('[SW] Registration failed:', registrationError);
            }
          });
      }, 100);
    });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Development: Explicitly do nothing to avoid any errors
  // The override in index.html already prevents registration
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <DatabaseInitializer>
        <DeviceProvider>
          <ThemeProvider>
            <UserProvider>
              <I18nProvider>
                <App />
              </I18nProvider>
            </UserProvider>
          </ThemeProvider>
        </DeviceProvider>
      </DatabaseInitializer>
    </ErrorBoundary>
  </React.StrictMode>
);