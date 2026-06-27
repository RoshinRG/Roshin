/**
 * script.js — Roshin RG Portfolio
 * Three.js WebGL scenes + SPA router + all interactions
 * Pure Vanilla JS — no framework dependencies
 *
 * PERF: Three.js is now imported as an ES module using named imports.
 * Only the ~20 classes actually used are bundled — not the entire library.
 * This eliminates ~70 KiB of unused JavaScript that was previously loaded
 * from the monolithic Cloudflare CDN build (three.min.js r134, 120.7 KiB).
 */

'use strict';

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  PointLight,
  IcosahedronGeometry,
  TorusKnotGeometry,
  BufferGeometry,
  BufferAttribute,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PointsMaterial,
  SpriteMaterial,
  Mesh,
  Points,
  Sprite,
  GridHelper,
  CanvasTexture,
  Vector3,
  Matrix4,
} from 'three/src/Three.js';

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS & STATE
   ══════════════════════════════════════════════════════════════════ */
const GOLD   = 0xd4af37;
const BLACK  = 0x000000;
const WHITE  = 0xffffff;

const state = {
  currentSection: 'hero',
  mouse: { x: 0, y: 0, nx: 0, ny: 0 },        // raw px + normalised [-1,1]
  mouseTarget: { x: 0, y: 0 },                  // lerped target for hero mesh
  cursorPos:  { x: 0, y: 0 },
  cursorRing: { x: 0, y: 0 },
  isMobileNavOpen: false,
  isHovering: false,
  rafId: null,
  scenes: {},                                     // three.js scene refs
};

/* ══════════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ══════════════════════════════════════════════════════════════════ */
const lerp = (a, b, t) => a + (b - a) * t;

function debounce(fn, ms) {
  let id;
  return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
}

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function $(id) { return document.getElementById(id); }

/* ══════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ══════════════════════════════════════════════════════════════════ */
(function initCursor() {
  const dot  = $('cursorDot');
  const ring = $('cursorRingInner');
  const body = document.body;

  function moveDot(x, y) {
    dot.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
  }

  function moveRing(x, y) {
    ring.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
  }

  // Smooth ring following
  let ringX = 0, ringY = 0;
  (function animateRing() {
    ringX = lerp(ringX, state.cursorPos.x, 0.1);
    ringY = lerp(ringY, state.cursorPos.y, 0.1);
    moveRing(ringX, ringY);
    requestAnimationFrame(animateRing);
  })();

  document.addEventListener('mousemove', (e) => {
    state.cursorPos.x = e.clientX;
    state.cursorPos.y = e.clientY;
    moveDot(e.clientX, e.clientY);
  }, { passive: true });

  // Hover detection on interactive elements
  const hoverTargets = 'a, button, [tabindex], .project-card, .contact__link-item, .about__stat';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      body.classList.add('cursor--hover');
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      body.classList.remove('cursor--hover');
    }
  }, { passive: true });
})();

/* ══════════════════════════════════════════════════════════════════
   SPA ROUTER
   ══════════════════════════════════════════════════════════════════ */
