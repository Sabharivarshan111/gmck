
const CACHE_NAME = 'mbbs-qb-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

const DATA_CACHE_NAME = 'mbbs-qb-data-v1';
const DATA_FILES = [
  '/src/data/questionBankData.ts',
  '/src/data/topics/pharmacology.ts',
  '/src/data/topics/pharmacology/autacoids.ts',
  '/src/data/topics/pharmacology/cardiovascularSystem.ts',
  '/src/data/topics/pharmacology/cns.ts',
  '/src/data/topics/pharmacology/endocrineSystem.ts',
  '/src/data/topics/pharmacology/generalPharmacology.ts',
  '/src/data/topics/pharmacology/respiratorySystem.ts',
  '/src/data/topics/pharmacology/chemotherapy.ts'
];

// Install event handler - cache app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  // Force waiting Service Worker to become active
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(APP_SHELL);
      })
      .catch(error => {
        console.error('Service Worker: App Shell Cache Failed:', error);
        throw error;
      })
  );
});

// Activate event handler - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  // Take control of all clients as soon as it activates
  event.waitUntil(
    Promise.all([
      clients.claim(), // This is crucial - take control of all clients immediately
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== DATA_CACHE_NAME
            ) {
              console.log('Service Worker: Clearing Old Cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ]).then(() => {
      console.log('Service Worker: Claimed all clients and cleared old caches');
      // This helps with debugging
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ 
            type: 'SW_ACTIVATED', 
            timestamp: new Date().getTime() 
          });
        });
      });
    })
  );
});

// Fetch event handler with improved caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Data API requests
  if (url.pathname.includes('/src/data/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(request);
          });
      })
    );
    return;
  }

  // App shell - Cache First strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Don't cache responses that aren't successful or are not GET requests
          if (!response || response.status !== 200 || request.method !== 'GET') {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.error('Service Worker: Fetch Failed:', error);
          // Return a custom offline page if we have one
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
          
          return new Response('Network error happened', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_DATA_FILES') {
    event.waitUntil(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching Data Files');
        return cache.addAll(DATA_FILES).then(() => {
          // Notify clients that caching is complete
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ 
                type: 'CACHE_COMPLETE', 
                timestamp: new Date().getTime() 
              });
            });
          });
          return true;
        });
      })
    );
  }

  // Add a new message type to check if service worker is ready
  if (event.data && event.data.type === 'IS_READY') {
    // Respond to the client confirming the service worker is ready
    event.ports[0].postMessage({ 
      ready: true,
      timestamp: new Date().getTime()
    });
  }

  // Add a ping/pong mechanism to check if service worker is alive
  if (event.data && event.data.type === 'PING') {
    const client = event.source;
    if (client) {
      client.postMessage({
        type: 'PONG',
        timestamp: new Date().getTime()
      });
    }
  }
});

// Immediately notify when the service worker becomes controlling
self.addEventListener('controllerchange', () => {
  console.log('Service Worker: Controller changed');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ 
        type: 'CONTROLLER_CHANGE', 
        timestamp: new Date().getTime() 
      });
    });
  });
});
