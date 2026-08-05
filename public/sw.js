/**
 * sw.js — Service Worker for RGR Portfolio PWA
 * HTML navigations: network-first (always fresh SPA shell + loader)
 * Static assets: stale-while-revalidate
 */

const CACHE_NAME = 'rgr-portfolio-v11';
const CDN_CACHE = 'rgr-cdn-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/dist/main.js',
  '/sitemap.xml',
  '/robots.txt',
];

const SPA_ROUTES = new Set(['/', '/about', '/projects', '/skills', '/contact']);

function isSpaNavigation(url) {
  const path = url.pathname.replace(/\/$/, '') || '/';
  return SPA_ROUTES.has(path) || SPA_ROUTES.has(url.pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Skipped:', url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== CDN_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.hostname.includes('formspree.io')) return;

  // CDN: stale-while-revalidate
  if (
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            const cloned = networkResponse.clone();
            caches.open(CDN_CACHE).then((cache) => cache.put(request, cloned));
          }
          return networkResponse;
        });
        if (cached) {
          fetchPromise.catch(() => {});
          return cached;
        }
        return fetchPromise;
      })
    );
    return;
  }

  // Navigations + SPA HTML: network-first so loader/shell stay up to date.
  // Deep links (/about, etc.) always resolve to the SPA shell.
  const isNavigate = request.mode === 'navigate';
  const isSpaRoute = isSpaNavigation(url);
  const isHtml =
    request.headers.get('accept')?.includes('text/html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html');

  if (isNavigate || isSpaRoute || isHtml) {
    const shellRequest = isSpaRoute ? new Request('/index.html', { headers: request.headers }) : request;
    event.respondWith(
      fetch(isSpaRoute && isNavigate ? request : shellRequest)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Always store under /index.html so deep-link cache keys don't diverge
              cache.put('/index.html', cloned);
              if (url.pathname === '/' || url.pathname === '/index.html') {
                cache.put('/', response.clone());
              }
            });
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Other same-origin assets: cache-first with network update
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.status === 200 && url.origin === self.location.origin) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
