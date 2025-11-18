
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { I18nProvider } from './context/I18nContext';
import { DatabaseInitializer } from './components/DatabaseInitializer';

// Service Worker cleanup and registration - ONLY IN PRODUCTION
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // First, unregister ALL existing service workers to force fresh start
  navigator.serviceWorker.getRegistrations().then((registrations) => {
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