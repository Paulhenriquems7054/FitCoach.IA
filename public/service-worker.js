// Check if we're in development mode
const isDevelopment = self.location.hostname === 'localhost' || 
                      self.location.hostname === '127.0.0.1' ||
                      self.location.hostname.includes('localhost');

// If in development, immediately unregister and do nothing
if (isDevelopment) {
  self.addEventListener('install', event => {
    // Immediately skip waiting and unregister
    self.skipWaiting();
    event.waitUntil(
      self.registration.unregister().then(() => {
        console.log('[SW] Service worker unregistered in development mode');
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UNREGISTERED' });
          });
        });
      })
    );
  });

  self.addEventListener('activate', event => {
    event.waitUntil(
      self.registration.unregister().then(() => {
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UNREGISTERED' });
          });
        });
      })
    );
  });

  // Don't intercept any fetch events in development
  self.addEventListener('fetch', event => {
    // CRITICAL: Don't call event.respondWith() in development
    // This allows the browser to handle all requests normally
    // Simply return without doing anything
    return;
  });

  // Exit early - don't run production code
  // (The code below will never execute in dev mode)
}

const CACHE_NAME = 'nutri-ia-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/play_store_512.png',
  '/icons/1024.png',
  '/icons/favicon.svg',
  // Add other static assets here if they are not dynamically imported with changing URLs
  // For example: '/styles.css', '/main.js'
  // Note: assets loaded from CDNs (like tailwind, react) are not cached by this worker
  // as they are cross-origin. You need to configure caching for them separately if needed.
];

// Force update on install (PRODUCTION ONLY)
self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation of new service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Opened cache', CACHE_NAME);
        // Use addAll with catch to handle missing files gracefully
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('[SW] Some files failed to cache:', err);
          // Continue anyway - cache what we can
          return Promise.resolve();
        });
      })
  );
});

// Network-first strategy: always try network first, fallback to cache (PRODUCTION ONLY)
// Double-check we're not in development (safety check)
self.addEventListener('fetch', event => {
  // Safety check: if somehow we're in dev mode, don't intercept
  const isDev = self.location.hostname === 'localhost' || 
                self.location.hostname === '127.0.0.1' ||
                self.location.hostname.includes('localhost');
  
  if (isDev) {
    // Don't intercept - let browser handle it
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = event.request.url;
  if (!requestUrl.startsWith('http')) {
    return;
  }

  // Don't intercept module scripts, let them load directly from network
  const acceptHeader = event.request.headers.get('accept') || '';
  const isModuleScript = acceptHeader.includes('application/javascript') || 
                         acceptHeader.includes('text/javascript') ||
                         requestUrl.includes('.js') ||
                         requestUrl.includes('.mjs') ||
                         requestUrl.includes('.ts') ||
                         requestUrl.includes('.tsx');
  
  // Don't intercept Vite HMR or module requests
  if (isModuleScript || requestUrl.includes('?t=') || requestUrl.includes('&t=')) {
    return; // Let browser handle it directly
  }

  // For HTML files, always try network first to get latest version
  if (acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network succeeds, update cache and return response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache).catch(err => {
                // Silently fail - non-critical
              });
            });
          }
          return response;
        })
        .catch(error => {
          // Network failed, try cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no cache, try index.html
            return caches.match('/index.html').then(indexResponse => {
              return indexResponse || new Response('Page not available', { 
                status: 404, 
                statusText: 'Not Found',
                headers: { 'Content-Type': 'text/html' }
              });
            });
          });
        })
    );
  } else {
    // For other assets (images, CSS, etc.), try cache first, then network
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version but also update in background
          fetch(event.request).then(response => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache).catch(() => {
                // Silently fail - non-critical
              });
            });

            return response;
          })
          .catch(() => {
            // Network failed - only return index.html for navigation requests
            if (acceptHeader.includes('text/html')) {
              return caches.match('/index.html').then(indexResponse => {
                return indexResponse || new Response('Page not available', { 
                  status: 404, 
                  statusText: 'Not Found',
                  headers: { 'Content-Type': 'text/html' }
                });
              });
            }
            // For other assets, return a failed response
            return new Response('Resource not available', { 
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
    );
  }
});

// Clean up old caches on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            // Silently delete old caches
            return caches.delete(cacheName).catch(() => {});
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});
