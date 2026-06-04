// ─────────────────────────────────────────────────────────────────────────────
// Funko Inventory — Service Worker (manual, sin VitePWA)
// Ubicación: public/sw.js → se despliega en /funko-inventory/sw.js
// ─────────────────────────────────────────────────────────────────────────────

/* global clients */

const CACHE_NAME = 'funko-inventory-v1';

// Assets del shell de la app que queremos cachear en el install
// Vite genera hashes en los nombres de los bundles, así que cacheamos
// la raíz y dejamos que el fetch handler capture el resto dinámicamente.
const PRECACHE_URLS = [
  '/funko-inventory/',
  '/funko-inventory/index.html',
];

// ── Install: pre-cachear el shell ───────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activar inmediatamente sin esperar a que cierren las tabs existentes
  self.skipWaiting();
});

// ── Activate: limpiar caches viejas ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  // Tomar control de todas las tabs abiertas inmediatamente
  self.clients.claim();
});

// ── Fetch: cache-first para assets estáticos, network-first para API ─────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar llamadas a APIs externas (Drive, Claude, etc.)
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('google') ||
    url.hostname.includes('anthropic')
  ) {
    return; // dejar pasar sin cache
  }

  // Cache-first para assets del mismo origen
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // Solo cachear respuestas válidas de GET
        if (
          request.method !== 'GET' ||
          !response ||
          response.status !== 200 ||
          response.type === 'opaque'
        ) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Si está offline y no hay cache, devolver el index.html (SPA fallback)
        if (request.mode === 'navigate') {
          return caches.match('/funko-inventory/index.html');
        }
      });
    })
  );
});

// ── Push: mostrar notificación al recibir push del servidor ─────────────────
// (Reservado para futura implementación de server push.
//  Las notificaciones locales de Fase 4 usan Notification API directamente
//  desde el hilo principal, no necesitan este evento.)
self.addEventListener('push', event => {
  let data = { title: 'Funko Inventory 📦', body: 'Recuerda actualizar tu inventario.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/funko-inventory/icon-192.png',
      badge: '/funko-inventory/icon-192.png',
      tag: 'funko-reminder',
      renotify: true,
    })
  );
});

// ── Notification click: abrir/enfocar la app ────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Si ya hay una tab abierta de la app, enfocarla
      for (const client of clientList) {
        if (client.url.includes('/funko-inventory/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva tab
      if (clients.openWindow) {
        return clients.openWindow('/funko-inventory/');
      }
    })
  );
});
