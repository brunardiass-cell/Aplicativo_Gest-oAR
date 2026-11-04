// Service Worker CTVacinas PWA & Web Push Notifications
const CACHE_NAME = 'ctvacinas-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png'
];

// Install: precache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API / WebSocket requests
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api') || url.pathname.startsWith('/ws-updates')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || caches.match('/');
          }
        });
      })
  );
});

// -----------------------------------------------------------------------------
// PUSH EVENT: Receives real Web Push notifications from server
// -----------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 ATENÇÃO – ATIVIDADE CRÍTICA',
    body: 'Existe uma atividade crítica que requer atenção imediata.',
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    tag: 'critical-activity-alert',
    data: {
      url: '/?view=tasks'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon-32x32.png',
    tag: data.tag || `critical-${Date.now()}`,
    data: data.data || { url: '/?view=tasks' },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    renotify: true,
    actions: [
      { action: 'open', title: 'Visualizar Atividade' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// -----------------------------------------------------------------------------
// NOTIFICATION CLICK: Direct user to the activity inside the application
// -----------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/?view=tasks';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NAVIGATE_TO_ACTIVITY',
            url: targetUrl,
            activityId: event.notification.data?.activityId
          });
          return client.navigate(targetUrl);
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
