/**
 * script.js — Roshin RG Portfolio
 * SPA router + interactions + Canvas 2D visual scenes
 * Pure Vanilla JS — zero external dependencies
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS & COLOURS
   ══════════════════════════════════════════════════════════════════ */
const GOLD_HEX  = '#d4af37';
const GOLD      = (a) => `rgba(212,175,55,${a})`;

/* ══════════════════════════════════════════════════════════════════
   GLOBAL STATE
   ══════════════════════════════════════════════════════════════════ */
const state = {
  section: 'hero',
  mouse: { x: 0, y: 0, nx: 0, ny: 0 },
  cursor: { x: 0, y: 0 },
  mobileNavOpen: false,
  scenes: {},
};

/* ══════════════════════════════════════════════════════════════════
   UTILS
   ══════════════════════════════════════════════════════════════════ */
const lerp    = (a, b, t) => a + (b - a) * t;
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const $       = (id) => document.getElementById(id);
const $$      = (sel) => document.querySelectorAll(sel);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/** Safely run fn — handles the case where 'load' already fired (fast pages + defer) */
function onLoad(fn) {
  if (document.readyState === 'complete') { fn(); }
  else { window.addEventListener('load', fn, { once: true }); }
}

/* ══════════════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ══════════════════════════════════════════════════════════════════ */
(function () {
  const dot  = $('cursorDot');
  const ring = $('cursorRingInner');
  const body = document.body;
  let rx = 0, ry = 0;

  (function tick() {
    rx = lerp(rx, state.cursor.x, 0.1);
    ry = lerp(ry, state.cursor.y, 0.1);
    ring.style.transform = `translate(calc(${rx}px - 50%),calc(${ry}px - 50%))`;
    requestAnimationFrame(tick);
  })();

  document.addEventListener('mousemove', (e) => {
    state.cursor.x = e.clientX; state.cursor.y = e.clientY;
    state.mouse.x  = e.clientX; state.mouse.y  = e.clientY;
    state.mouse.nx = e.clientX / window.innerWidth  * 2 - 1;
    state.mouse.ny = -(e.clientY / window.innerHeight * 2 - 1);
    dot.style.transform = `translate(calc(${e.clientX}px - 50%),calc(${e.clientY}px - 50%))`;
  }, { passive: true });

  const sel = 'a,button,[tabindex],.project-card,.contact__link-item,.about__stat';
  document.addEventListener('mouseover', e => { if (e.target.closest(sel)) body.classList.add('cursor--hover'); }, { passive: true });
  document.addEventListener('mouseout',  e => { if (e.target.closest(sel)) body.classList.remove('cursor--hover'); }, { passive: true });
})();

/* ══════════════════════════════════════════════════════════════════
   MOBILE NAV
   ══════════════════════════════════════════════════════════════════ */
function closeMobileNav() {
  $('mobileNav').classList.remove('mobile-nav--open');
  $('navHamburger').setAttribute('aria-expanded', 'false');
  state.mobileNavOpen = false;
}

(function () {
  const btn   = $('navHamburger');
  const nav   = $('mobileNav');
  const close = $('mobileNavClose');
  btn.addEventListener('click', () => {
    state.mobileNavOpen = !state.mobileNavOpen;
    nav.classList.toggle('mobile-nav--open', state.mobileNavOpen);
    btn.setAttribute('aria-expanded', String(state.mobileNavOpen));
  });
  close.addEventListener('click', closeMobileNav);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.mobileNavOpen) closeMobileNav(); });
})();

/* ══════════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════════════════════════════════ */
function triggerReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('reveal--visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => { if (!el.classList.contains('reveal--visible')) io.observe(el); });
}

/* ══════════════════════════════════════════════════════════════════
   SPA ROUTER
   ══════════════════════════════════════════════════════════════════ */
