/* Expedición Mundial PWA · service worker (v3) */
const CACHE = "em-v3-13";
const SHELL = ["./","./index.html","./styles.css","./app.js","./manifest.webmanifest",
  "./icons/icon-192.png","./icons/icon-512.png","./icons/icon-512-maskable.png"];
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== self.location.origin) return;
  const isCode = req.mode === "navigate" || /\.(?:js|css|html)$/.test(url.pathname);
  if (isCode) {
    e.respondWith(
      fetch(req).then((res) => { if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
    );
    return;
  }
  e.respondWith(caches.match(req).then((cached) => {
    const net = fetch(req).then((res) => { if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => cached);
    return cached || net;
  }));
});
