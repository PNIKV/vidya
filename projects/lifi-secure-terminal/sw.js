// LiFi Secure Terminal Service Worker - Network First Strategy
const CACHE_NAME = 'lifi-terminal-v2';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed v2');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          console.log('[Service Worker] Deleting old cache:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
