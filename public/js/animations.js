/**
 * animations.js
 * Scroll reveal, arc reactor pulse on section entry,
 * golden tracer, nav background shift, form interactions.
 */

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver fade + slide-up
───────────────────────────────────────────────────────── */
export function initScrollReveal() {
  const items = document.querySelectorAll('.reveal-item');
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-item--visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach(el => io.observe(el));
}

/* ─────────────────────────────────────────────────────────
   SCROLL TRACER — golden vertical progress line
───────────────────────────────────────────────────────── */
export function initScrollTracer() {
  const tracer = document.getElementById('scrollTracer');
  const nav    = document.getElementById('mainNav');
  if (!tracer) return;

  const onScroll = () => {
    const scrolled = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;
    tracer.style.transform = `scaleY(${pct / 100})`;

    // Nav scroll class
    if (nav) {
      nav.classList.toggle('nav--scrolled', scrolled > 40);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once
}

/* ─────────────────────────────────────────────────────────
   CONTACT FORM — validation + Formspree submit
───────────────────────────────────────────────────────── */
export function initContactForm() {
  const form    = document.getElementById('contactForm');
  const submit  = document.getElementById('contactSubmit');
  const toast   = document.getElementById('successToast');
  if (!form) return;

  const nameInput    = document.getElementById('contactName');
  const emailInput   = document.getElementById('contactEmail');
  const phoneInput   = document.getElementById('contactPhone');
  const messageInput = document.getElementById('contactMessage');

  const nameError    = document.getElementById('nameError');
  const emailError   = document.getElementById('emailError');
  const phoneError   = document.getElementById('phoneError');
  const messageError = document.getElementById('messageError');

  function validateField(input, errorEl, validator) {
    const ok = validator(input.value.trim());
    errorEl.textContent = ok ? '' : errorEl.dataset.msg || 'Required';
    return ok;
  }

  const validators = {
    name:    v => v.length >= 2,
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone:   v => v.length === 0 || /^[\d\+\-\s\(\)]+$/.test(v), // optional, but if present must look like a phone number
    message: v => v.length >= 10,
  };

  nameError.dataset.msg    = 'Please enter your name (2+ characters)';
  emailError.dataset.msg   = 'Please enter a valid email address';
  phoneError.dataset.msg   = 'Please enter a valid phone number';
  messageError.dataset.msg = 'Message must be at least 10 characters';

  nameInput.addEventListener('blur',    () => validateField(nameInput,    nameError,    validators.name));
  emailInput.addEventListener('blur',   () => validateField(emailInput,   emailError,   validators.email));
  phoneInput.addEventListener('blur',   () => validateField(phoneInput,   phoneError,   validators.phone));
  messageInput.addEventListener('blur', () => validateField(messageInput, messageError, validators.message));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const okName    = validateField(nameInput,    nameError,    validators.name);
    const okEmail   = validateField(emailInput,   emailError,   validators.email);
    const okPhone   = validateField(phoneInput,   phoneError,   validators.phone);
    const okMessage = validateField(messageInput, messageError, validators.message);

    if (!okName || !okEmail || !okPhone || !okMessage) return;

    submit.classList.add('btn--loading');
    submit.disabled = true;

    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const res = await fetch(form.action, {
        method:  'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json' 
        },
        body:    JSON.stringify(data),
      });

      if (res.ok) {
        form.reset();
        showToast(toast);
      } else {
        const resData = await res.json().catch(() => ({}));
        const msg  = resData.errors?.map(e => e.message).join(', ') || 'Submit failed. Try again.';
        messageError.textContent = msg;
      }
    } catch {
      messageError.textContent = 'Network error. Please try again.';
    } finally {
      submit.classList.remove('btn--loading');
      submit.disabled = false;
    }
  });
}

function showToast(toast) {
  if (!toast) return;
  toast.classList.remove('toast--hide');
  toast.classList.add('toast--show');
  setTimeout(() => {
    toast.classList.remove('toast--show');
    toast.classList.add('toast--hide');
  }, 4000);
}

/* ─────────────────────────────────────────────────────────
   THEME TOGGLE
───────────────────────────────────────────────────────── */
export function initThemeToggle() {
  const btn  = document.getElementById('themeToggle');
  const root = document.documentElement; // <html> is the source of truth for data-theme
  const icon = btn?.querySelector('.nav__theme-icon');

  // Reflect the already-applied theme (set by the blocking script in <head>) into the icon
  const current = root.dataset.theme || 'dark';
  if (icon) icon.textContent = current === 'dark' ? '◑' : '☀';

  btn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    if (icon) icon.textContent = next === 'dark' ? '◑' : '☀';
    localStorage.setItem('rgr-theme', next);
  });
}

/* ─────────────────────────────────────────────────────────
   HAMBURGER MENU
───────────────────────────────────────────────────────── */
export function initMobileMenu() {
  const btn  = document.getElementById('navHamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    // Use inert to block focus + hide from AT when closed (replaces aria-hidden)
    menu.inert = open;
    menu.classList.toggle('nav__mobile-menu--open', !open);
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-section]')) {
      btn.setAttribute('aria-expanded', 'false');
      menu.inert = true;
      menu.classList.remove('nav__mobile-menu--open');
    }
  });
}

/* ─────────────────────────────────────────────────────────
   BUTTON MOUSE-GLOW (cursor radial highlight)
───────────────────────────────────────────────────────── */
export function initButtonGlow() {
  document.addEventListener('mousemove', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
    const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
    btn.style.setProperty('--mx', x + '%');
    btn.style.setProperty('--my', y + '%');
  });
}

/* ─────────────────────────────────────────────────────────
   FOOTER YEAR
───────────────────────────────────────────────────────── */
export function initFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}