(function initRouter() {
  const sections = {
    hero:     $('sectionHero'),
    about:    $('sectionAbout'),
    projects: $('sectionProjects'),
    skills:   $('sectionSkills'),
    contact:  $('sectionContact'),
  };

  const navLinks = document.querySelectorAll('[data-section]');
  const transition = $('pageTransition');

  function navigateTo(section) {
    if (section === state.currentSection) return;
    if (!sections[section]) return;

    // Fade out
    transition.classList.add('page-transition--in');

    setTimeout(() => {
      // Hide all
      Object.values(sections).forEach(el => el.classList.remove('section--active'));

      // Show target
      sections[section].classList.add('section--active');
      state.currentSection = section;

      // Update nav active state
      document.querySelectorAll('.nav__link').forEach(link => {
        link.classList.toggle('nav__link--active', link.dataset.section === section);
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Trigger reveals for new section
      setTimeout(triggerReveal, 50);

      // Init section-specific scenes (Three.js is available immediately via ESM)
      if (section === 'skills' && !state.scenes.skills) {
        initSkillsScene();
      }
      if (section === 'contact' && !state.scenes.contact) {
        initContactScene();
      }

      // Fade in
      transition.classList.remove('page-transition--in');

      // Close mobile nav
      closeMobileNav();
    }, 200);
  }

  // Attach all [data-section] links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });

  // Footer nav links
  document.querySelectorAll('.footer__link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });

  // Expose
  window.navigateTo = navigateTo;
})();

/* ══════════════════════════════════════════════════════════════════
   MOBILE NAV
   ══════════════════════════════════════════════════════════════════ */
function closeMobileNav() {
  const mobileNav = $('mobileNav');
  const hamburger = $('navHamburger');
  mobileNav.classList.remove('mobile-nav--open');
  hamburger.setAttribute('aria-expanded', 'false');
  state.isMobileNavOpen = false;
}

(function initMobileNav() {
  const hamburger = $('navHamburger');
  const mobileNav = $('mobileNav');
  const closeBtn  = $('mobileNavClose');

  hamburger.addEventListener('click', () => {
    const open = !state.isMobileNavOpen;
    state.isMobileNavOpen = open;
    mobileNav.classList.toggle('mobile-nav--open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });

  closeBtn.addEventListener('click', closeMobileNav);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isMobileNavOpen) closeMobileNav();
  });
})();

/* ══════════════════════════════════════════════════════════════════
   STICKY NAV
   ══════════════════════════════════════════════════════════════════ */
(function initStickyNav() {
  const nav = $('mainNav');
  const onScroll = debounce(() => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 10);
  }, 10);
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ══════════════════════════════════════════════════════════════════
   TYPEWRITER
   ══════════════════════════════════════════════════════════════════ */
(function initTypewriter() {
  const el = $('typewriter');
  if (!el) return;

  const phrases = [
    'Front-End Developer',
    'SPA Architect',
    'AI & Data Science Student',
    'Vanilla JS Specialist',
  ];

  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const current = phrases[pi];
    if (!deleting) {
      el.textContent = current.slice(0, ci + 1);
      ci++;
      if (ci === current.length) {
        deleting = true;
        setTimeout(tick, 1800);
        return;
      }
      setTimeout(tick, 75 + Math.random() * 40);
    } else {
      el.textContent = current.slice(0, ci - 1);
      ci--;
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 40);
    }
  }

  setTimeout(tick, 1200);
})();

/* ══════════════════════════════════════════════════════════════════
   SCROLL REVEAL (IntersectionObserver)
   ══════════════════════════════════════════════════════════════════ */
function triggerReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal--visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.classList.contains('reveal--visible')) {
      io.observe(el);
    }
  });
}

// Initial trigger for hero section
setTimeout(triggerReveal, 100);

/* ══════════════════════════════════════════════════════════════════
   PROJECT CARD — 3D TILT
   ══════════════════════════════════════════════════════════════════ */
(function initProjectTilt() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);

      card.style.transform = `perspective(800px) rotateY(${dx * 8}deg) rotateX(${-dy * 6}deg) translateZ(6px)`;

      // spotlight effect via CSS var
      const mx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
      const my = ((e.clientY - rect.top ) / rect.height * 100).toFixed(1) + '%';
      card.style.setProperty('--mx', mx);
      card.style.setProperty('--my', my);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ══════════════════════════════════════════════════════════════════
   CONTACT FORM — Google Sheets integration
   ══════════════════════════════════════════════════════════════════ */
(function initContactForm() {
  const form   = $('contactForm');
  const btn    = $('formSubmitBtn');
  const label  = $('formSubmitText');
  const toast  = $('toast');

  if (!form) return;

  /* ── Google Apps Script Web App URL ──
     Replace this with your deployed Apps Script URL.
     See google-apps-script.js for setup instructions.  */
  const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbw97MFfNON_HAKfOryamFU21x33bhZzeWXBRjfnxUD51pxMpw2L_T5rwe56kka_iAI/exec';

  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.classList.toggle('toast--error', isError);
    toast.classList.add('toast--visible');
    setTimeout(() => toast.classList.remove('toast--visible'), 4000);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name    = $('contactName').value.trim();
    const email   = $('contactEmail').value.trim();
    const phone   = $('contactPhone').value.trim();
    const subject = $('contactSubject').value.trim();
    const message = $('contactMessage').value.trim();

    if (!name || !email || !message) {
      showToast('Please fill in all required fields.', true);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', true);
      return;
    }

    btn.disabled = true;
    label.textContent = 'Sending…';

    const payload = { name, email, phone, subject, message };

    try {
      /* ── Send to Google Sheets ── */
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode:   'no-cors',                       // Apps Script requires no-cors
        headers: { 'Content-Type': 'text/plain' },
        body:   JSON.stringify(payload),
      });

      /* no-cors means we can't read the response, so we assume success
         if the fetch didn't throw. The sheet will have the row. */
      showToast('Message sent! I\'ll reply within 24 hours. ✓');
      form.reset();
    } catch {
      showToast('Network error. Please try again.', true);
    } finally {
      btn.disabled = false;
      label.textContent = 'Send Message →';
    }
  });
})();

