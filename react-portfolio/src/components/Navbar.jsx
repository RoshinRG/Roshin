import { useState, useEffect, useCallback } from 'react';

export default function Navbar({ currentSection, onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Sticky nav on scroll */
  useEffect(() => {
    let timeout;
    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setScrolled(window.scrollY > 10), 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile nav on ESC */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const navClick = useCallback(
    (e, section) => {
      e.preventDefault();
      onNavigate(section);
      setMobileOpen(false);
    },
    [onNavigate]
  );

  const navLinks = [
    { section: 'hero', label: 'Home' },
    { section: 'about', label: '// 01 About' },
    { section: 'projects', label: '// 02 Projects' },
    { section: 'skills', label: '// 03 Skills' },
    { section: 'contact', label: '// 04 Contact' },
  ];

  return (
    <>
      {/* Mobile Nav Overlay */}
      <nav
        className={`mobile-nav${mobileOpen ? ' mobile-nav--open' : ''}`}
        id="mobileNav"
        aria-label="Mobile navigation"
      >
        <button
          className="mobile-nav__close"
          id="mobileNavClose"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        >
          ✕
        </button>
        {navLinks.map((link) => (
          <a
            key={link.section}
            href="#"
            className="mobile-nav__link"
            data-section={link.section}
            id={`mobileNav${link.section.charAt(0).toUpperCase() + link.section.slice(1)}`}
            onClick={(e) => navClick(e, link.section)}
          >
            {link.section === 'hero' ? 'Home' : link.label.replace('// 0', '').replace(' ', '')}
          </a>
        ))}
      </nav>

      {/* Desktop Navigation */}
      <header className={`nav${scrolled ? ' nav--scrolled' : ''}`} id="mainNav">
        <a
          href="#"
          className="nav__logo"
          id="navLogo"
          aria-label="Roshin R G — Home"
          onClick={(e) => navClick(e, 'hero')}
        >
          <span className="nav__logo-rr">RR</span>
          <span className="nav__logo-g">G</span>
          <span className="nav__logo-dot">.</span>
        </a>

        <nav className="nav__links" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a
              key={link.section}
              href="#"
              className={`nav__link${currentSection === link.section ? ' nav__link--active' : ''}`}
              data-section={link.section}
              id={`nav${link.section.charAt(0).toUpperCase() + link.section.slice(1)}`}
              onClick={(e) => navClick(e, link.section)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="/Roshin_RG_CV.docx"
          className="nav__resume"
          id="navResume"
          download="Roshin_RG_CV.docx"
        >
          Resume ↓
        </a>

        <button
          className="nav__hamburger"
          id="navHamburger"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </header>
    </>
  );
}
