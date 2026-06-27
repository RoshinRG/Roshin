/* ══════════════════════════════════════════════════════════════════
   script.js — Roshin RG Portfolio
   UI Interactions & Scroll Reveal (Vanilla JS)
   ══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initMobileNav();
  initScrollReveal();
  initNavScrollSpy();
  initContactForm();
});

/* ── Custom Cursor ── */
function initCustomCursor() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRingInner');
  if (!dot || !ring) return;

  // Only init on non-touch devices
  if (window.matchMedia('(pointer: coarse)').matches) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    document.body.classList.remove('cursor--hidden');
    return;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  
  // Use a slight lerp for the ring to trail the dot
  const speed = 0.2;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Instantly move the dot
    dot.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
  });

  const animateRing = () => {
    ringX += (mouseX - ringX) * speed;
    ringY += (mouseY - ringY) * speed;
    ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
    requestAnimationFrame(animateRing);
  };
  animateRing();

  // Hover states for interactive elements
  const interactiveElements = document.querySelectorAll('a, button, input, textarea');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('cursor-ring--hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('cursor-ring--hover'));
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    dot.classList.add('cursor-dot--hidden');
    ring.classList.add('cursor-ring--hidden');
  });
  document.addEventListener('mouseenter', () => {
    dot.classList.remove('cursor-dot--hidden');
    ring.classList.remove('cursor-ring--hidden');
  });
}

/* ── Mobile Navigation ── */
function initMobileNav() {
  const hamburger = document.getElementById('navHamburger');
  const mobileNav = document.getElementById('mobileNav');
  const navLinks = document.querySelectorAll('.nav__link');
  
  if (!hamburger || !mobileNav) return;

  const toggleNav = () => {
    const isOpen = mobileNav.classList.contains('nav__menu--open');
    mobileNav.classList.toggle('nav__menu--open');
    hamburger.setAttribute('aria-expanded', !isOpen);
  };

  hamburger.addEventListener('click', toggleNav);

  // Close nav when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileNav.classList.contains('nav__menu--open')) {
        toggleNav();
      }
    });
  });
}

/* ── Scroll Reveal ── */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Optional: stop observing once revealed
        // observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ── Navbar Scroll Spy & Background ── */
function initNavScrollSpy() {
  const nav = document.getElementById('mainNav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  window.addEventListener('scroll', () => {
    // Nav background blur on scroll
    if (window.scrollY > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }

    // Scroll Spy: highlight active link
    let currentId = '';
    const scrollPos = window.scrollY + window.innerHeight / 3;

    sections.forEach(section => {
      if (section.offsetTop <= scrollPos && (section.offsetTop + section.offsetHeight) > scrollPos) {
        currentId = section.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        link.classList.remove('nav__link--active');
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('nav__link--active');
        }
      });
    }
  }, { passive: true });
}

/* ── Contact Form Mockup ── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  if (!form || !toast) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    
    // Mock loading state
    btn.textContent = 'Sending...';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
      // Mock success
      btn.textContent = originalText;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'all';
      form.reset();
      
      showToast('Message sent successfully! I will get back to you soon.');
    }, 1500);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('toast--show');
  
  setTimeout(() => {
    toast.classList.remove('toast--show');
  }, 4000);
}
