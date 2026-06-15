export default function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <p className="footer__copy">
        © 2024 <span>Roshin R G</span> — Crafted with precision &amp; vanilla JS.
      </p>
      <nav className="footer__links" aria-label="Footer navigation">
        <a
          href="#"
          className="footer__link"
          onClick={(e) => { e.preventDefault(); onNavigate('hero'); }}
        >
          Top
        </a>
        <a href="mailto:roshin.rg.2024.aids@rajalakshmi.edu.in" className="footer__link">
          Email
        </a>
        <a
          href="https://github.com/roshinrg"
          target="_blank"
          rel="noopener"
          className="footer__link"
        >
          GitHub
        </a>
      </nav>
    </footer>
  );
}