(function () {
  const secs = {
    hero: $('sectionHero'), about: $('sectionAbout'),
    projects: $('sectionProjects'), skills: $('sectionSkills'), contact: $('sectionContact'),
  };
  const overlay = $('pageTransition');

  function navigateTo(id) {
    if (id === state.section || !secs[id]) return;
    overlay.classList.add('page-transition--in');
    setTimeout(() => {
      Object.values(secs).forEach(s => s.classList.remove('section--active'));
      secs[id].classList.add('section--active');
      state.section = id;
      $$('.nav__link').forEach(l => l.classList.toggle('nav__link--active', l.dataset.section === id));
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(triggerReveal, 50);
      if (id === 'about'   && !state.scenes.avatar)  initAvatarScene();
      if (id === 'skills'  && !state.scenes.skills)  initSkillsScene();
      if (id === 'contact' && !state.scenes.contact) initContactScene();
      overlay.classList.remove('page-transition--in');
      closeMobileNav();
    }, 200);
  }

  $$('[data-section]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.section); });
  });

  window.navigateTo = navigateTo;
})();

/* ══════════════════════════════════════════════════════════════════
   STICKY NAV
   ══════════════════════════════════════════════════════════════════ */
(function () {
  const nav = $('mainNav');
  window.addEventListener('scroll', debounce(() => nav.classList.toggle('nav--scrolled', window.scrollY > 10), 10), { passive: true });
})();

/* ══════════════════════════════════════════════════════════════════
   TYPEWRITER
   ══════════════════════════════════════════════════════════════════ */
(function () {
  const el = $('typewriter');
  if (!el) return;
  const words = ['Front-End Developer', 'SPA Architect', 'AI & Data Science Student', 'Vanilla JS Specialist'];
  let wi = 0, ci = 0, del = false;
  function tick() {
    const w = words[wi];
    if (!del) {
      el.textContent = w.slice(0, ++ci);
      if (ci === w.length) { del = true; setTimeout(tick, 1800); return; }
      setTimeout(tick, 75 + Math.random() * 40);
    } else {
      el.textContent = w.slice(0, --ci);
      if (ci === 0) { del = false; wi = (wi + 1) % words.length; setTimeout(tick, 400); return; }
      setTimeout(tick, 40);
    }
  }
  setTimeout(tick, 1200);
})();

/* ══════════════════════════════════════════════════════════════════
   PROJECT CARD TILT
   ══════════════════════════════════════════════════════════════════ */
$$('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const dx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
    card.style.transform = `perspective(800px) rotateY(${dx*8}deg) rotateX(${-dy*6}deg) translateZ(6px)`;
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top ) / r.height * 100).toFixed(1) + '%');
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ══════════════════════════════════════════════════════════════════
   CONTACT FORM
   ══════════════════════════════════════════════════════════════════ */
(function () {
  const form  = $('contactForm');
  const btn   = $('formSubmitBtn');
  const label = $('formSubmitText');
  const toast = $('toast');
  if (!form) return;

  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbw97MFfNON_HAKfOryamFU21x33bhZzeWXBRjfnxUD51pxMpw2L_T5rwe56kka_iAI/exec';

  function showToast(msg, err = false) {
    toast.textContent = msg;
    toast.classList.toggle('toast--error', err);
    toast.classList.add('toast--visible');
    setTimeout(() => toast.classList.remove('toast--visible'), 4000);
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name    = $('contactName').value.trim();
    const email   = $('contactEmail').value.trim();
    const phone   = $('contactPhone').value.trim();
    const subject = $('contactSubject').value.trim();
    const message = $('contactMessage').value.trim();
    if (!name || !email || !message) return showToast('Please fill in all required fields.', true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Please enter a valid email address.', true);
    btn.disabled = true; label.textContent = 'Sending…';
    try {
      await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ name, email, phone, subject, message }) });
      showToast("Message sent! I'll reply within 24 hours. ✓"); form.reset();
    } catch { showToast('Network error. Please try again.', true); }
    finally { btn.disabled = false; label.textContent = 'Send Message →'; }
  });
})();

