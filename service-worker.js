// service-worker.js — Expedición Mundial PWA
// Strategy:
//  - Shell (HTML, manifest, icons, fonts): cache-first
//  - Supabase API: network-only (no caching — Realtime + data freshness)
//  - Google Maps tiles: network-only (Google caches them in browser anyway)
//  - Everything else: network-first with cache fallback for offline

const VERSION   = 'em-v1';
const SHELL     = 'em-shell-' + VERSION;
const RUNTIME   = 'em-runtime-' + VERSION;

// Files that ship as part of the app and benefit from cache-first
const SHELL_ASSETS = [
  './',
  './mundial.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // Best-effort precache: don't fail SW install if a single asset is missing
    await Promise.allSettled(SHELL_ASSETS.map(u => cache.add(u).catch(() => null)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Drop old cache versions
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET — Supabase POSTs etc. pass through
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache Supabase API calls. Realtime data must always be fresh.
  if (url.hostname.endsWith('.supabase.co')) return;
  // Never cache Google Maps tiles / API. Google handles its own caching headers.
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) return;

  // Shell HTML/manifest/icons: cache-first
  if (SHELL_ASSETS.some(p => url.pathname.endsWith(p.replace('./', '/')) || url.pathname === '/')) {
    event.respondWith(cacheFirst(req, SHELL));
    return;
  }
  // Fonts (Google Fonts): cache-first with long TTL
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(req, RUNTIME));
    return;
  }
  // UNPKG (React, Babel, Supabase JS): cache-first since they're versioned URLs
  if (url.hostname.includes('unpkg.com')) {
    event.respondWith(cacheFirst(req, RUNTIME));
    return;
  }
  // Default: network-first with cache fallback
  event.respondWith(networkFirst(req, RUNTIME));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch (e) {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}
