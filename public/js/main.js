/**
 * main.js
 * SPA Router — history API section switching + shared Three.js background.
 */

/** Resolve deploy base from this module URL (/dist/main.js or /Roshin/dist/main.js). */
function detectBasePath() {
  try {
    const path = new URL(import.meta.url).pathname;
    const idx = path.lastIndexOf('/dist/');
    if (idx > 0) return path.slice(0, idx);
    if (idx === 0) return '';
  } catch (_) { /* ignore */ }
  return typeof window !== 'undefined' && window.__RGR_BASE__
    ? String(window.__RGR_BASE__)
    : '';
}

const BASE_PATH = detectBasePath();

const ROUTES = {
  hero:     { sectionId: 'sectionHero' },
  about:    { sectionId: 'sectionAbout' },
  projects: { sectionId: 'sectionProjects' },
  skills:   { sectionId: 'sectionSkills' },
  contact:  { sectionId: 'sectionContact' },
};

let currentRoute = null;
let isNavigating = false;
let nexusScene = null;
const transition = document.getElementById('pageTransition');

function routeUrl(route) {
  if (route === 'hero') return BASE_PATH ? `${BASE_PATH}/` : '/';
  return `${BASE_PATH}/${route}`;
}

function showRouteSection(route) {
  Object.entries(ROUTES).forEach(([key, { sectionId }]) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.hidden = key !== route;
  });

  document.querySelectorAll('[data-section]').forEach((el) => {
    const active = el.dataset.section === route;
    el.classList.toggle('nav__link--active', active);
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}

function revealRoute(route) {
  const sectionId = ROUTES[route]?.sectionId;
  if (!sectionId) return;
  document.querySelectorAll(`#${sectionId} .reveal-item`).forEach((el) => {
    el.classList.add('reveal-item--visible');
  });
}

async function navigate(route, pushState = true) {
  if (isNavigating || !ROUTES[route] || route === currentRoute) return;
  isNavigating = true;

  transition?.classList.add('page-transition--active');

  await new Promise((resolve) => {
    setTimeout(() => {
      showRouteSection(route);

      const url = routeUrl(route);
      if (pushState) {
        history.pushState({ route }, '', url);
      } else {
        history.replaceState({ route }, '', url);
      }

      currentRoute = route;
      revealRoute(route);

      transition?.classList.remove('page-transition--active');
      setTimeout(() => { isNavigating = false; }, 50);
      resolve();
    }, 220);
  });
}

function markCanvasFailed(canvas, reason) {
  console.warn('[Nexus]', reason);
  if (!canvas) return;
  canvas.classList.add('bg-canvas--fallback');
  canvas.dataset.nexusError = String(reason?.message || reason || 'failed');
}

async function initNexusBackground() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas || nexusScene) return;
  try {
    const { createNexusSphere } = await import('./scenes/nexus-sphere.js');
    nexusScene = createNexusSphere(canvas);
    canvas.classList.add('bg-canvas--ready');
    canvas.classList.remove('bg-canvas--fallback');
  } catch (err) {
    markCanvasFailed(canvas, err);
  }
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-section]');
  if (!link) return;
  e.preventDefault();
  navigate(link.dataset.section);
});

window.addEventListener('popstate', (e) => {
  const route = e.state?.route || resolveInitialRoute();
  if (route === currentRoute) return;
  navigate(route, false);
});

document.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const routes = Object.keys(ROUTES);
  const idx = routes.indexOf(currentRoute);
  if (idx === -1) return;
  const next = e.key === 'ArrowRight'
    ? routes[Math.min(idx + 1, routes.length - 1)]
    : routes[Math.max(idx - 1, 0)];
  navigate(next);
});

function resolveInitialRoute() {
  let path = window.location.pathname;
  if (BASE_PATH && path.startsWith(BASE_PATH)) {
    path = path.slice(BASE_PATH.length) || '/';
  }
  path = path.replace(/^\//, '').replace(/\/$/, '');
  if (path === '' || path === 'index.html') return 'hero';
  if (ROUTES[path]) return path;
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (ROUTES[hash]) return hash;
  return 'hero';
}

function signalAppReady() {
  window.__RGR_READY__ = true;
  window.dispatchEvent(new CustomEvent('rgr:ready'));
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  // Only register at site root scopes (custom domain / user pages)
  if (BASE_PATH) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('[SW] Registered:', reg.scope);
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const initial = resolveInitialRoute();

  history.replaceState({ route: initial }, '', routeUrl(initial));
  showRouteSection(initial);
  currentRoute = null;

  // Start Three.js in parallel — never block the loader on WebGL
  initNexusBackground();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          await navigate(initial, false);
        } finally {
          signalAppReady();
        }
      }, 40);
    });
  });

  window.addEventListener('load', () => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    idle(() => {
      import('./animations.js').then((module) => {
        module.initThemeToggle();
        module.initMobileMenu();
        module.initScrollTracer();
        module.initScrollReveal();
        module.initContactForm();
        module.initButtonGlow();
        module.initProjectCardTilt();
        module.initFooterYear();
      });
    });
  }, { once: true });

  registerSW();
});
