/**
 * main.js
 * SPA Router — history API + IntersectionObserver scene management.
 * Lazy-initialises Three.js scenes on first section activation.
 */

import { HeroScene }     from './scenes/hero.js';
import { AboutScene }    from './scenes/about.js';
import { ProjectsScene } from './scenes/projects.js';
import { SkillsScene }   from './scenes/skills.js';
import { ContactScene }  from './scenes/contact.js';

import {
  initScrollReveal,
  initScrollTracer,
  initContactForm,
  initThemeToggle,
  initMobileMenu,
  initButtonGlow,
  initFooterYear,
} from './animations.js';

/* ─────────────────────────────────────────────────────────
   ROUTE DEFINITIONS
───────────────────────────────────────────────────────── */
const ROUTES = {
  hero:     { sectionId: 'sectionHero',     SceneClass: HeroScene     },
  about:    { sectionId: 'sectionAbout',    SceneClass: AboutScene    },
  projects: { sectionId: 'sectionProjects', SceneClass: ProjectsScene },
  skills:   { sectionId: 'sectionSkills',  SceneClass: SkillsScene   },
  contact:  { sectionId: 'sectionContact', SceneClass: ContactScene  },
};

/* Scene instances — lazy-created on first activation */
const scenes = {};

/* ─────────────────────────────────────────────────────────
   ROUTER
───────────────────────────────────────────────────────── */
let currentRoute = null;
const transition = document.getElementById('pageTransition');

function navigate(route, pushState = true) {
  if (!ROUTES[route] || route === currentRoute) return;

  // ── Fade out ────────────────────────────────────────────
  transition?.classList.add('page-transition--active');

  setTimeout(() => {
    // ── Deactivate current ─────────────────────────────────
    if (currentRoute) {
      const prev = ROUTES[currentRoute];
      const prevSection = document.getElementById(prev.sectionId);
      if (prevSection) prevSection.hidden = true;
      if (scenes[currentRoute]) scenes[currentRoute].pause();
    }

    // ── Activate new ───────────────────────────────────────
    const next = ROUTES[route];
    const nextSection = document.getElementById(next.sectionId);
    if (nextSection) nextSection.hidden = false;

    // Lazy-init scene
    if (!scenes[route]) {
      const instance = new next.SceneClass();
      instance.init();
      scenes[route] = instance;
    }
    scenes[route].resume();

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

    // Trigger scroll reveal for visible items
    setTimeout(() => {
      document.querySelectorAll(`#${next.sectionId} .reveal-item`).forEach(el => {
        el.classList.add('reveal-item--visible');
      });
    }, 50);

    // ── Fade in ─────────────────────────────────────────────
    transition?.classList.remove('page-transition--active');
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
  // Start non-Three.js interactivity immediately
  initThemeToggle();
  initMobileMenu();
  initScrollTracer();
  initScrollReveal();
  initContactForm();
  initButtonGlow();
  initFooterYear();

  // Navigate to initial route (loads + starts first scene)
  const initial = resolveInitialRoute();
  navigate(initial, false);

  // Register Service Worker after page is interactive
  registerSW();
});
