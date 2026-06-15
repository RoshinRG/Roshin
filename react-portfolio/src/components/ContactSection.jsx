import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import useMousePosition from '../hooks/useMousePosition';
import useReveal from '../hooks/useReveal';

const GOLD = 0xd4af37;
const WHITE = 0xffffff;

const lerp = (a, b, t) => a + (b - a) * t;

function debounce(fn, ms) {
  let id;
  return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
}

const GOOGLE_SHEET_URL =
  'https://script.google.com/macros/s/AKfycbw97MFfNON_HAKfOryamFU21x33bhZzeWXBRjfnxUD51pxMpw2L_T5rwe56kka_iAI/exec';

/* SVG Icons */
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.17h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function ContactSection({ active, showToast }) {
  const sectionRef = useReveal();
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const mouse = useMousePosition();
  const [submitting, setSubmitting] = useState(false);

  /* Lazy-init contact grid scene */
  useEffect(() => {
    if (!active || sceneRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const w = parent.clientWidth || 600;
    const h = parent.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);

    const gridHelper = new THREE.GridHelper(14, 14, GOLD, 0x1a1a12);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.45;
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    scene.add(new THREE.AmbientLight(WHITE, 0.3));
    const spot = new THREE.PointLight(GOLD, 1.2, 20);
    spot.position.set(0, 4, 2);
    scene.add(spot);

    const onResize = debounce(() => {
      const nw = parent.clientWidth, nh = parent.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }, 150);
    window.addEventListener('resize', onResize);

    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      gridHelper.rotation.y += 0.003;
      const m = mouse.current;
      scene.rotation.y = lerp(scene.rotation.y, m.nx * 0.1, 0.04);
      renderer.render(scene, camera);
    }

    animate();
    sceneRef.current = true;

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [active, mouse]);

  /* Form submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      showToast('Please fill in all required fields.', true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', true);
      return;
    }

    setSubmitting(true);

    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      showToast("Message sent! I'll reply within 24 hours. ✓");
      form.reset();
    } catch {
      showToast('Network error. Please try again.', true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={`section${active ? ' section--active' : ''}`}
      id="sectionContact"
      aria-label="Contact"
      ref={sectionRef}
    >
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-header__index">// 04</span>
          <h2 className="section-header__title">Let's work together.</h2>
          <p className="section-header__subtitle">
            Got a project, opportunity, or just want to say hello?
          </p>
        </div>

        <div className="contact__grid">
          {/* Left — info */}
          <div className="contact__left">
            <div className="reveal">
              <h3 className="contact__info-title">
                Always open to interesting conversations.
              </h3>
              <p className="contact__info-desc">
                Whether it's a freelance project, internship opportunity, or a collaboration —
                drop me a message and I'll get back to you within 24 hours.
              </p>
            </div>

            <div className="contact__links reveal reveal--delay-1">
              <a
                href="mailto:roshin.rg.2024.aids@rajalakshmi.edu.in"
                className="contact__link-item"
                aria-label="Email Roshin"
              >
                <div className="contact__link-icon"><MailIcon /></div>
                <div>
                  <div className="contact__link-label">Email</div>
                  <div className="contact__link-value">roshin.rg.2024.aids@rajalakshmi.edu.in</div>
                </div>
              </a>

              <a
                href="https://github.com/roshinrg"
                target="_blank"
                rel="noopener"
                className="contact__link-item"
                aria-label="GitHub profile"
              >
                <div className="contact__link-icon"><GitHubIcon /></div>
                <div>
                  <div className="contact__link-label">GitHub</div>
                  <div className="contact__link-value">github.com/roshinrg</div>
                </div>
              </a>

              <a
                href="tel:+916369460964"
                className="contact__link-item"
                aria-label="Call Roshin"
              >
                <div className="contact__link-icon"><PhoneIcon /></div>
                <div>
                  <div className="contact__link-label">Phone</div>
                  <div className="contact__link-value">+91 6369 460 964</div>
                </div>
              </a>

              <div className="contact__link-item">
                <div className="contact__link-icon"><LocationIcon /></div>
                <div>
                  <div className="contact__link-label">Location</div>
                  <div className="contact__link-value">Chennai, Tamil Nadu, India</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="contact__form-wrap reveal reveal--delay-2">
            <canvas
              className="contact__form-canvas"
              id="contactCanvas"
              ref={canvasRef}
              aria-hidden="true"
            />
            <form
              className="contact__form"
              id="contactForm"
              noValidate
              aria-label="Contact form"
              onSubmit={handleSubmit}
            >
              <div className="form__row">
                <div className="form__group">
                  <label className="form__label" htmlFor="contactName">Name *</label>
                  <input
                    className="form__input"
                    type="text"
                    id="contactName"
                    name="name"
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="form__group">
                  <label className="form__label" htmlFor="contactEmail">Email *</label>
                  <input
                    className="form__input"
                    type="email"
                    id="contactEmail"
                    name="email"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="form__row">
                <div className="form__group">
                  <label className="form__label" htmlFor="contactPhone">Phone</label>
                  <input
                    className="form__input"
                    type="tel"
                    id="contactPhone"
                    name="phone"
                    placeholder="+91 XXXXX XXXXX"
                    autoComplete="tel"
                  />
                </div>
                <div className="form__group">
                  <label className="form__label" htmlFor="contactSubject">Subject</label>
                  <input
                    className="form__input"
                    type="text"
                    id="contactSubject"
                    name="subject"
                    placeholder="What's this about?"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="form__group">
                <label className="form__label" htmlFor="contactMessage">Message *</label>
                <textarea
                  className="form__textarea"
                  id="contactMessage"
                  name="message"
                  placeholder="Tell me about your project or say hello..."
                  required
                />
              </div>
              <button className="form__submit" type="submit" id="formSubmitBtn" disabled={submitting}>
                <span id="formSubmitText">
                  {submitting ? 'Sending…' : 'Send Message →'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
