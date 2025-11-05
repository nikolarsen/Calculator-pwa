const CACHE_NAME = 'calc-pwa-v4';
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

// ✅ Установка и кэширование ВСЕХ файлов
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Установка...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Кэширование всех файлов...');
        // Важно: используем cache.addAll с fallback
        return Promise.all(
          CACHE_FILES.map(url => {
            return cache.add(url).catch(error => {
              console.log(`[ServiceWorker] Ошибка кэширования ${url}:`, error);
              // Продолжаем даже если один файл не закэшировался
            });
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Все файлы закэшированы');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Критическая ошибка установки:', error);
      })
  );
});

// ✅ Активация - агрессивная очистка старых кэшей
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

// ✅ СТРАТЕГИЯ: Cache First + Network Fallback
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Игнорируем внешние запросы
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Для навигационных запросов - особый подход
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then(networkResponse => {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put('./index.html', responseToCache);
                });
              return networkResponse;
            })
            .catch(() => {
              // Fallback - базовая HTML страница
              return new Response(
                `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Калькулятор</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <style>
                    body { 
                      background: #0f0f0f; 
                      color: #e9e9e9; 
                      font-family: system-ui; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      height: 100vh; 
                      margin: 0; 
                    }
                    .offline-message { 
                      text-align: center; 
                      padding: 20px; 
                    }
                    button { 
                      background: #ff9a2a; 
                      border: none; 
                      padding: 12px 24px; 
                      border-radius: 8px; 
                      color: #111; 
                      font-weight: bold; 
                      cursor: pointer; 
                      margin-top: 16px; 
                    }
                  </style>
                </head>
                <body>
                  <div class="offline-message">
                    <h2>🔌 Оффлайн режим</h2>
                    <p>Приложение загружено из кэша</p>
                    <button onclick="location.reload()">Обновить</button>
                  </div>
                </body>
                </html>
                `,
                { 
                  headers: { 
                    'Content-Type': 'text/html; charset=utf-8' 
                  } 
                }
              );
            });
        })
    );
    return;
  }

  // Для всех остальных запросов - Cache First
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Если есть в кэше - возвращаем
        if (cachedResponse) {
          // Фоном обновляем кэш
          event.waitUntil(
            fetch(request)
              .then(networkResponse => {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(request, networkResponse);
                  });
              })
              .catch(() => {
                // Игнорируем ошибки сети при обновлении кэша
              })
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
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(error => {
            // Fallback для разных типов ресурсов
            console.log('[ServiceWorker] Ошибка загрузки:', request.url);
            
            if (request.destination === 'style') {
              return new Response(
                '/* Fallback CSS */ body { background: #0f0f0f; color: #e9e9e9; }',
                { headers: { 'Content-Type': 'text/css' } }
              );
            }
            
            if (request.destination === 'script') {
              return new Response(
                'console.log("Fallback JS loaded");',
                { headers: { 'Content-Type': 'application/javascript' } }
              );
            }
            
            // Для manifest - возвращаем базовый
            if (request.url.includes('manifest')) {
              return new Response(
                JSON.stringify({
                  name: "Калькулятор",
                  short_name: "Калькулятор",
                  start_url: "./",
                  display: "standalone",
                  background_color: "#0f0f0f",
                  theme_color: "#111111"
                }),
                { headers: { 'Content-Type': 'application/manifest+json' } }
              );
            }
            
            return new Response('Оффлайн', { 
              status: 408, 
              headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
            });
          });
      })
  );
});

// ✅ Фоновая синхронизация для обновлений
self.addEventListener('sync', event => {
  if (event.tag === 'update-check') {
    console.log('[ServiceWorker] Фоновая проверка обновлений');
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    for (const url of CACHE_FILES) {
      try {
        const networkResponse = await fetch(url, { cache: 'no-cache' });
        const cachedResponse = await cache.match(url);
        
        if (!cachedResponse || 
            networkResponse.headers.get('etag') !== cachedResponse.headers.get('etag')) {
          console.log('[ServiceWorker] Обнаружено обновление:', url);
          await cache.put(url, networkResponse.clone());
          
          // Уведомляем клиентов об обновлении
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              url: url
            });
          });
        }
      } catch (error) {
        console.log('[ServiceWorker] Ошибка проверки обновления:', url, error);
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
  
  if (event.data && event.data.type === 'CHECK_UPDATES') {
    checkForUpdates();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// ✅ Периодическая фоновая синхронизация
self.addEventListener('periodicsync', event => {
  if (event.tag === 'background-update') {
    console.log('[ServiceWorker] Периодическая проверка обновлений');
    event.waitUntil(checkForUpdates());
  }
});
