/* ══════════════════════════════════════════════════════════════════
   script.js — RGR Nexus Root App
   Handles standard DOM behavior and lazy-loads WebGL.
   ══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initScrollSpy();
  setupLazyInit();
});

/* ── ScrollSpy & Section Events ── */
function initScrollSpy() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const navLinks = document.querySelectorAll('.nav__link');
  
  if (sections.length === 0) return;

  // Emit a custom event when a section becomes active
  const dispatchSectionChange = (index, id) => {
    window.dispatchEvent(new CustomEvent('sectionchange', {
      detail: { index, id }
    }));
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const index = sections.findIndex(s => s.id === id);
        
        // Update Nav UI
        navLinks.forEach(link => {
          if (link.getAttribute('data-section') === id) {
            link.classList.add('nav__link--active');
          } else {
            link.classList.remove('nav__link--active');
          }
        });

        // Notify Three.js modules
        dispatchSectionChange(index, id);
      }
    });
  }, {
    // Fire when section is 30% into the viewport
    threshold: 0.3
  });

  sections.forEach(sec => observer.observe(sec));
  
  // Initial dispatch for whatever is on screen on load
  setTimeout(() => {
    const activeLink = document.querySelector('.nav__link--active');
    if (activeLink) {
      const id = activeLink.getAttribute('data-section');
      const index = sections.findIndex(s => s.id === id);
      dispatchSectionChange(index, id);
    }
  }, 100);
}

/* ── Lazy Initialize Three.js ── */
function setupLazyInit() {
  let isInitTriggered = false;

  const triggerInit = () => {
    if (isInitTriggered) return;
    isInitTriggered = true;
    
    // Clean up scroll listener
    window.removeEventListener('scroll', scrollCheck);
    
    // Dynamically import the gatekeeper
    import('./js/three/loader.js').then(module => {
      module.initThreeJS();
    }).catch(err => {
      console.error("Failed to load loader.js", err);
    });
  };

  // Condition 1: User scrolls > 10vh
  const scrollCheck = () => {
    if (window.scrollY > window.innerHeight * 0.1) {
      triggerInit();
    }
  };
  window.addEventListener('scroll', scrollCheck, { passive: true });

  // Condition 2: requestIdleCallback
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => triggerInit());
  } else {
    // Fallback for Safari
    setTimeout(triggerInit, 2000);
  }
}
