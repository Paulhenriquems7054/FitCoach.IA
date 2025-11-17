
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { I18nProvider } from './context/I18nContext';
import { DatabaseInitializer } from './components/DatabaseInitializer';

// Aggressive Service Worker cleanup and registration
if ('serviceWorker' in navigator) {
  // First, unregister ALL existing service workers to force fresh start
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Service Worker unregistered');
        }
      });
    });
    
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName).then((success) => {
            if (success) {
              console.log('Cache deleted:', cacheName);
            }
          });
        });
      });
    }
    
    // Only register new service worker in production, after cleanup
    if (import.meta.env.PROD) {
      // Wait a bit before registering new one
      setTimeout(() => {
        navigator.serviceWorker
          .register('/service-worker.js?v=' + Date.now(), { 
            updateViaCache: 'none',
            scope: '/' 
          })
          .then((registration) => {
            console.log('SW registered: ', registration);
            // Force immediate update
            registration.update();
            // Check for updates every 5 minutes
            setInterval(() => {
              registration.update();
            }, 300000);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      }, 100);
    }
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