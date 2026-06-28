/**
 * sw.js — Service Worker for RGR Portfolio PWA
 * Strategy: Cache-first for static assets, network-first for API calls.
 */

const CACHE_NAME    = 'rgr-portfolio-v1';
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
  '/js/scenes/shared.js',
  '/js/utils/three-setup.js',
  '/js/utils/particle-system.js',
  '/js/utils/shader.js',
  '/googlef5738759e2f6272f.html',
  '/sitemap.xml',
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
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: Cache-first for static, network-first for API ─ */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and CDN Three.js (cache handled by browser)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('formspree.io')) return;
  if (url.hostname.includes('jsdelivr.net')) return;
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('gstatic.com')) return;

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
