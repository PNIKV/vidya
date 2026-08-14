const BUILD_TIMESTAMP = '2026-08-15T00:00Z';
const CACHE_NAME = `vidya-steam-${BUILD_TIMESTAMP}`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './css/about.css',
  './css/home.css',
  './css/live-quiz.css',
  './css/projects.css',
  './css/sessions.css',
  './css/whiteboard.css',
  './js/about.js',
  './js/home.js',
  './js/leaderboard.js',
  './js/live-quiz.js',
  './js/main.js',
  './js/projects.js',
  './js/quiz.js',
  './js/routing.js',
  './js/session.js',
  './js/state.js',
  './js/whiteboard.js',
  './pages/about.html',
  './pages/home.html',
  './pages/live-quiz.html',
  './pages/project-detail.html',
  './pages/projects.html',
  './pages/session-detail.html',
  './pages/sessions.html',
  './pages/whiteboard.html',
  './pages/offline.html',
  './data/site.json',
  './students.json',
  './projects/datafolder/compiled_projects.json',
  './manifest.json',
  './icons/icon.svg',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// Install event: Pre-cache static assets
globalThis.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Map string URLs to Request objects with cache: 'no-cache' to bypass HTTP cache during install
        const requests = PRECACHE_ASSETS.map(url => new Request(url, { cache: 'no-cache' }));
        return cache.addAll(requests);
      })
      .then(() => globalThis.skipWaiting())
  );
});

// Activate event: Clean up old caches
globalThis.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => globalThis.clients.claim())
  );
});

// Fetch event: Network first for HTML/CSS/JS/JSON (Automated Cache Busting), Cache fallback for offline
globalThis.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1. Bypass cache for Live Quiz backend
  if (
    requestUrl.hostname.includes('firebaseio.com') ||
    requestUrl.hostname.includes('googleapis.com') ||
    requestUrl.hostname.includes('gstatic.com') ||
    requestUrl.hostname.includes('script.google.com') ||
    requestUrl.pathname.includes('/live-quiz-data/')
  ) {
    if (!requestUrl.hostname.includes('fonts.googleapis.com') && !requestUrl.hostname.includes('fonts.gstatic.com')) {
       return; 
    }
  }

  // 2. Network-First Strategy for local assets to ensure updates are always visible
  event.respondWith(
    (async () => {
      try {
        let fetchUrl = event.request.url;
        // Completely bypass the browser's HTTP cache for local assets by appending a unique timestamp
        if (requestUrl.origin === globalThis.location.origin && event.request.method === 'GET') {
          const separator = fetchUrl.includes('?') ? '&' : '?';
          fetchUrl = `${fetchUrl}${separator}swcb=${Date.now()}`;
        }

        const networkResponse = await fetch(fetchUrl);

        // SPA fallback: if a navigation request returns 404, serve index.html instead
        // so the client-side router can handle the route (e.g. /project/some-id)
        if (!networkResponse.ok && event.request.mode === 'navigate') {
          const cachedIndex = await caches.match('./index.html');
          if (cachedIndex) return cachedIndex;
        }

        // Only cache successful GET requests
        if (networkResponse?.status === 200 && event.request.method === 'GET') {
          const cache = await caches.open(CACHE_NAME);
          // Store it against the ORIGINAL request (without the swcb param) so caches.match() works later
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Network failed (offline), fallback to cache
        console.warn('Fetch failed; returning from cache instead.', error);
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // If navigation request (HTML) fails and not in cache, show offline page
        if (event.request.mode === 'navigate') {
          const cachedIndex = await caches.match('./index.html');
          if (cachedIndex) return cachedIndex;
          return caches.match('./pages/offline.html');
        }
      }
    })()
  );
});
