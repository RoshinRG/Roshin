import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import useReveal from '../hooks/useReveal';

const GOLD = 0xd4af37;
const BLACK = 0x000000;
const WHITE = 0xffffff;

export default function AboutSection({ active }) {
  const sectionRef = useReveal();
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);

  /* Avatar Torus Knot scene */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sceneRef.current) return;

    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 300;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 3.5;

    scene.add(new THREE.AmbientLight(WHITE, 0.4));
    const light1 = new THREE.PointLight(GOLD, 2, 15);
    light1.position.set(3, 3, 3);
    scene.add(light1);
    const light2 = new THREE.PointLight(0x4488ff, 1, 15);
    light2.position.set(-3, -3, -3);
    scene.add(light2);

    const geo = new THREE.TorusKnotGeometry(0.9, 0.28, 128, 16, 2, 3);
    const mat = new THREE.MeshStandardMaterial({
      color: BLACK, metalness: 0.9, roughness: 0.15,
      emissive: GOLD, emissiveIntensity: 0.12,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const wireMesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.18 })
    );
    scene.add(wireMesh);

    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      mesh.rotation.x += 0.006;
      mesh.rotation.y += 0.009;
      wireMesh.rotation.x = mesh.rotation.x;
      wireMesh.rotation.y = mesh.rotation.y;
      renderer.render(scene, camera);
    }

    animate();
    sceneRef.current = true;

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
    };
  }, []);

  return (
    <section
      className={`section${active ? ' section--active' : ''}`}
      id="sectionAbout"
      aria-label="About Roshin"
      ref={sectionRef}
    >
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-header__index">// 01</span>
          <h2 className="section-header__title">The person behind the pixels.</h2>
        </div>

        <div className="about__grid">
          {/* Left column */}
          <aside className="about__left">
            <div className="about__avatar-wrap reveal">
              <canvas
                className="about__avatar-canvas"
                id="avatarCanvas"
                ref={canvasRef}
                width="300"
                height="300"
                aria-hidden="true"
              />
              <div className="about__badge">Open to opportunities</div>
            </div>
            <div className="about__quick-stats reveal reveal--delay-1">
              <div className="about__stat">
                <div className="about__stat-value">4+</div>
                <div className="about__stat-label">Projects</div>
              </div>
              <div className="about__stat">
                <div className="about__stat-value">15+</div>
                <div className="about__stat-label">Skills</div>
              </div>
              <div className="about__stat">
                <div className="about__stat-value">SPA</div>
                <div className="about__stat-label">Expert</div>
              </div>
              <div className="about__stat">
                <div className="about__stat-value">∞</div>
                <div className="about__stat-label">CSS</div>
              </div>
            </div>
          </aside>

          {/* Right column */}
          <div className="about__right">
            <div className="about__philosophy reveal">
              <p>
                I craft <strong>fast, focused interfaces</strong> that live and breathe in the
                browser — no build tools required, no framework overhead, just deliberate
                JavaScript, semantic HTML, and CSS that scales.
              </p>
              <p>
                My philosophy is simple:{' '}
                <strong>the best abstraction is the one you understand completely.</strong>{' '}
                Working with vanilla JS forces clarity — every event listener, every DOM query,
                every animation frame is intentional.
              </p>
              <p>
                Currently in my second year of{' '}
                <strong>B.Tech AI &amp; Data Science</strong> at Rajalakshmi Engineering
                College, I bridge the gap between data literacy and front-end precision. I
                understand how models think, so I can build interfaces that let humans talk to
                them elegantly.
              </p>
              <p>
                When I'm not pushing pixels, I'm probably{' '}
                <strong>studying algorithmic thinking</strong>, obsessing over typography, or
                reading about the intersection of spatial computing and the open web.
              </p>
            </div>

            {/* Internship Card */}
            <div className="about__internship reveal reveal--delay-1">
              <div className="about__internship-badge">Internship Experience</div>
              <div className="about__internship-title">AI / ML Intern</div>
              <div className="about__internship-company">
                AK InfoPark Pvt Ltd &nbsp;·&nbsp; 15 Days &nbsp;·&nbsp; 2024
              </div>
              <p className="about__internship-desc">
                Developed a <strong>House Buyer Prediction</strong> system using classical ML
                techniques. Performed Exploratory Data Analysis (EDA) and Feature Engineering
                on real estate data, built a Linear Regression model with Pearson Correlation
                for feature selection, and evaluated accuracy with RMSE metrics.
              </p>
              <div className="about__tags">
                {['Python', 'Linear Regression', 'EDA', 'Feature Engineering', 'Pearson Correlation', 'RMSE'].map(
                  (tag) => (
                    <span key={tag} className="about__tag">{tag}</span>
                  )
                )}
              </div>
            </div>

            {/* Education Timeline */}
            <div className="about__education reveal reveal--delay-2">
              <div className="about__edu-item">
                <div className="about__edu-dot about__edu-dot--current" />
                <div>
                  <div className="about__edu-year">2024 — 2028</div>
                  <div className="about__edu-name">B.Tech — AI &amp; Data Science</div>
                  <div className="about__edu-desc">Rajalakshmi Engineering College, Chennai</div>
                </div>
              </div>
              <div className="about__edu-item">
                <div className="about__edu-dot" />
                <div>
                  <div className="about__edu-year">2024</div>
                  <div className="about__edu-name">Higher Secondary — 12th</div>
                  <div className="about__edu-desc">Completed with distinction, Tamil Nadu State Board</div>
                </div>
              </div>
              <div className="about__edu-item">
                <div className="about__edu-dot" />
                <div>
                  <div className="about__edu-year">2022</div>
                  <div className="about__edu-name">Secondary — 10th</div>
                  <div className="about__edu-desc">Completed with distinction, Tamil Nadu State Board</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
