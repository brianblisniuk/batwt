// Service worker for Expedición Mundial client PWA.
//
// Strategy:
//   - HTML, app.min.js: network-first. Always try the network first so a
//     fresh deploy is picked up as soon as the guest reopens the app. Fall
//     back to cache if offline, so guests on bad connections still have
//     the app shell.
//   - icons, fonts: cache-first. Static assets that rarely change.
//   - everything else: pass through (no caching).
//
// Update flow:
//   - This SW is fetched fresh every time (Cache-Control: no-store in
//     netlify.toml). When we ship a new version we bump CACHE_VERSION
//     below, which forces a new install. The new SW enters "waiting"
//     state and the client app can prompt the guest to refresh.

const CACHE_VERSION = 'em-2026-05-27-01';
const CACHE_NAME = `em-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // Don't precache aggressively — let runtime caching populate. We just
  // skipWaiting so the new SW takes over as soon as it's installed.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // don't intercept CDN, maps, etc.

  const pathname = url.pathname;
  const isShell =
    pathname === '/' ||
    pathname.endsWith('.html') ||
    pathname.endsWith('app.min.js') ||
    pathname.endsWith('manifest.webmanifest');
  const isAsset =
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff2');

  if (isShell) {
    // Network-first
    event.respondWith(
      fetch(req)
        .then(async (resp) => {
          if (resp && resp.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, resp.clone());
          }
          return resp;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const rootCache = await caches.match('/');
          if (rootCache) return rootCache;
          throw new Error('offline_and_no_cache');
        })
    );
    return;
  }

  if (isAsset) {
    // Cache-first
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then(async (resp) => {
            if (resp && resp.ok) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(req, resp.clone());
            }
            return resp;
          })
      )
    );
    return;
  }
});

// Allow the page to ask the SW to activate immediately.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
