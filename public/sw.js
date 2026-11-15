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
const SW_VERSION = 'v42-site-data-saver-2026-11-15';
const CACHE_NAME = `mbbs-qb-${SW_VERSION}`;
const MODEL_CACHE_NAME = 'mbbs-qb-models-v1';
// The website build fills these with hashes of the exact public file bytes.
// Model URLs alone are not immutable: the files can change on a later deploy.
const STATIC_REVISIONS = {};

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
          await Promise.allSettled(urls.slice(index, index + 20).map(async (url) => {
            // A content hash is an identity: reuse identical bytes from the
            // previous release instead of downloading all offline art again.
            // Shells and unversioned PG packs must still refresh on install.
            const parsed = new URL(url, self.location.origin);
            if (isImmutableAsset(parsed)) {
              for (const name of await caches.keys()) {
                if (!name.startsWith('mbbs-qb-')) continue;
                const previous = await (await caches.open(name)).match(url);
                if (previous?.ok) { await cache.put(url, previous); return; }
              }
            }
            // Timer growth stages and alternative pet skins are decorative.
            // Keep any existing offline copy, but fetch new ones only on use.
            if (!isDeferredDecoration(parsed)) await cache.add(url);
          }));
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
        names.filter((n) => n.startsWith('mbbs-qb-') && n !== CACHE_NAME && n !== MODEL_CACHE_NAME).map((n) => caches.delete(n)),
      );
      // Retain unchanged models across app updates, discard retired revisions.
      const models = await caches.open(MODEL_CACHE_NAME);
      for (const request of await models.keys()) {
        const url = new URL(request.url);
        if (STATIC_REVISIONS[url.pathname] !== url.searchParams.get('__orbit_asset')) {
          await models.delete(request);
        }
      }
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
    url.pathname.startsWith('/pg/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)
  );
}

function isImmutableAsset(url) {
  // Vite output uses an eight-character content hash before the extension.
  // Do not apply cache-first to mutable /pg files, HTML or unversioned images.
  return (/^\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/i.test(url.pathname)
    || /^\/pg\/s\d{2}-[0-9a-f]{12}\.zst$/.test(url.pathname))
    && !url.search;
}

function isDeferredDecoration(url) {
  return /^\/assets\/(?:stage\d+|(?:bear|cat|dog|fox|otter|panda|penguin|rabbit|squirrel)-(?:bold|classic|soft))-[A-Za-z0-9_-]{8}\.png$/.test(url.pathname);
}

async function cachedPublicModel(request, url) {
  const cache = await caches.open(MODEL_CACHE_NAME);
  const cacheUrl = new URL(url);
  cacheUrl.searchParams.set('__orbit_asset', STATIC_REVISIONS[url.pathname]);
  const cached = await cache.match(cacheUrl.href);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.status !== 206) await cache.put(cacheUrl.href, response.clone());
  return response;
}

async function cacheFirstImmutable(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
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
async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchAndUpdate = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(fetchAndUpdate);
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
  // Let the browser/CDN handle byte-range requests for the installation video.
  if (url.pathname.startsWith('/installation/')) return;
  // Byte-range media is handled by the browser; never store a partial model.
  if (request.headers.has('range')) return;

  if (Object.prototype.hasOwnProperty.call(STATIC_REVISIONS, url.pathname)) {
    event.respondWith(cachedPublicModel(request, url));
    return;
  }

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
    event.respondWith(isImmutableAsset(url)
      ? cacheFirstImmutable(request)
      : staleWhileRevalidate(request, event));
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

