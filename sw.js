const CACHE_NAME = 'calc-pwa-v3';
const CACHE_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png'
];

// ✅ Установка и кэширование файлов
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Установка...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Кэширование файлов...');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        console.log('[ServiceWorker] Все файлы закэшированы');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Ошибка кэширования:', error);
      })
  );
});

// ✅ Активация и очистка старых кэшей
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Активация...');
  
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              console.log('[ServiceWorker] Удаляю старый кэш:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Активен');
        return self.clients.claim();
      })
  );
});

// ✅ Стратегия кэширования: Network First, затем Cache
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Игнорируем запросы на внешние ресурсы и аналитику
  if (!request.url.startsWith(self.location.origin) || 
      request.url.includes('analytics') ||
      request.url.includes('tracking')) {
    return;
  }

  // Для навигационных запросов используем стратегию Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Клонируем ответ для кэширования
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          return networkResponse;
        })
        .catch(() => {
          // Если сеть недоступна, используем кэш
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Для статических ресурсов используем Cache First
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Обновляем кэш в фоне
          event.waitUntil(
            fetch(request)
              .then(networkResponse => {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(request, networkResponse);
                  });
              })
              .catch(() => {
                // Игнорируем ошибки при обновлении кэша
              })
          );
          return cachedResponse;
        }

        // Если нет в кэше, загружаем из сети
        return fetch(request)
          .then(networkResponse => {
            // Кэшируем новые ресурсы
            if (networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Заглушки для разных типов ресурсов
            if (request.destination === 'image') {
              return new Response(
                '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            if (request.destination === 'style') {
              return new Response('/* Offline fallback */', { 
                headers: { 'Content-Type': 'text/css' } 
              });
            }
            
            return new Response('Оффлайн режим', {
              status: 408,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
      })
  );
});

// ✅ Фоновая синхронизация (если понадобится в будущем)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[ServiceWorker] Фоновая синхронизация');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Здесь может быть логика фоновой синхронизации
  // Например, отправка статистики использования
  console.log('[ServiceWorker] Выполняется фоновая синхронизация');
}

// ✅ Обработка push-уведомлений
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Новое уведомление от калькулятора',
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Калькулятор', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          for (const client of clientList) {
            if (client.url === event.notification.data.url && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
          }
        })
    );
  }
});

// ✅ Периодическая фоновая синхронизация (для будущих функций)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-check') {
    console.log('[ServiceWorker] Проверка обновлений');
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  // Логика проверки обновлений приложения
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = CACHE_FILES.map(url => new Request(url));
    
    for (const request of requests) {
      const networkResponse = await fetch(request);
      const cachedResponse = await cache.match(request);
      
      if (!cachedResponse || 
          networkResponse.headers.get('etag') !== cachedResponse.headers.get('etag')) {
        console.log('[ServiceWorker] Обнаружено обновление:', request.url);
        await cache.put(request, networkResponse.clone());
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Ошибка проверки обновлений:', error);
  }
}

// ✅ Обработка сообщений от главного потока
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
