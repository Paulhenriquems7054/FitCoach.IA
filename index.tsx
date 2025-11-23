
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { I18nProvider } from './context/I18nContext';
import { DatabaseInitializer } from './components/DatabaseInitializer';

// Service Worker management
if ('serviceWorker' in navigator) {
  // Always unregister service workers in development
  if (import.meta.env.DEV) {
    // Force unregister immediately and prevent registration
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      const unregisterPromises = registrations.map((registration) => {
        return registration.unregister().then((success) => {
          if (success) {
            console.log('[SW] Service Worker unregistered (dev mode)');
          }
          return success;
        });
      });
      
      return Promise.all(unregisterPromises);
    }).then(() => {
      // Clear all caches in development
      if ('caches' in window) {
        return caches.keys().then((cacheNames) => {
          const deletePromises = cacheNames.map((cacheName) => {
            return caches.delete(cacheName).then((success) => {
              if (success) {
                console.log('[SW] Cache deleted (dev mode):', cacheName);
              }
              return success;
            });
          });
          return Promise.all(deletePromises);
        });
      }
    }).catch((error) => {
      console.warn('[SW] Error cleaning up service workers in dev mode:', error);
    });
    
    // Override service worker registration in dev mode to prevent any registration
    const originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = function() {
      console.log('[SW] Service worker registration blocked in dev mode');
      return Promise.reject(new Error('Service workers disabled in development'));
    };
  } else if (import.meta.env.PROD) {
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
            console.log('[SW] Service Worker registered successfully');
            // Force immediate update
            registration.update();
            // Check for updates every 5 minutes
            setInterval(() => {
              registration.update();
            }, 300000);
          })
          .catch((registrationError) => {
            console.error('[SW] Registration failed:', registrationError);
          });
      }, 100);
    });
  }
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DatabaseInitializer>
      <ThemeProvider>
        <UserProvider>
          <I18nProvider>
            <App />
          </I18nProvider>
        </UserProvider>
      </ThemeProvider>
    </DatabaseInitializer>
  </React.StrictMode>
);