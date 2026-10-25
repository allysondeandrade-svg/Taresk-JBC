const CACHE_NAME = 'taresk-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Apenas repassa a requisição pela rede normalmente
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
