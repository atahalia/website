// Service Worker - SMKN 1 Kras PWA
const CACHE_NAME = 'smkn1kras-v3';
const OFFLINE_URL = '/offline';

// Aset yang di-cache saat install (App Shell)
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/assets/vendor/bootstrap/css/bootstrap.min.css',
  '/assets/vendor/fontawesome-free/css/all.min.css',
  '/assets/css/frontend-theme.css',
  '/assets/vendor/jquery/jquery.min.js',
  '/assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
  '/assets/img/favicon.png',
  '/assets/img/logo-sekolah.png'
];

// ── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // Cache satu per satu agar satu file gagal tidak menghentikan semua
      return Promise.allSettled(
        PRECACHE_ASSETS.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn('[SW] Gagal cache:', url, err);
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// ── Activate: hapus cache lama ────────────────────────────────────────────────
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ── Fetch: Network First untuk HTML, Cache First untuk aset statik ────────────
self.addEventListener('fetch', function (event) {
  // Abaikan request non-GET dan request ke CDN/API eksternal
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Abaikan request ke domain lain
  if (url.origin !== self.location.origin) return;

  // Admin panel — jangan di-cache
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/guru')) return;

  // Strategi: Aset statik → Cache First
  const isStaticAsset = url.pathname.startsWith('/assets/') ||
                        url.pathname.startsWith('/uploads/') ||
                        url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
          return response;
        }).catch(function () {
          // Untuk gambar yang tidak ada, tidak perlu fallback khusus
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Strategi: Halaman HTML → Network First, fallback ke cache, lalu offline page
  event.respondWith(
    fetch(event.request).then(function (response) {
      if (!response || response.status !== 200) return response;
      const clone = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(event.request, clone);
      });
      return response;
    }).catch(function () {
      return caches.match(event.request).then(function (cached) {
        return cached || caches.match(OFFLINE_URL);
      });
    })
  );
});
