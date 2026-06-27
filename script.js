/**
 * script.js — Roshin RG Portfolio
 * Lightweight SPA Router & UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM Elements ──
  const navLinks = document.querySelectorAll('.nav__link');
  const sections = document.querySelectorAll('.section');
  const ctaButtons = document.querySelectorAll('[data-section]');
  const hamburger = document.querySelector('.nav__hamburger');
  const navLinksContainer = document.querySelector('.nav__links');

  // ── Navigation Router ──
  function navigateTo(sectionId) {
    // Hide all sections
    sections.forEach(sec => {
      sec.classList.remove('section--active');
    });

    // Remove active class from all nav links
    navLinks.forEach(link => {
      link.classList.remove('nav__link--active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('section--active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Highlight active nav link
    const activeLink = document.querySelector(`.nav__link[data-section="${sectionId}"]`);
    if (activeLink) {
      activeLink.classList.add('nav__link--active');
    }

    // Update URL hash
    history.pushState(null, null, `#${sectionId}`);
    
    // Close mobile nav if open
    if (window.innerWidth <= 1024) {
      navLinksContainer.style.display = 'none';
    }
  }

  // ── Event Listeners ──
  
  // Nav Links click
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-section');
      navigateTo(targetId);
    });
  });

  // CTA buttons click (e.g. Hire Me)
  ctaButtons.forEach(btn => {
    if (!btn.classList.contains('nav__link')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-section');
        navigateTo(targetId);
      });
    }
  });

  // Mobile Hamburger Toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      if (navLinksContainer.style.display === 'flex') {
        navLinksContainer.style.display = 'none';
      } else {
        navLinksContainer.style.display = 'flex';
        navLinksContainer.style.flexDirection = 'column';
        navLinksContainer.style.position = 'absolute';
        navLinksContainer.style.top = '80px';
        navLinksContainer.style.left = '0';
        navLinksContainer.style.right = '0';
        navLinksContainer.style.background = 'rgba(37, 37, 37, 0.95)';
        navLinksContainer.style.padding = '2rem';
      }
    });
  }

  // Handle Initial Load (Check URL hash)
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    navigateTo(hash);
  } else {
    navigateTo('hero');
  }
});