/* ══════════════════════════════════════════════════════════════════
   KEYBOARD NAV
   ══════════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  const list = ['hero', 'about', 'projects', 'skills', 'contact'];
  const i = list.indexOf(state.section);
  if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && i < list.length - 1) window.navigateTo(list[i + 1]);
  if ((e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   && i > 0)              window.navigateTo(list[i - 1]);
});

/* ══════════════════════════════════════════════════════════════════
   3D PROJECTION HELPER  (shared by hero + avatar)
   Simple perspective projection with Y-axis rotation.
   ══════════════════════════════════════════════════════════════════ */
function project3(x, y, z, rotY, rotX, cx, cy, scale, fov) {
  fov = fov || 4;
  // Rotate Y
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  let rx = x * cosY + z * sinY;
  let ry = y;
  let rz = z * cosY - x * sinY;
  // Rotate X
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const ry2 =  ry * cosX - rz * sinX;
  const rz2 =  ry * sinX + rz * cosX;
  // Perspective divide
  const d = fov / (fov + rz2 + fov * 0.5);  // keep d always > 0
  return [cx + rx * d * scale, cy + ry2 * d * scale, rz2];
}

/* ══════════════════════════════════════════════════════════════════
   CANVAS — HERO SCENE
   Gold particles on a sphere + rotating icosahedron wireframe
   ══════════════════════════════════════════════════════════════════ */
function initHeroScene() {
  const canvas = $('heroCanvas');
  if (!canvas || state.scenes.hero) return;
  state.scenes.hero = true;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', debounce(resize, 200));

  /* ── Particles on sphere ── */
  const COUNT = POINTER ? 300 : 160;
  const pts = Array.from({ length: COUNT }, () => {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 0.85 + Math.random() * 0.3;     // slight thickness
    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta) * 0.65,  // flatten vertically
      z: r * Math.cos(phi),
      size:  1.2 + Math.random() * 1.8,
      alpha: 0.45 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4,
      ox: 0, oy: 0,  // repulsion offset
    };
  });

  /* ── Icosahedron vertices ── */
  const PHI = (1 + Math.sqrt(5)) / 2;
  const N   = Math.sqrt(1 + PHI * PHI);
  const V   = [
    [0,   1/N, PHI/N], [0,  -1/N, PHI/N], [0,   1/N,-PHI/N], [0,  -1/N,-PHI/N],
    [1/N, PHI/N, 0  ], [-1/N, PHI/N, 0  ], [1/N,-PHI/N, 0  ], [-1/N,-PHI/N, 0  ],
    [PHI/N, 0, 1/N  ], [-PHI/N, 0, 1/N  ], [PHI/N, 0,-1/N  ], [-PHI/N, 0,-1/N  ],
  ];
  const E = [
    [0,1],[0,4],[0,5],[0,8],[0,9],
    [1,6],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,5],[2,10],[2,11],
    [3,6],[3,7],[3,10],[3,11],
    [4,5],[4,8],[4,10],
    [5,9],[5,11],
    [6,7],[6,8],[6,10],
    [7,9],[7,11],[8,10],[9,11],
  ];

  let rotY = 0, rotX = 0, tiltY = 0, tiltX = 0, t = 0;

  function draw() {
    requestAnimationFrame(draw);
    if (state.section !== 'hero') return;

    ctx.clearRect(0, 0, W, H);

    const cx = W * 0.5, cy = H * 0.5;
    const R  = Math.min(W, H) * 0.28;   // particle sphere radius
    const IR = Math.min(W, H) * 0.17;   // icosahedron radius

    t     += 0.015;
    rotY  += 0.005;

    // Smooth tilt toward mouse
    if (POINTER) {
      tiltY = lerp(tiltY, state.mouse.nx * 0.25, 0.04);
      tiltX = lerp(tiltX, -state.mouse.ny * 0.18, 0.04);
    }
    rotX = lerp(rotX, tiltX, 0.06);

    /* ── Draw ambient glow ── */
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, IR * 2.2);
    grd.addColorStop(0, GOLD(0.07));
    grd.addColorStop(1, GOLD(0));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    /* ── Draw icosahedron edges ── */
    ctx.lineWidth = 1;
    for (const [ai, bi] of E) {
      const [ax, ay, az] = project3(...V[ai], rotY, rotX, cx, cy, IR);
      const [bx, by, bz] = project3(...V[bi], rotY, rotX, cx, cy, IR);
      // Depth-based alpha: edges facing camera are brighter
      const depth = clamp(1 - (az + 1.5) / 3, 0, 1);
      ctx.strokeStyle = GOLD(0.15 + depth * 0.55);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    /* ── Draw particles ── */
    for (const p of pts) {
      p.phase += p.speed * 0.01;
      // Gentle floating
      const px = p.x + Math.sin(p.phase) * 0.04;
      const py = p.y + Math.cos(p.phase * 1.3) * 0.025;
      const [sx, sy, sz] = project3(px, py, p.z, rotY + 0.2, rotX, cx, cy, R);

      // Mouse repulsion
      if (POINTER) {
        const dx = sx - state.mouse.x, dy = sy - state.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 90) {
          const f = (90 - dist) / 90;
          p.ox = lerp(p.ox, dx / dist * f * 45, 0.08);
          p.oy = lerp(p.oy, dy / dist * f * 45, 0.08);
        } else {
          p.ox = lerp(p.ox, 0, 0.05);
          p.oy = lerp(p.oy, 0, 0.05);
        }
      }

      // Depth shading
      const depth = clamp((sz + 1.5) / 3, 0, 1);
      const alpha = p.alpha * (0.4 + depth * 0.6);
      const size  = p.size  * (0.5 + depth * 0.7);

      ctx.beginPath();
      ctx.arc(sx + p.ox, sy + p.oy, size, 0, Math.PI * 2);
      ctx.fillStyle = GOLD(alpha);
      ctx.fill();
    }
  }

  if (!REDUCED) draw();
}

