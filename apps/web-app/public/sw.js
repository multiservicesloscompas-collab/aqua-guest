const CACHE_NAME = 'aquagest-static-v1';
const ASSETS_TO_CACHE = ['/', '/index.html', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Optionally update cache for same-origin GET requests
        if (
          event.request.method === 'GET' &&
          new URL(event.request.url).origin === self.location.origin
        ) {
          const copy = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((r) => r || caches.match('/'))
      )
  );
});
