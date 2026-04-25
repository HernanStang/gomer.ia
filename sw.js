// Service Worker — Registro de Trabajos
// Cache-first: la app funciona 100% offline una vez cargada.
// Cuando subas una versión nueva del HTML, cambiá CACHE_VERSION para forzar refresh.

const CACHE_VERSION = 'v1';
const CACHE_NAME = `registro-trabajos-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

// Install: pre-cachear todos los assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name.startsWith('registro-trabajos-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first con fallback a red
self.addEventListener('fetch', event => {
  // Solo manejar GETs
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Si es un asset propio (mismo origen), guardarlo en cache
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Si la red falla y no está en cache, devolver el index (para navegación)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
