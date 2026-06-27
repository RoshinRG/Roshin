/**
 * script.js — Roshin RG Portfolio
 * SPA router + all interactions + Canvas 2D visual scenes
 * Pure Vanilla JS — zero external dependencies
 *
 * PERF: Three.js/WebGL removed entirely. All decorative scenes are now
 * native Canvas 2D — same visual effect, zero CDN requests, zero parse cost.
 * Savings: ~230 KiB network, ~252ms script evaluation, ~73ms parse/compile.
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS & COLOURS
   ══════════════════════════════════════════════════════════════════ */
const GOLD_HEX  = '#d4af37';
const GOLD_RGBA = (a) => `rgba(212,175,55,${a})`;

/* ══════════════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════════════ */
const state = {
  currentSection: 'hero',
  mouse: { x: 0, y: 0, nx: 0, ny: 0 },
  cursorPos: { x: 0, y: 0 },
  isMobileNavOpen: false,
  scenes: {},
};

/* ══════════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ══════════════════════════════════════════════════════════════════ */
const lerp = (a, b, t) => a + (b - a) * t;

function debounce(fn, ms) {
  let id;
  return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
}

function $(id) { return document.getElementById(id); }

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ══════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ══════════════════════════════════════════════════════════════════ */
(function initCursor() {
  const dot  = $('cursorDot');
  const ring = $('cursorRingInner');
  const body = document.body;

  let ringX = 0, ringY = 0;
  (function animateRing() {
    ringX = lerp(ringX, state.cursorPos.x, 0.1);
    ringY = lerp(ringY, state.cursorPos.y, 0.1);
    ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
    requestAnimationFrame(animateRing);
  })();

  document.addEventListener('mousemove', (e) => {
    state.cursorPos.x = e.clientX;
    state.cursorPos.y = e.clientY;
    dot.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
  }, { passive: true });

  const hoverTargets = 'a, button, [tabindex], .project-card, .contact__link-item, .about__stat';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) body.classList.add('cursor--hover');
  }, { passive: true });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) body.classList.remove('cursor--hover');
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

  const navLinks  = document.querySelectorAll('[data-section]');
  const transition = $('pageTransition');

  function navigateTo(section) {
    if (section === state.currentSection) return;
    if (!sections[section]) return;

    transition.classList.add('page-transition--in');

    setTimeout(() => {
      Object.values(sections).forEach(el => el.classList.remove('section--active'));
      sections[section].classList.add('section--active');
      state.currentSection = section;

      document.querySelectorAll('.nav__link').forEach(link => {
        link.classList.toggle('nav__link--active', link.dataset.section === section);
      });

      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(triggerReveal, 50);

      // Lazy-init canvas scenes on first visit
      if (section === 'about'   && !state.scenes.avatar)  initAvatarScene();
      if (section === 'skills'  && !state.scenes.skills)  initSkillsScene();
      if (section === 'contact' && !state.scenes.contact) initContactScene();

      transition.classList.remove('page-transition--in');
      closeMobileNav();
    }, 200);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(link.dataset.section); });
  });
  document.querySelectorAll('.footer__link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(link.dataset.section); });
  });

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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isMobileNavOpen) closeMobileNav();
  });
})();

/* ══════════════════════════════════════════════════════════════════
   STICKY NAV
   ══════════════════════════════════════════════════════════════════ */
(function initStickyNav() {
  const nav = $('mainNav');
  window.addEventListener('scroll', debounce(() => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 10);
  }, 10), { passive: true });
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
      if (ci === current.length) { deleting = true; setTimeout(tick, 1800); return; }
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
   SCROLL REVEAL
   ══════════════════════════════════════════════════════════════════ */
function triggerReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('reveal--visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.classList.contains('reveal--visible')) io.observe(el);
  });
}

setTimeout(triggerReveal, 100);

/* ══════════════════════════════════════════════════════════════════
   PROJECT CARD — 3D TILT
   ══════════════════════════════════════════════════════════════════ */
(function initProjectTilt() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
      const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
      card.style.transform = `perspective(800px) rotateY(${dx * 8}deg) rotateX(${-dy * 6}deg) translateZ(6px)`;
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top ) / rect.height * 100).toFixed(1) + '%');
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

/* ══════════════════════════════════════════════════════════════════
   CONTACT FORM — Google Sheets integration
   ══════════════════════════════════════════════════════════════════ */
