const CACHE_NAME = 'calc-pwa-v8.3';
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

// ✅ УПРОЩЕННАЯ логика fetch - ЗАКОММЕНТИРОВАТЬ СЛОЖНЫЙ КОД
self.addEventListener('fetch', (event) => {
  // Простая логика - всегда из сети, с fallback на кэш
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// ✅ Обработка сообщений от главного потока
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
// Service Worker для GitHub Pages
const CACHE_NAME = 'calc-pwa-github';

// GitHub Pages требует простой Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Простой fetch для обхода ограничений GitHub
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
