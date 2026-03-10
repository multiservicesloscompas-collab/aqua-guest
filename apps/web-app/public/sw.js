const CACHE_NAME = 'aquagest-static-v1';
const ASSETS_TO_CACHE = ['/', '/index.html', '/favicon.ico'];
const sw = globalThis;

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) =>
            key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()
          )
        )
      )
  );
  sw.clients.claim();
});

sw.addEventListener('fetch', (event) => {
  // Try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Optionally update cache for same-origin GET requests
        if (
          event.request.method === 'GET' &&
          new URL(event.request.url).origin === sw.location.origin
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