/* ══════════════════════════════════════════════════════════════════
   CANVAS — AVATAR SCENE  (About section)
   Animated torus-knot Lissajous silhouette
   ══════════════════════════════════════════════════════════════════ */
function initAvatarScene() {
  const canvas = $('avatarCanvas');
  if (!canvas || state.scenes.avatar) return;
  state.scenes.avatar = true;

  const ctx = canvas.getContext('2d');
  const W = canvas.width  = canvas.clientWidth  || 300;
  const H = canvas.height = canvas.clientHeight || 300;
  const cx = W / 2, cy = H / 2;
  const R  = Math.min(W, H) * 0.4;

  // Torus-knot parametric (p=2, q=3)
  const STEPS = 240;
  function tkPt(u) {
    const p = 2, q = 3;
    const r = Math.cos(q * u) + 2.2;
    return [r * Math.cos(p * u), r * Math.sin(p * u), -Math.sin(q * u)];
  }
  const raw = Array.from({ length: STEPS + 1 }, (_, i) => tkPt(i / STEPS * Math.PI * 2));

  let angle = 0;

  function draw() {
    requestAnimationFrame(draw);
    if (state.section !== 'about') return;

    ctx.clearRect(0, 0, W, H);
    angle += 0.014;

    // Project all points
    const proj = raw.map(([x, y, z]) => project3(x, y, z, angle, angle * 0.5, cx, cy, R / 3.5));

    // Glow
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    grd.addColorStop(0, GOLD(0.08)); grd.addColorStop(1, GOLD(0));
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // Sort segments by Z (painter's algorithm)
    const segs = [];
    for (let i = 0; i < STEPS; i++) {
      const [x1, y1, z1] = proj[i], [x2, y2, z2] = proj[i + 1];
      segs.push({ x1, y1, x2, y2, z: (z1 + z2) / 2 });
    }
    segs.sort((a, b) => a.z - b.z);

    for (const s of segs) {
      const depth = clamp((s.z + 2) / 4, 0, 1);
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.strokeStyle = GOLD(0.25 + depth * 0.7);
      ctx.lineWidth   = 0.6 + depth * 2.2;
      ctx.stroke();
    }

    // Highlight dots on front-facing vertices
    for (let i = 0; i < STEPS; i += 8) {
      const [sx, sy, sz] = proj[i];
      const d = clamp((sz + 2) / 4, 0, 1);
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + d * 2, 0, Math.PI * 2);
      ctx.fillStyle = GOLD(d * 0.7);
      ctx.fill();
    }
  }

  if (!REDUCED) draw();
}

