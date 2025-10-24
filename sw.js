/**
 * SongScribe Website - Service Worker
 * Provides offline functionality and asset caching
 */

const CACHE_NAME = 'songscribe-v1.0.0';
const STATIC_CACHE = 'songscribe-static-v1.0.0';
const DYNAMIC_CACHE = 'songscribe-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/features.html',
  '/pricing.html',
  '/download.html',
  '/about.html',
  '/support.html',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/js/analytics.js',
  '/assets/images/logo-full.svg',
  '/assets/images/favicon.svg',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/assets/')) {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/)) {
    // Cache-first for images
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.match(/\.(css|js)$/)) {
    // Stale-while-revalidate for scripts and styles
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Network-first for pages (always fresh content)
    event.respondWith(networkFirst(request));
  }
});

/**
 * Cache-first strategy
 * Try cache first, fallback to network
 */
function cacheFirst(request) {
  return caches.match(request)
    .then(response => {
      if (response) {
        return response;
      }

      return fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Return offline fallback for images
          if (request.destination === 'image') {
            return caches.match('/assets/images/offline-placeholder.svg');
          }
        });
    });
}

/**
 * Network-first strategy
 * Try network first, fallback to cache
 */
function networkFirst(request) {
  return fetch(request)
    .then(response => {
      // Cache successful responses
      if (response.ok) {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE)
          .then(cache => cache.put(request, responseClone));
      }
      return response;
    })
    .catch(() => {
      // Fallback to cache
      return caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }

          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
    });
}

/**
 * Stale-while-revalidate strategy
 * Return cached version immediately, update cache in background
 */
function staleWhileRevalidate(request) {
  return caches.match(request)
    .then(response => {
      // Start background update
      const fetchPromise = fetch(request)
        .then(networkResponse => {
          if (networkResponse.ok) {
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => {
          // Silently fail background updates
        });

      // Return cached response or fetch from network
      if (response) {
        return response;
      } else {
        return fetchPromise;
      }
    });
}

// Message handling for cache management
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[ServiceWorker] Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch(error => {
      event.ports[0].postMessage({ error: error.message });
    });
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  // This could sync offline form submissions, etc.
  return Promise.resolve();
}

// Periodic background sync (future enhancement)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(updateContent());
  }
});

function updateContent() {
  // Implement content update logic here
  // This could refresh blog posts, etc.
  return Promise.resolve();
}

// Push notifications (future enhancement)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/assets/images/logo-full.svg',
    badge: '/assets/images/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/assets/images/favicon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/images/favicon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SongScribe Update', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('[ServiceWorker] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[ServiceWorker] Unhandled rejection:', event.reason);
});
