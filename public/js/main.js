/**
 * main.js
 * SPA Router — history API + IntersectionObserver scene management.
 * Lazy-initialises Three.js scenes on first section activation.
 */

import { isMobile } from './utils/device.js';
import { mountRenderer, resizeRenderer, getRenderer } from './utils/renderer-singleton.js';
/* ─────────────────────────────────────────────────────────
   ROUTE DEFINITIONS
───────────────────────────────────────────────────────── */
const ROUTES = {
  hero:     { sectionId: 'sectionHero',     getScene: () => import('./scenes/hero.js').then(m => m.HeroScene) },
  about:    { sectionId: 'sectionAbout',    getScene: () => import('./scenes/about.js').then(m => m.AboutScene) },
  projects: { sectionId: 'sectionProjects', getScene: () => import('./scenes/projects.js').then(m => m.ProjectsScene) },
  skills:   { sectionId: 'sectionSkills',   getScene: () => import('./scenes/skills.js').then(m => m.SkillsScene) },
  contact:  { sectionId: 'sectionContact',  getScene: () => import('./scenes/contact.js').then(m => m.ContactScene) },
};

/* Scene instances — lazy-created on first activation */
const scenes = {};

/* ─────────────────────────────────────────────────────────
   ROUTER
───────────────────────────────────────────────────────── */
let currentRoute = null;
let navigationCount = 0;
let isNavigating = false;
const transition = document.getElementById('pageTransition');

async function navigate(route, pushState = true) {
  if (isNavigating || !ROUTES[route] || route === currentRoute) return;
  isNavigating = true;

  // ── Fade out ────────────────────────────────────────────
  transition?.classList.add('page-transition--active');

  // Pre-fetch the scene class while fading out
  const next = ROUTES[route];
  let SceneClass;
  try {
    SceneClass = await next.getScene();
  } catch (e) {
    console.error('Failed to load scene', e);
  }

  setTimeout(() => {
    // ── Deactivate current ─────────────────────────────────
    let prevRoute = currentRoute;
    if (currentRoute) {
      const prev = ROUTES[currentRoute];
      const prevSection = document.getElementById(prev.sectionId);
      if (prevSection) prevSection.hidden = true;
      if (scenes[currentRoute]) scenes[currentRoute].pause();
    }

    // ── Activate new ───────────────────────────────────────
    const nextSection = document.getElementById(next.sectionId);
    if (nextSection) nextSection.hidden = false;

    // Lazy-init scene
    if (!scenes[route] && SceneClass) {
      const instance = new SceneClass();
      instance.init();
      scenes[route] = instance;
      
      // Validation logging (only happens once per scene)
      setTimeout(() => {
          const renderer = getRenderer();
          if (renderer && renderer.info) {
              console.log(`[Validation] ${route} Scene draw calls:`, renderer.info.render.calls);
              console.log(`[Validation] ${route} Scene geometries:`, renderer.info.memory.geometries);
          }
      }, 500); // Wait for first render
    }
    if (scenes[route]) scenes[route].resume();

    // Update nav active state
    document.querySelectorAll('[data-section]').forEach(el => {
      el.classList.toggle('nav__link--active', el.dataset.section === route);
    });

    // Push to browser history
    if (pushState) {
      const url = route === 'hero' ? '/' : `/${route}`;
      history.pushState({ route }, '', url);
    }

    currentRoute = route;
    navigationCount++;

    // Mount shared renderer to the new scene's canvas slot (skip secondary on mobile)
    if (scenes[route].canvas) {
      if (isMobile() && route !== 'hero') {
        scenes[route].pause();
      } else {
        mountRenderer(scenes[route].canvas);
        resizeRenderer(scenes[route].camera);
      }
    }

    // Dispose old scenes that haven't been active recently
    Object.keys(scenes).forEach(sceneRoute => {
      if (sceneRoute === currentRoute) return;
      if (sceneRoute === prevRoute) return;

      const scene = scenes[sceneRoute];
      if (!scene._lastNavCount) scene._lastNavCount = navigationCount;
      
      if (navigationCount - scene._lastNavCount > 2) {
        scene.dispose();
        delete scenes[sceneRoute];
      }
    });
    
    // Update active scene's nav count
    if (scenes[route]) {
      scenes[route]._lastNavCount = navigationCount;
    }

    // Trigger scroll reveal for visible items
    setTimeout(() => {
      document.querySelectorAll(`#${next.sectionId} .reveal-item`).forEach(el => {
        el.classList.add('reveal-item--visible');
      });
    }, 50);

    // ── Fade in ─────────────────────────────────────────────
    transition?.classList.remove('page-transition--active');
    
    setTimeout(() => { isNavigating = false; }, 50);
  }, 280);
}

/* ─────────────────────────────────────────────────────────
   EVENT DELEGATION — nav clicks
───────────────────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-section]');
  if (!link) return;
  e.preventDefault();
  navigate(link.dataset.section);
});

/* ─────────────────────────────────────────────────────────
   POPSTATE — browser back/forward
───────────────────────────────────────────────────────── */
window.addEventListener('popstate', (e) => {
  const route = e.state?.route || 'hero';
  navigate(route, false);
});

/* ─────────────────────────────────────────────────────────
   KEYBOARD NAVIGATION — arrow keys on nav links
───────────────────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const routes = Object.keys(ROUTES);
  const idx    = routes.indexOf(currentRoute);
  if (idx === -1) return;
  const next = e.key === 'ArrowRight'
    ? routes[Math.min(idx + 1, routes.length - 1)]
    : routes[Math.max(idx - 1, 0)];
  navigate(next);
});

/* ─────────────────────────────────────────────────────────
   INITIAL ROUTE — resolve from URL path
───────────────────────────────────────────────────────── */
function resolveInitialRoute() {
  const path    = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  const matched = Object.keys(ROUTES).find(r => r === path);
  return matched || 'hero';
}

/* ─────────────────────────────────────────────────────────
   SERVICE WORKER REGISTRATION
───────────────────────────────────────────────────────── */
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Registered:', reg.scope);
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  }
}

/* ─────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Navigate to initial route (loads + starts first scene)
  const initial = resolveInitialRoute();
  
  // Yield to the browser so it can paint the FCP hero text *before* the main
  // thread is occupied by WebGL context creation + Three.js chunk parsing.
  // Two rAFs ensure the first frame is committed; the 50ms gap gives slow mobile
  // CPUs enough runway to finish CSS paint before blocking JS work starts.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        navigate(initial, false);
      }, 50);
    });
  });

  // Load UI animations after the page has fully loaded — this ensures animations.js
  // never competes with LCP painting on mobile. window.load fires after all resources
  // (images, fonts, scripts) have settled, which is the safest deferral point.
  window.addEventListener('load', () => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    idle(() => {
      import('./animations.js').then(module => {
        module.initThemeToggle();
        module.initMobileMenu();
        module.initScrollTracer();
        module.initScrollReveal();
        module.initContactForm();
        module.initButtonGlow();
        module.initFooterYear();
      });
    });
  }, { once: true });

  // Register Service Worker after page is interactive
  registerSW();
});