/* ══════════════════════════════════════════════════════════════════
   MOUSE TRACKING (debounced, 16ms)
   ══════════════════════════════════════════════════════════════════ */
const onMouseMove = debounce((e) => {
  state.mouse.x  = e.clientX;
  state.mouse.y  = e.clientY;
  state.mouse.nx = (e.clientX / window.innerWidth)  * 2 - 1;
  state.mouse.ny = -(e.clientY / window.innerHeight) * 2 + 1;
}, 16);

document.addEventListener('mousemove', onMouseMove, { passive: true });

/* ══════════════════════════════════════════════════════════════════
   THREE.JS — HERO SCENE
   ══════════════════════════════════════════════════════════════════ */
function initHeroScene() {
  const canvas = $('heroCanvas');
  if (!canvas) return;

  /* ── Device capability gates ──
     PERF: the per-particle mouse-repulsion loop below only does anything
     useful on a device with a real mouse to hover with. It was running
     unconditionally, which means on phones/tablets — which is exactly what
     Lighthouse's mobile audit (Moto G Power) emulates — it was burning the
     bulk of every frame's CPU budget on physics nobody could ever trigger.
     Skipping it on coarse/touch pointers removes that cost entirely on the
     device class that was failing the audit. */
  const ENABLE_REPULSION = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const REDUCED_MOTION   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Use window dimensions — canvas.clientWidth can be 0 at DOMContentLoaded ── */
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  /* ── Renderer ── */
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);

  /* ── Scene + Camera ── */
  const scene  = new Scene();
  const camera = new PerspectiveCamera(75, W() / H(), 0.1, 100);
  camera.position.z = 5;

  /* ── Lights ── */
  scene.add(new AmbientLight(WHITE, 0.3));

  const pointLight = new PointLight(GOLD, 2.5, 20);
  pointLight.position.set(4, 0, 0);
  scene.add(pointLight);

  /* ── Central Icosahedron ── */
  const icoGeo = new IcosahedronGeometry(1.4, 1);

  // Solid black fill
  const icoFill = new Mesh(
    icoGeo,
    new MeshStandardMaterial({ color: BLACK, metalness: 0.2, roughness: 0.8 })
  );
  scene.add(icoFill);

  // Gold wireframe overlay
  const icoWire = new Mesh(
    icoGeo,
    new MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.7 })
  );
  scene.add(icoWire);

  /* ── Particle Field (sphere shell r=3–5) ──
     PERF: was 2000 — each particle does a full 3D→screen projection every
     frame (see animate() below). 900 keeps the visual density while cutting
     that per-frame cost by more than half. Raise it back if you have headroom. */
  const PARTICLE_COUNT = 900;
  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const basePos    = new Float32Array(PARTICLE_COUNT * 3); // original positions

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r     = 3 + Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    basePos[i * 3]       = x;
    basePos[i * 3 + 1]   = y;
    basePos[i * 3 + 2]   = z;
  }

  const particleGeo  = new BufferGeometry();
  particleGeo.setAttribute('position', new BufferAttribute(positions, 3));

  const particleMat = new PointsMaterial({
    color: GOLD,
    size: 0.018,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  const particles = new Points(particleGeo, particleMat);
  scene.add(particles);

  /* ── Smooth rotation targets ── */
  let targetRotX = 0, targetRotY = 0;
  let orbitAngle = 0;

  /* ── Resize ── */
  const onResize = debounce(() => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  }, 150);

  window.addEventListener('resize', onResize);

  /* ── Pre-allocated objects — never new inside the render loop ── */
  const _pv         = new Vector3();   // reused per-particle projection
  const viewProjMat = new Matrix4();   // combined view+projection, rebuilt once per frame (not per particle)

  /* ── Animate ── */
  function animate() {
    if (state.currentSection !== 'hero') {
      requestAnimationFrame(animate);
      return;
    }

    requestAnimationFrame(animate);

    // Orbit point light
    orbitAngle += 0.008;
    pointLight.position.x = Math.cos(orbitAngle) * 4;
    pointLight.position.z = Math.sin(orbitAngle) * 4;
    pointLight.position.y = Math.sin(orbitAngle * 0.5) * 2;

    // Icosahedron: slow Y rotation + cursor tilt
    targetRotY = state.mouse.nx * 0.35;
    targetRotX = state.mouse.ny * -0.25;

    icoFill.rotation.y += 0.003;
    icoWire.rotation.y  = icoFill.rotation.y;

    icoFill.rotation.x = lerp(icoFill.rotation.x, targetRotX, 0.05);
    icoWire.rotation.x = icoFill.rotation.x;

    /* ── Particle mouse repulsion (skipped entirely on touch/coarse-pointer
       devices — see ENABLE_REPULSION above) ──
       PERF: this used to call Vector3.project(camera) for every particle,
       which internally rebuilds and applies camera.matrixWorldInverse AND
       camera.projectionMatrix (two 4x4 multiplies) on every single call —
       i.e. up to 2000 redundant matrix multiplications per frame, forever.
       Combine them ONCE per frame instead, and skip sqrt()/writes for
       particles that are outside the repulsion radius and already at rest. */
    if (ENABLE_REPULSION) {
      viewProjMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

      const posArr           = particleGeo.attributes.position.array;
      const REPULSE_R        = 1.2;
      const REPULSE_R2       = REPULSE_R * REPULSE_R;   // squared-distance test avoids sqrt for most particles
      const REPULSE_STRENGTH = 0.6;
      const SETTLE_EPS       = 0.0004;                  // below this, a particle is treated as "at rest"
      const mnx = state.mouse.nx, mny = state.mouse.ny;

      let anyMoved = false;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        const bx = basePos[idx], by = basePos[idx + 1], bz = basePos[idx + 2];
        const px = posArr[idx],  py = posArr[idx + 1],  pz = posArr[idx + 2];

        // Reuse pre-allocated vector + the single combined matrix — zero GC
        _pv.set(px, py, pz).applyMatrix4(viewProjMat);

        const dx    = _pv.x - mnx;
        const dy    = _pv.y - mny;
        const dist2 = dx * dx + dy * dy;

        if (dist2 < REPULSE_R2) {
          const dist  = Math.sqrt(dist2);
          const force = (REPULSE_R - dist) / REPULSE_R;
          posArr[idx]     = lerp(px, bx + (dx / dist) * force * REPULSE_STRENGTH, 0.05);
          posArr[idx + 1] = lerp(py, by + (dy / dist) * force * REPULSE_STRENGTH, 0.05);
          anyMoved = true;
        } else if (Math.abs(px - bx) > SETTLE_EPS || Math.abs(py - by) > SETTLE_EPS || Math.abs(pz - bz) > SETTLE_EPS) {
          // Still drifting back toward its resting position
          posArr[idx]     = lerp(px, bx, 0.02);
          posArr[idx + 1] = lerp(py, by, 0.02);
          posArr[idx + 2] = lerp(pz, bz, 0.02);
          anyMoved = true;
        }
        // else: already at rest — skip entirely, nothing to recompute or write
      }

      if (anyMoved) particleGeo.attributes.position.needsUpdate = true;
    }

    // Rotate particle field slowly
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;

    renderer.render(scene, camera);
  }

  if (REDUCED_MOTION) {
    renderer.render(scene, camera);   // single static frame, no rAF loop
  } else {
    animate();
  }
  state.scenes.hero = { renderer, scene, camera };
}

