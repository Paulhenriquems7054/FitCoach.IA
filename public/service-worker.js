
const CACHE_NAME = 'nutri-ia-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  // Add other static assets here if they are not dynamically imported with changing URLs
  // For example: '/styles.css', '/main.js'
  // Note: assets loaded from CDNs (like tailwind, react) are not cached by this worker
  // as they are cross-origin. You need to configure caching for them separately if needed.
];

// Force update on install
self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation of new service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
});

// Network-first strategy: always try network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = event.request.url;
  if (!requestUrl.startsWith('http')) {
    return;
  }

  // For HTML files, always try network first to get latest version
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network succeeds, update cache and return response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache).catch(err => {
                console.warn('[ServiceWorker] Falha ao gravar no cache:', err);
              });
            });
          }
          return response;
        })
        .catch(error => {
          // Network failed, try cache
          console.warn('[ServiceWorker] Network failed, trying cache:', event.request.url);
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
  } else {
    // For other assets, try cache first, then network
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
              cache.put(event.request, responseToCache).catch(err => {
                console.warn('[ServiceWorker] Falha ao gravar no cache:', err);
              });
            });

            return response;
          })
          .catch(error => {
            console.warn('[ServiceWorker] Network request failed for:', event.request.url, error);
            return caches.match('/index.html');
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
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});
