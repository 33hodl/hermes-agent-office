const CACHE = 'office-v12';
const FILES = ['./', './index.html', './style.css', './engine.js', './app.js',
  './office-renderer.js', './nous-renderer.js', './dunder-renderer.js',
  './custom.js', './creator.js', './creator-html.js', './icon.svg', './manifest.json'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  // strip cache-busting query for cache lookups
  const cleanUrl = url.origin + url.pathname;
  // NETWORK-FIRST, and NEVER serve from the browser's HTTP cache — the stale
  // `?v=` URLs in an old index.html must not return a stale cached JS. Force a
  // real network round-trip, fall back to the SW cache only when offline.
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).then((r) => {
      if (r.ok) {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(cleanUrl, copy));
      }
      return r;
    }).catch(() =>
      caches.match(cleanUrl).then((m) => m || caches.match('./'))
    )
  );
});