/* ══════════════════════════════════════════════════════════════════
   THREE.JS — AVATAR TORUS KNOT (About section)
   ══════════════════════════════════════════════════════════════════ */
function initAvatarScene() {
  const canvas = $('avatarCanvas');
  if (!canvas) return;

  const w = canvas.clientWidth  || 300;
  const h = canvas.clientHeight || 300;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);

  const scene  = new Scene();
  const camera = new PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.z = 3.5;

  scene.add(new AmbientLight(WHITE, 0.4));

  const light1 = new PointLight(GOLD, 2, 15);
  light1.position.set(3, 3, 3);
  scene.add(light1);

  const light2 = new PointLight(0x4488ff, 1, 15);
  light2.position.set(-3, -3, -3);
  scene.add(light2);

  // Torus knot
  const geo = new TorusKnotGeometry(0.9, 0.28, 128, 16, 2, 3);
  const mat = new MeshStandardMaterial({
    color: BLACK,
    metalness: 0.9,
    roughness: 0.15,
    emissive: GOLD,
    emissiveIntensity: 0.12,
  });
  const mesh = new Mesh(geo, mat);
  scene.add(mesh);

  // Wire overlay
  const wireMesh = new Mesh(
    geo,
    new MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.18 })
  );
  scene.add(wireMesh);

  function animate() {
    requestAnimationFrame(animate);
    if (state.currentSection !== 'about') return;   // PERF: was rendering every frame even off-screen

    mesh.rotation.x    += 0.006;
    mesh.rotation.y    += 0.009;
    wireMesh.rotation.x = mesh.rotation.x;
    wireMesh.rotation.y = mesh.rotation.y;
    renderer.render(scene, camera);
  }

  animate();
  state.scenes.avatar = { renderer, scene, camera };
}