/* ══════════════════════════════════════════════════════════════════
   CANVAS — SKILLS SCENE
   Floating label pills with depth + parallax
   ══════════════════════════════════════════════════════════════════ */
function initSkillsScene() {
  const canvas = $('skillsCanvas');
  if (!canvas || state.scenes.skills) return;
  state.scenes.skills = true;

  const ctx = canvas.getContext('2d');
  let W = canvas.clientWidth || 1000;
  let H = canvas.clientHeight || 400;
  canvas.width = W; canvas.height = H;

  window.addEventListener('resize', debounce(() => {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W; canvas.height = H;
  }, 150));

  const SKILLS = [
    { label: 'Vanilla JS',   star: true,  x:-0.70, y: 0.30, z: 0.0 },
    { label: 'HTML5',        star: true,  x: 0.36, y: 0.40, z: 0.3 },
    { label: 'CSS3',         star: true,  x:-0.24, y: 0.12, z: 0.8 },
    { label: 'jQuery',       star: true,  x: 0.64, y: 0.20, z:-0.4 },
    { label: 'SPA Patterns', star: true,  x:-0.56, y:-0.25, z: 0.5 },
    { label: 'BEM CSS',      star: true,  x: 0.40, y:-0.35, z: 0.2 },
    { label: 'Three.js',     star: false, x:-0.10, y: 0.45, z:-0.5 },
    { label: 'Python',       star: false, x: 0.76, y:-0.12, z: 0.3 },
    { label: 'Git',          star: false, x:-0.76, y: 0.00, z:-0.2 },
    { label: 'CSS Grid',     star: false, x: 0.04, y:-0.45, z: 0.6 },
    { label: 'Flexbox',      star: false, x:-0.36, y:-0.05, z:-0.8 },
    { label: 'WebGL',        star: false, x:-0.44, y: 0.25, z: 0.9 },
    { label: 'Service Worker',star:false, x: 0.52, y: 0.05, z:-0.7 },
    { label: 'CSS Props',    star: false, x: 0.20, y:-0.15, z:-1.0 },
    { label: 'Web APIs',     star: false, x:-0.04, y: 0.00, z: 1.2 },
  ].map(s => ({ ...s, phase: Math.random() * Math.PI * 2, spd: 0.4 + Math.random() * 0.4 }));

  let t = 0, pX = 0, pY = 0;

  function draw() {
    requestAnimationFrame(draw);
    if (state.section !== 'skills') return;

    t   += 0.012;
    pX   = lerp(pX, state.mouse.nx * 0.05, 0.04);
    pY   = lerp(pY, -state.mouse.ny * 0.025, 0.04);

    ctx.clearRect(0, 0, W, H);

    const sorted = [...SKILLS].sort((a, b) => a.z - b.z);

    for (const s of sorted) {
      const depth = clamp((s.z + 1.2) / 2.4, 0, 1);
      const fy    = Math.sin(t * s.spd + s.phase) * 0.04;
      const sx    = W / 2 + (s.x + pX) * W * 0.46;
      const sy    = H / 2 + (s.y + fy + pY) * H * 0.40;
      const fSize = Math.round((12 + depth * 6) * (0.7 + depth * 0.5));
      const label = s.label;

      ctx.save();
      ctx.globalAlpha = 0.5 + depth * 0.5;
      ctx.font = `${s.star ? 600 : 400} ${fSize}px "Space Grotesk",sans-serif`;

      const tw  = ctx.measureText(label).width;
      const ph  = fSize * 1.7;
      const pw  = tw + fSize * 1.6;
      const bx  = sx - pw / 2;
      const by  = sy - ph / 2;
      const rad = ph * 0.42;

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(bx, by, pw, ph, rad)
        : (() => { ctx.moveTo(bx+rad,by); ctx.lineTo(bx+pw-rad,by); ctx.quadraticCurveTo(bx+pw,by,bx+pw,by+rad); ctx.lineTo(bx+pw,by+ph-rad); ctx.quadraticCurveTo(bx+pw,by+ph,bx+pw-rad,by+ph); ctx.lineTo(bx+rad,by+ph); ctx.quadraticCurveTo(bx,by+ph,bx,by+ph-rad); ctx.lineTo(bx,by+rad); ctx.quadraticCurveTo(bx,by,bx+rad,by); ctx.closePath(); })();

      ctx.fillStyle   = s.star ? GOLD(0.12 + depth * 0.1) : `rgba(12,12,12,${0.75 + depth * 0.2})`;
      ctx.fill();
      ctx.strokeStyle = s.star ? GOLD(0.6 + depth * 0.35) : GOLD(0.15 + depth * 0.2);
      ctx.lineWidth   = 1;
      ctx.stroke();

      ctx.fillStyle    = s.star ? GOLD_HEX : `rgba(192,192,184,${0.75 + depth * 0.25})`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, sx, sy);
      ctx.restore();
    }
  }

  if (!REDUCED) draw();
}

