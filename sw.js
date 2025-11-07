const CACHE_NAME = 'calc-pwa-v7';
const CACHE_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png'
];

// ✅ Установка и кэширование
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
        console.error('[ServiceWorker] Ошибка установки:', error);
      })
  );
});

// ✅ Активация - очистка старых кэшей
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

// ✅ Стратегия: Cache First с Network Fallback
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Игнорируем внешние запросы и не-GET запросы
  if (!request.url.startsWith(self.location.origin) || request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Если есть в кэше - возвращаем и обновляем кэш в фоне
        if (cachedResponse) {
          // Фоном обновляем кэш
          event.waitUntil(
            fetch(request)
              .then(networkResponse => {
                if (networkResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, networkResponse));
                }
              })
              .catch(() => {/* Игнорируем ошибки сети */})
          );
          return cachedResponse;
        }

        // Если нет в кэше - пробуем сеть
        return fetch(request)
          .then(networkResponse => {
            // Кэшируем успешные ответы
            if (networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseToCache));
            }
            return networkResponse;
          })
          .catch(error => {
            // Fallback для основных типов ресурсов
            console.log('[ServiceWorker] Оффлайн для:', request.url);
            
            if (request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            if (request.destination === 'style') {
              return new Response(
                `body { background: #0f0f0f; color: #e9e9e9; font-family: system-ui; }`,
                { headers: { 'Content-Type': 'text/css' } }
              );
            }
            
            if (request.destination === 'script') {
              return new Response(
                `console.log("Калькулятор - оффлайн режим");`,
                { headers: { 'Content-Type': 'application/javascript' } }
              );
            }
            
            // Базовый fallback
            return new Response('Оффлайн', { 
              status: 408, 
              statusText: 'Offline'
            });
          });
      })
  );
});

// ✅ Обработка сообщений от главного потока
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  }
});