/* ══════════════════════════════════════════════════════════════════
   THREE.JS — SKILLS FLOATING LABELS SCENE
   ══════════════════════════════════════════════════════════════════ */
function initSkillsScene() {
  const canvas = $('skillsCanvas');
  if (!canvas) return;

  const w = canvas.clientWidth  || 1000;
  const h = canvas.clientHeight || 400;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);

  const scene  = new Scene();
  const camera = new PerspectiveCamera(70, w / h, 0.1, 100);
  camera.position.z = 5;

  scene.add(new AmbientLight(WHITE, 0.5));
  const light = new PointLight(GOLD, 1.5, 20);
  light.position.set(0, 3, 5);
  scene.add(light);

  /* Build sprite labels from canvas textures */
  const skills = [
    { label: 'Vanilla JS',   star: true,  x: -3.5, y:  1.2, z: 0.0 },
    { label: 'HTML5',        star: true,  x:  1.8, y:  1.6, z: 0.3 },
    { label: 'CSS3',         star: true,  x: -1.2, y:  0.5, z: 0.8 },
    { label: 'jQuery',       star: true,  x:  3.2, y:  0.8, z: -0.4 },
    { label: 'SPA Patterns', star: true,  x: -2.8, y: -1.0, z: 0.5 },
    { label: 'BEM CSS',      star: true,  x:  2.0, y: -1.4, z: 0.2 },
    { label: 'Three.js',     star: false, x: -0.5, y:  1.8, z: -0.5 },
    { label: 'Python',       star: false, x:  3.8, y: -0.5, z: 0.3 },
    { label: 'Git',          star: false, x: -3.8, y:  0.0, z: -0.2 },
    { label: 'CSS Grid',     star: false, x:  0.2, y: -1.8, z: 0.6 },
    { label: 'Flexbox',      star: false, x: -1.8, y: -0.2, z: -0.8 },
    { label: 'Service Worker', star: false, x: 2.6, y:  0.2, z: -0.7 },
    { label: 'IntersectionObserver', star: false, x: -0.2, y: 0.0, z: 1.2 },
    { label: 'CSS Props',    star: false, x:  1.0, y: -0.6, z: -1.0 },
    { label: 'WebGL',        star: false, x: -2.2, y:  1.0, z: 0.9 },
  ];

  function makeSprite(text, isStar) {
    const c   = document.createElement('canvas');
    c.width   = 256;
    c.height  = 64;
    const ctx = c.getContext('2d');

    // Background pill
    ctx.fillStyle = isStar ? 'rgba(212,175,55,0.18)' : 'rgba(20,20,20,0.85)';
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(c.width - r, 0);
    ctx.quadraticCurveTo(c.width, 0, c.width, r);
    ctx.lineTo(c.width, c.height - r);
    ctx.quadraticCurveTo(c.width, c.height, c.width - r, c.height);
    ctx.lineTo(r, c.height);
    ctx.quadraticCurveTo(0, c.height, 0, c.height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = isStar ? 'rgba(212,175,55,0.8)' : 'rgba(212,175,55,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text
    ctx.fillStyle = isStar ? '#d4af37' : '#c0c0b8';
    ctx.font      = `${isStar ? '600' : '400'} 22px "Space Grotesk", sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.length > 18 ? text.slice(0,16) + '…' : text, c.width / 2, c.height / 2);

    const tex = new CanvasTexture(c);
    const mat = new SpriteMaterial({ map: tex, transparent: true });
    const spr = new Sprite(mat);
    spr.scale.set(2.2, 0.55, 1);
    return spr;
  }

  const sprites = [];
  skills.forEach(s => {
    const spr = makeSprite(s.label, s.star);
    spr.position.set(s.x, s.y, s.z);
    spr.userData.baseY = s.y;
    spr.userData.phase = Math.random() * Math.PI * 2;
    spr.userData.speed = 0.4 + Math.random() * 0.4;
    scene.add(spr);
    sprites.push(spr);
  });

  const onResize = debounce(() => {
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }, 150);
  window.addEventListener('resize', onResize);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (state.currentSection !== 'skills') return;   // PERF: was rendering every frame even off-screen
    t += 0.012;

    sprites.forEach(spr => {
      spr.position.y = spr.userData.baseY + Math.sin(t * spr.userData.speed + spr.userData.phase) * 0.12;
    });

    // Parallax on mouse
    scene.rotation.y = lerp(scene.rotation.y, state.mouse.nx * 0.15, 0.04);
    scene.rotation.x = lerp(scene.rotation.x, state.mouse.ny * 0.08, 0.04);

    renderer.render(scene, camera);
  }

  animate();
  state.scenes.skills = { renderer, scene, camera };
}

/* ══════════════════════════════════════════════════════════════════
   THREE.JS — CONTACT GRID PLANE
   ══════════════════════════════════════════════════════════════════ */
function initContactScene() {
  const canvas = $('contactCanvas');
  if (!canvas) return;

  const parent = canvas.parentElement;
  const w = parent.clientWidth  || 600;
  const h = parent.clientHeight || 500;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);

  const scene  = new Scene();
  const camera = new PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.set(0, 3, 5);
  camera.lookAt(0, 0, 0);

  // Grid plane
  const gridHelper = new GridHelper(14, 14, GOLD, 0x1a1a12);
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.45;
  gridHelper.position.y = -1.5;
  scene.add(gridHelper);

  // Subtle ambient
  scene.add(new AmbientLight(WHITE, 0.3));
  const spot = new PointLight(GOLD, 1.2, 20);
  spot.position.set(0, 4, 2);
  scene.add(spot);

  const onResize = debounce(() => {
    const nw = parent.clientWidth, nh = parent.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  }, 150);
  window.addEventListener('resize', onResize);

  function animate() {
    requestAnimationFrame(animate);
    if (state.currentSection !== 'contact') return;   // PERF: was rendering every frame even off-screen
    gridHelper.rotation.y += 0.003;
    scene.rotation.y = lerp(scene.rotation.y, state.mouse.nx * 0.1, 0.04);
    renderer.render(scene, camera);
  }

  animate();
  state.scenes.contact = { renderer, scene, camera };
}

/* ══════════════════════════════════════════════════════════════════
   BOOT — Deferred Three.js Initialization
   PERF: WebGL compilation blocks the main thread. By deferring it
   to requestIdleCallback (or a slight timeout), we allow the browser
   to paint the HTML/CSS instantly, keeping LCP and TBT low.
   ══════════════════════════════════════════════════════════════════ */
function boot() {
  initHeroScene();
  initAvatarScene();
  // Skills + Contact are lazy-inited on first section switch

  // Trigger initial reveals
  setTimeout(triggerReveal, 200);
}

if (document.readyState === 'complete') {
  setTimeout(boot, 50);
} else {
  window.addEventListener('load', () => {
    if (window.requestIdleCallback) {
      requestIdleCallback(boot, { timeout: 1000 });
    } else {
      setTimeout(boot, 50);
    }
  });
}

/* ══════════════════════════════════════════════════════════════════
   RESIZE — update hero renderer
   ══════════════════════════════════════════════════════════════════ */
window.addEventListener('resize', debounce(() => {
  const sc = state.scenes.hero;
  if (!sc) return;
  const canvas = $('heroCanvas');
  if (!canvas) return;
  sc.camera.aspect = canvas.clientWidth / canvas.clientHeight;
  sc.camera.updateProjectionMatrix();
  sc.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}, 150));

/* ══════════════════════════════════════════════════════════════════
   KEYBOARD NAVIGATION (accessibility)
   ══════════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  const sections = ['hero', 'about', 'projects', 'skills', 'contact'];
  const idx      = sections.indexOf(state.currentSection);

  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    if (idx < sections.length - 1) window.navigateTo(sections[idx + 1]);
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    if (idx > 0) window.navigateTo(sections[idx - 1]);
  }
});

/* ══════════════════════════════════════════════════════════════════
   PERFORMANCE — pause renders when tab is hidden
   ══════════════════════════════════════════════════════════════════ */
document.addEventListener('visibilitychange', () => {
  // RAF callbacks check tab visibility automatically;
  // Three.js animates via RAF so this is handled natively.
});