/* ══════════════════════════════════════════════════════════════════
   CANVAS — CONTACT SCENE
   Animated perspective grid with mouse parallax
   ══════════════════════════════════════════════════════════════════ */
function initContactScene() {
  const canvas = $('contactCanvas');
  if (!canvas || state.scenes.contact) return;
  state.scenes.contact = true;

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

  function draw() {
    requestAnimationFrame(draw);
    if (state.section !== 'contact') return;

    ctx.clearRect(0, 0, W, H);
    angle += 0.003;

    const px   = lerp(0, state.mouse.nx * W * 0.05, 0.6);
    const vpX  = W / 2 + px;
    const vpY  = H * 0.36;
    const cols = 10, rows = 10;
    const sprd = W * 0.88;
    const dep  = H * 0.62;

    // Vertical lines
    for (let i = 0; i <= cols; i++) {
      const t  = i / cols;
      const bx = -sprd / 2 + sprd * t;
      const ox = bx * Math.sin(angle) * 0.18;
      const ed = Math.abs(t - 0.5) * 2;
      ctx.beginPath();
      ctx.moveTo(vpX + ox * 0.2, vpY);
      ctx.lineTo(vpX + bx, vpY + dep);
      ctx.strokeStyle = GOLD(0.38 - ed * 0.24);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Horizontal lines
    for (let j = 1; j <= rows; j++) {
      const ft = Math.pow(j / rows, 1.55);
      const y  = vpY + ft * dep;
      ctx.beginPath();
      ctx.moveTo(vpX + lerp(0, -sprd / 2, ft), y);
      ctx.lineTo(vpX + lerp(0,  sprd / 2, ft), y);
      ctx.strokeStyle = GOLD(ft * 0.38);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Horizon fade
    const grd = ctx.createLinearGradient(0, 0, 0, vpY + 24);
    grd.addColorStop(0, 'rgba(10,10,10,1)');
    grd.addColorStop(1, 'rgba(10,10,10,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, vpY + 24);
  }

  if (!REDUCED) draw();
}

/* ══════════════════════════════════════════════════════════════════
   BOOT  — safe: handles both fast pages and slow ones
   ══════════════════════════════════════════════════════════════════ */
setTimeout(triggerReveal, 100);

onLoad(() => {
  initHeroScene();
  setTimeout(triggerReveal, 200);
});
