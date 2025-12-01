
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { I18nProvider } from './context/I18nContext';
import { DeviceProvider } from './context/DeviceContext';
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
      // Silently ignore in development - return a resolved promise that won't log errors
      return Promise.resolve({
        installing: null,
        waiting: null,
        active: null,
        scope: '/',
        update: () => Promise.resolve(),
        unregister: () => Promise.resolve(true),
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      } as ServiceWorkerRegistration);
    };
    
    // Suppress console errors and warnings for service worker in development
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = function(...args: any[]) {
      // Filter out service worker errors in development
      const fullMessage = args.map(arg => String(arg)).join(' ');
      if (fullMessage.includes('Service workers disabled') || 
          fullMessage.includes('[SW]') ||
          fullMessage.includes('serviceWorker') ||
          fullMessage.includes('Registration failed')) {
        return; // Don't log service worker errors in dev
      }
      originalError.apply(console, args);
    };
    
    console.warn = function(...args: any[]) {
      // Filter out service worker warnings in development
      const fullMessage = args.map(arg => String(arg)).join(' ');
      if (fullMessage.includes('Service workers disabled') || 
          fullMessage.includes('[SW]') ||
          fullMessage.includes('serviceWorker') ||
          fullMessage.includes('Registration failed')) {
        return; // Don't log service worker warnings in dev
      }
      originalWarn.apply(console, args);
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
            // Silently ignore service worker errors in development
            // Only log errors in production
            if (import.meta.env.PROD) {
              console.error('[SW] Registration failed:', registrationError);
            }
            // In development, do nothing - service workers are disabled
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
  </React.StrictMode>
);