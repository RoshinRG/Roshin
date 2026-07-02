/**
 * sw.js — Service Worker for RGR Portfolio PWA
 * Strategy: Cache-first for static assets, network-first for API calls.
 */

const CACHE_NAME    = 'rgr-portfolio-v4';
const CDN_CACHE     = 'rgr-cdn-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/main.js',
  '/js/animations.js',
  '/js/scenes/hero.js',
  '/js/scenes/about.js',
  '/js/scenes/projects.js',
  '/js/scenes/skills.js',
  '/js/scenes/contact.js',
  '/js/scenes/constructs.js',
  '/js/utils/three-setup.js',
  '/js/utils/particle-system.js',
  '/js/utils/shader.js',
  '/js/utils/renderer-singleton.js',
  '/sitemap.xml',
  '/robots.txt',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap'
];

/* ── INSTALL: pre-cache static assets ──────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Open as individual requests to avoid total failure on one miss
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Skipped:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: remove old caches ────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== CDN_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: Cache-first for static, network-first for API ─ */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and formspree
  if (request.method !== 'GET') return;
  if (url.hostname.includes('formspree.io')) return;

  // Stale-while-revalidate for CDN assets (Three.js, Fonts)
  if (url.hostname.includes('unpkg.com') || url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            const cloned = networkResponse.clone();
            caches.open(CDN_CACHE).then(cache => cache.put(request, cloned));
          }
          return networkResponse;
        });
        
        if (cached) {
            fetchPromise.catch(() => {}); // Ignore network errors if we have cache
            return cached;
        }
        
        return fetchPromise;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // Only cache same-origin successful responses
        if (
          response.status === 200 &&
          url.origin === self.location.origin
        ) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
