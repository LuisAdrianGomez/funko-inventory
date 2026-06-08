/* global clients */

// Funko Inventory — Service Worker manual, sin VitePWA.

const CACHE_NAME = 'funko-inventory-v1';
const APP_BASE = new URL(self.registration.scope).pathname;
const appUrl = (path = '') => `${APP_BASE}${path}`.replace(/\/{2,}/g, '/');

const PRECACHE_URLS = [
  appUrl(),
  appUrl('index.html'),
  appUrl('manifest.json'),
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

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
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('google') ||
    url.hostname.includes('anthropic')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
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
        if (request.mode === 'navigate') {
          return caches.match(appUrl('index.html'));
        }
      });
    })
  );
});

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
      icon: appUrl('icon-192.png'),
      badge: appUrl('icon-192.png'),
      tag: 'funko-reminder',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(APP_BASE) && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(APP_BASE);
      }
    })
  );
});
