// Simple service worker for basic PWA functionality
const CACHE_NAME = 'settlr-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Cache install failed:', error);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(function(error) {
        console.log('Fetch failed:', error);
        // Return a fallback response for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        throw error;
      })
  );
});
