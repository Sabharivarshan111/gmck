// Bump this on every meaningful change so old caches are evicted on activate.
//
// It was left at v2-2026-08-09 for a month, through every deploy in that time.
// Nothing breaks loudly when it goes stale, which is exactly why it gets
// forgotten: `activate` deletes every cache whose name is not CACHE_NAME, so an
// unchanged name means it deletes nothing and whatever a phone cached under it
// survives indefinitely. Navigation is network-first, so a reader online gets
// the new HTML anyway — but one that ever fell back to the cached shell keeps
// being served the asset hashes that shell names, and those ARE cached. Bumping
// this is the one lever that empties the old cache for everybody.
const SW_VERSION = 'v13-simulator-phone-layout-2026-10-10';
const CACHE_NAME = `mbbs-qb-${SW_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Don't fail the whole install if one URL is missing.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      // Cache emitted browser code, fonts and bundled question-bank images.
      // A failed asset never prevents online use or a later cache retry.
      try {
        const urls = await (await fetch('/orbit-offline-assets.json')).json();
        for (let index = 0; index < urls.length; index += 20) {
          await Promise.allSettled(urls.slice(index, index + 20).map(url => cache.add(url)));
        }
      } catch { /* older deploys and local dev may have no manifest */ }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.allSettled(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      (request.headers.get('accept') || '').includes('text/html'))
  );
}

function isHashedAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)
  );
}

// Network-first: always try the network so new deploys land immediately.
async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(fallbackUrl || request, response.clone());
    }
    return response;
  } catch (error) {
    const cached =
      (fallbackUrl ? await cache.match(fallbackUrl) : null) ||
      (await cache.match(request));
    if (cached) return cached;
    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Stale-while-revalidate for content-hashed static assets.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchAndUpdate = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    fetchAndUpdate;
    return cached;
  }
  const fresh = await fetchAndUpdate;
  return (
    fresh ||
    new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    })
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept cross-origin, OAuth, or API traffic.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/~oauth')) return;

  if (url.pathname.startsWith('/_orbit/files/')) {
    event.respondWith(readPrivateFile(url, request));
    return;
  }

  if (isNavigationRequest(request)) {
    // Each route keeps its own shell; the simulator must never fall back to
    // the native homepage, and its existing BrowserRouter still sees /simulator.
    const nativeRoute = /^\/(?:index\.html|notes|timer|ask-ai|progress|browse(?:\/.*)?)?$/.test(url.pathname);
    event.respondWith(networkFirst(request, nativeRoute ? '/index.html' : '/legacy.html'));
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function readPrivateFile(url, request) {
  const id = url.pathname.slice('/_orbit/files/'.length).split('/').map(decodeURIComponent).join('/');
  const file = await new Promise((resolve, reject) => {
    const request = indexedDB.open('orbit-browser-v1', 1);
    request.onupgradeneeded = () => { request.result.createObjectStore('strings'); request.result.createObjectStore('files'); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('files', 'readonly').objectStore('files').get(id);
      read.onsuccess = () => { resolve(read.result); db.close(); };
      read.onerror = () => { reject(read.error); db.close(); };
    };
  });
  if (!file?.blob) return new Response('File is unavailable', { status: 404 });
  const headers = {
    'Content-Type': file.mime || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Accept-Ranges': 'bytes',
    'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'",
  };
  const range = request.headers.get('range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416 });
    const size = file.blob.size;
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    return new Response(file.blob.slice(start, end + 1), { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) } });
  }
  return new Response(file.blob, { headers });
}

// Allow the app to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// A push wakes the worker even when the Home Screen app has no open window.
self.addEventListener('push', event => {
  let message = {};
  try { message = event.data?.json() || {}; } catch { /* still show a user-visible alert */ }
  const url = ['/', '/ask-ai', '/progress'].includes(message.url) ? message.url : '/';
  event.waitUntil(self.registration.showNotification(
    typeof message.title === 'string' ? message.title.slice(0, 100) : 'ORBIT · study reminder',
    { body: typeof message.body === 'string' ? message.body.slice(0, 500) : 'Open ORBIT for your study reminder.',
      icon: '/icon-192.png', badge: '/icon-192.png', tag: message.tag === 'orbit-test' ? 'orbit-test' : 'orbit-daily', data: { url } },
  ));
});

// Notifications navigate only to safe destinations inside ORBIT.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destination = event.notification.data?.url;
  const safe = ['/ask-ai', '/progress', '/'].includes(destination) ? destination : '/';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(safe); return existing.focus(); }
    return self.clients.openWindow(safe);
  })());
});