(function initContactForm() {
  const form  = $('contactForm');
  const btn   = $('formSubmitBtn');
  const label = $('formSubmitText');
  const toast = $('toast');
  if (!form) return;

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

    if (!name || !email || !message) { showToast('Please fill in all required fields.', true); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email address.', true); return; }

    btn.disabled = true;
    label.textContent = 'Sending…';

    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      showToast("Message sent! I'll reply within 24 hours. ✓");
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
   MOUSE TRACKING
   ══════════════════════════════════════════════════════════════════ */
document.addEventListener('mousemove', debounce((e) => {
  state.mouse.x  = e.clientX;
  state.mouse.y  = e.clientY;
  state.mouse.nx = (e.clientX / window.innerWidth)  * 2 - 1;
  state.mouse.ny = -(e.clientY / window.innerHeight) * 2 + 1;
}, 16), { passive: true });

/* ══════════════════════════════════════════════════════════════════
   CANVAS 2D — HERO PARTICLE FIELD
   Scene: gold particle sphere + rotating wireframe icosahedron
   Replaces: Three.js WebGLRenderer + IcosahedronGeometry + Points
   ══════════════════════════════════════════════════════════════════ */
function initHeroScene() {
  const canvas = $('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W = window.innerWidth, H = window.innerHeight;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
  }
  resize();
  window.addEventListener('resize', debounce(resize, 150));

  // ── Particles ──
  const COUNT = FINE_POINTER ? 320 : 180;
  const particles = Array.from({ length: COUNT }, () => {
    const r = 0.28 + Math.random() * 0.18;          // 28%–46% of viewport min-dim radius
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    return {
      bx: Math.sin(phi) * Math.cos(theta) * r,
      by: Math.sin(phi) * Math.sin(theta) * r * 0.55, // flatten to ellipse
      bz: Math.cos(phi),
      px: 0, py: 0,                                  // current (for repulsion lerp)
      size: 0.8 + Math.random() * 1.2,
      alpha: 0.3 + Math.random() * 0.5,
      speed: 0.0002 + Math.random() * 0.0003,
      phase: Math.random() * Math.PI * 2,
    };
  });

  // ── Icosahedron wireframe vertices ──
  const t = (1 + Math.sqrt(5)) / 2;
  const icoVerts = [
    [-1, t, 0], [1, t, 0], [-1,-t, 0], [ 1,-t, 0],
    [ 0,-1, t], [0, 1, t], [ 0,-1,-t], [ 0, 1,-t],
    [ t, 0,-1], [t, 0, 1], [-t, 0,-1], [-t, 0, 1],
  ].map(([x, y, z]) => { const l = Math.hypot(x, y, z); return [x/l, y/l, z/l]; });

  const icoEdges = [
    [0,1],[0,5],[0,7],[0,10],[0,11],
    [1,5],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,6],[2,10],[2,11],
    [3,4],[3,6],[3,8],[3,9],
    [4,5],[4,9],[4,11],
    [5,9],[5,11],
    [6,7],[6,8],[6,10],
    [7,8],[7,10],
    [8,9],[10,11],
  ];

  let rotY = 0, rotX = 0;
  let tiltX = 0, tiltY = 0;

  function project3D(x, y, z, cx, cy, scale) {
    // Simple perspective projection with Y/X rotation
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    // Rotate Y
    let rx = x * cosY + z * sinY;
    let ry = y;
    let rz = -x * sinY + z * cosY;
    // Rotate X
    const ry2 = ry * cosX - rz * sinX;
    const rz2 = ry * sinX + rz * cosX;
    const fov = 2.8;
    const zd  = fov - rz2;
    return [cx + rx / zd * scale, cy + ry2 / zd * scale];
  }

  let frame = 0;

  function animate() {
    if (state.currentSection !== 'hero') { requestAnimationFrame(animate); return; }
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const dim = Math.min(W, H);
    const scale = dim * 0.85;

    frame++;
    rotY += 0.004;

    // Tilt toward cursor
    if (FINE_POINTER) {
      tiltX = lerp(tiltX, state.mouse.ny * -0.3, 0.04);
      tiltY = lerp(tiltY, state.mouse.nx *  0.3, 0.04);
    }
    rotX = lerp(rotX, tiltX, 0.05);

    // ── Draw particles ──
    for (const p of particles) {
      p.phase += p.speed;
      const px2d = p.bx + Math.sin(p.phase) * 0.015;
      const py2d = p.by + Math.cos(p.phase * 1.3) * 0.01;
      const [sx, sy] = project3D(px2d, py2d, p.bz * 0.35, cx, cy, scale);

      // Repulsion
      if (FINE_POINTER) {
        const mx = state.mouse.x, my = state.mouse.y;
        const dx = sx - mx, dy = sy - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          p.px = lerp(p.px, dx / dist * force * 40, 0.08);
          p.py = lerp(p.py, dy / dist * force * 40, 0.08);
        } else {
          p.px = lerp(p.px, 0, 0.05);
          p.py = lerp(p.py, 0, 0.05);
        }
      }

      ctx.beginPath();
      ctx.arc(sx + p.px, sy + p.py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = GOLD_RGBA(p.alpha);
      ctx.fill();
    }

    // ── Draw icosahedron wireframe ──
    const icoScale = dim * 0.22;
    const icoCX = cx - dim * 0.05;

    for (const [ai, bi] of icoEdges) {
      const [ax, ay] = project3D(...icoVerts[ai], icoCX, cy, icoScale);
      const [bx, by] = project3D(...icoVerts[bi], icoCX, cy, icoScale);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = GOLD_RGBA(0.45);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Gold glow dot at centre
    const grd = ctx.createRadialGradient(icoCX, cy, 0, icoCX, cy, icoScale * 0.6);
    grd.addColorStop(0, GOLD_RGBA(0.06));
    grd.addColorStop(1, GOLD_RGBA(0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(icoCX, cy, icoScale * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!REDUCED_MOTION) animate();
  state.scenes.hero = true;
}

/* ══════════════════════════════════════════════════════════════════
   CANVAS 2D — AVATAR SCENE (About section)
   Scene: animated gold torus-knot-like Lissajous curve
   Replaces: Three.js TorusKnotGeometry + MeshStandardMaterial
   ══════════════════════════════════════════════════════════════════ */
function initAvatarScene() {
  const canvas = $('avatarCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width  = canvas.clientWidth  || 300;
  const H = canvas.height = canvas.clientHeight || 300;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.38;

  // Lissajous-like torus knot (p=2, q=3) projection
  function torusKnotPoint(t) {
    const p = 2, q = 3;
    const r = Math.cos(q * t) + 2;
    const x = r * Math.cos(p * t);
    const y = r * Math.sin(p * t);
    const z = -Math.sin(q * t);
    return [x, y, z];
  }

  const STEPS = 200;
  const pts = Array.from({ length: STEPS + 1 }, (_, i) => torusKnotPoint(i / STEPS * Math.PI * 2));

  let angle = 0;

  function animate() {
    requestAnimationFrame(animate);
    if (state.currentSection !== 'about') return;

    ctx.clearRect(0, 0, W, H);
    angle += 0.012;

    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const cosB = Math.cos(angle * 0.7), sinB = Math.sin(angle * 0.7);

    // Project and draw the knot curve with depth shading
    const projected = pts.map(([x, y, z]) => {
      // Rotate Y
      const rx = x * cosA + z * sinA;
      const ry = y;
      const rz = -x * sinA + z * cosA;
      // Rotate X
      const ry2 = ry * cosB - rz * sinB;
      const rz2 = ry * sinB + rz * cosB;
      const sc = 4 / (4 + rz2);
      return [cx + rx * sc * R / 3, cy + ry2 * sc * R / 3, rz2];
    });

    // Draw fill glow
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
    grd.addColorStop(0, GOLD_RGBA(0.06));
    grd.addColorStop(1, GOLD_RGBA(0));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Sort by Z for painter's algorithm
    const segments = [];
    for (let i = 0; i < STEPS; i++) {
      const [x1, y1, z1] = projected[i];
      const [x2, y2, z2] = projected[i + 1];
      segments.push({ x1, y1, x2, y2, z: (z1 + z2) / 2 });
    }
    segments.sort((a, b) => a.z - b.z);

    for (const seg of segments) {
      const depth = (seg.z + 2.5) / 5;        // normalise to 0–1
      const alpha = 0.3 + depth * 0.7;
      const width = 0.5 + depth * 2.0;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.strokeStyle = GOLD_RGBA(alpha);
      ctx.lineWidth = width;
      ctx.stroke();
    }

    // Wireframe dots
    for (const [sx, sy, sz] of projected.slice(0, STEPS)) {
      const depth = (sz + 2.5) / 5;
      if (Math.random() < 0.15) {
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 * depth + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = GOLD_RGBA(depth * 0.8);
        ctx.fill();
      }
    }
  }

  if (!REDUCED_MOTION) animate();
  state.scenes.avatar = true;
}

/* ══════════════════════════════════════════════════════════════════
   CANVAS 2D — SKILLS SCENE
   Scene: floating skill label pills in 3D parallax
   Replaces: Three.js Sprite + CanvasTexture
   ══════════════════════════════════════════════════════════════════ */
function initSkillsScene() {
  const canvas = $('skillsCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W = canvas.clientWidth || 1000;
  let H = canvas.clientHeight || 400;
  canvas.width = W; canvas.height = H;

  window.addEventListener('resize', debounce(() => {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W; canvas.height = H;
  }, 150));

  const skills = [
    { label: 'Vanilla JS',   star: true,  x: -0.7, y:  0.3, z: 0.0 },
    { label: 'HTML5',        star: true,  x:  0.36, y:  0.4, z: 0.3 },
    { label: 'CSS3',         star: true,  x: -0.24, y:  0.12, z: 0.8 },
    { label: 'jQuery',       star: true,  x:  0.64, y:  0.2, z: -0.4 },
    { label: 'SPA Patterns', star: true,  x: -0.56, y: -0.25, z: 0.5 },
    { label: 'BEM CSS',      star: true,  x:  0.40, y: -0.35, z: 0.2 },
    { label: 'Three.js',     star: false, x: -0.10, y:  0.45, z: -0.5 },
    { label: 'Python',       star: false, x:  0.76, y: -0.12, z: 0.3 },
    { label: 'Git',          star: false, x: -0.76, y:  0.0, z: -0.2 },
    { label: 'CSS Grid',     star: false, x:  0.04, y: -0.45, z: 0.6 },
    { label: 'Flexbox',      star: false, x: -0.36, y: -0.05, z: -0.8 },
    { label: 'WebGL',        star: false, x: -0.44, y:  0.25, z: 0.9 },
    { label: 'Service Worker', star: false, x: 0.52, y: 0.05, z: -0.7 },
    { label: 'CSS Props',    star: false, x:  0.20, y: -0.15, z: -1.0 },
    { label: 'Intersection\u200BObs.', star: false, x: -0.04, y: 0.0, z: 1.2 },
  ].map(s => ({ ...s, phase: Math.random() * Math.PI * 2, speed: 0.4 + Math.random() * 0.4 }));

  let t = 0, parallaxX = 0, parallaxY = 0;

  function animate() {
    requestAnimationFrame(animate);
    if (state.currentSection !== 'skills') return;
    t += 0.012;

    parallaxX = lerp(parallaxX, state.mouse.nx * 0.04, 0.04);
    parallaxY = lerp(parallaxY, -state.mouse.ny * 0.02, 0.04);

    ctx.clearRect(0, 0, W, H);

    // Sort by z for depth order
    const sorted = [...skills].sort((a, b) => a.z - b.z);

    for (const s of sorted) {
      const depth = (s.z + 1.2) / 2.4;          // 0 (back) → 1 (front)
      const floatY = Math.sin(t * s.speed + s.phase) * 0.04;
      const sx = (W / 2) + (s.x + parallaxX) * W * 0.47;
      const sy = (H / 2) + (s.y + floatY + parallaxY) * H * 0.42;

      const alpha   = 0.5 + depth * 0.5;
      const scale   = 0.7 + depth * 0.55;
      const fSize   = Math.round((11 + depth * 5) * scale);
      const label   = s.label;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${s.star ? '600' : '400'} ${fSize}px "Space Grotesk", sans-serif`;

      const tw  = ctx.measureText(label).width;
      const ph  = fSize * 1.6;
      const pw  = tw + fSize * 1.4;
      const rx  = sx - pw / 2;
      const ry  = sy - ph / 2;
      const rad = ph * 0.42;

      // Pill background
      ctx.beginPath();
      ctx.moveTo(rx + rad, ry);
      ctx.lineTo(rx + pw - rad, ry);
      ctx.quadraticCurveTo(rx + pw, ry, rx + pw, ry + rad);
      ctx.lineTo(rx + pw, ry + ph - rad);
      ctx.quadraticCurveTo(rx + pw, ry + ph, rx + pw - rad, ry + ph);
      ctx.lineTo(rx + rad, ry + ph);
      ctx.quadraticCurveTo(rx, ry + ph, rx, ry + ph - rad);
      ctx.lineTo(rx, ry + rad);
      ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
      ctx.closePath();

      ctx.fillStyle   = s.star ? GOLD_RGBA(0.12 + depth * 0.08) : `rgba(12,12,12,${0.7 + depth * 0.2})`;
      ctx.fill();
      ctx.strokeStyle = s.star ? GOLD_RGBA(0.6 + depth * 0.3) : GOLD_RGBA(0.15 + depth * 0.15);
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Label text
      ctx.fillStyle   = s.star ? GOLD_HEX : `rgba(192,192,184,${0.7 + depth * 0.3})`;
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, sx, sy);
      ctx.restore();
    }
  }

  if (!REDUCED_MOTION) animate();
  state.scenes.skills = true;
}

/* ══════════════════════════════════════════════════════════════════
   CANVAS 2D — CONTACT SCENE
   Scene: animated perspective gold grid
   Replaces: Three.js GridHelper + WebGLRenderer
   ══════════════════════════════════════════════════════════════════ */
function initContactScene() {
  const canvas = $('contactCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  let W = parent.clientWidth || 600;
  let H = parent.clientHeight || 500;
  canvas.width = W; canvas.height = H;

  window.addEventListener('resize', debounce(() => {
    W = parent.clientWidth; H = parent.clientHeight;
    canvas.width = W; canvas.height = H;
  }, 150));

  let angle = 0;

  function drawGrid() {
    ctx.clearRect(0, 0, W, H);

    const parallax = state.mouse.nx * 0.08;
    const vp = { x: W / 2 + parallax * W * 0.1, y: H * 0.38 };  // vanishing point
    const horizon = vp.y;
    const cols = 10, rows = 10;
    const spread = W * 0.9;
    const depth  = H * 0.65;

    angle += 0.003;

    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      const t = i / cols;
      const bx = -spread / 2 + spread * t;
      const ox = bx * Math.cos(angle) * 0.15;

      ctx.beginPath();
      ctx.moveTo(vp.x + ox, horizon);
      ctx.lineTo(vp.x + bx, horizon + depth);
      const edgeDist = Math.abs(t - 0.5) * 2;
      ctx.strokeStyle = GOLD_RGBA(0.35 - edgeDist * 0.22);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Horizontal lines (perspective spacing)
    for (let j = 1; j <= rows; j++) {
      const ft = Math.pow(j / rows, 1.6);   // perspective foreshortening
      const y  = horizon + ft * depth;
      const xLeft  = vp.x + lerp(0, -spread / 2, ft);
      const xRight = vp.x + lerp(0,  spread / 2, ft);
      const alpha  = ft * 0.4;
      ctx.beginPath();
      ctx.moveTo(xLeft, y);
      ctx.lineTo(xRight, y);
      ctx.strokeStyle = GOLD_RGBA(alpha);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Fade mask at top (hide above horizon)
    const grd = ctx.createLinearGradient(0, 0, 0, horizon + 20);
    grd.addColorStop(0, 'rgba(15,15,15,1)');
    grd.addColorStop(1, 'rgba(15,15,15,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, horizon + 20);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (state.currentSection !== 'contact') return;
    drawGrid();
  }

  if (!REDUCED_MOTION) animate();
  state.scenes.contact = true;
}

/* ══════════════════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  initHeroScene();
  // About, Skills, Contact lazy-init on first section visit

  setTimeout(triggerReveal, 200);
});

/* ══════════════════════════════════════════════════════════════════
   KEYBOARD NAVIGATION
   ══════════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  const sections = ['hero', 'about', 'projects', 'skills', 'contact'];
  const idx = sections.indexOf(state.currentSection);
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    if (idx < sections.length - 1) window.navigateTo(sections[idx + 1]);
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    if (idx > 0) window.navigateTo(sections[idx - 1]);
  }
});
