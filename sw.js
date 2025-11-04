const CACHE_NAME = 'calc-pwa-v2'; // измени версию при обновлении
const CACHE_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icons/apple-touch-icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ✅ Установка и кэширование файлов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Кэширование файлов...');
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// ✅ Активация и очистка старых кэшей
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Удаляю старый кэш:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ✅ Обработка запросов
self.addEventListener('fetch', event => {
  const request = event.request;

  // Игнорируем запросы на внешние ресурсы
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then(networkResponse => {
          // Кэшируем новые ресурсы на будущее
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Если нет сети и нет кэша — покажем заглушку
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
