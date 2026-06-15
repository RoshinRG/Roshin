import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import useTypewriter from '../hooks/useTypewriter';
import useMousePosition from '../hooks/useMousePosition';

const GOLD = 0xd4af37;
const BLACK = 0x000000;
const WHITE = 0xffffff;

const PHRASES = [
  'Front-End Developer',
  'SPA Architect',
  'AI & Data Science Student',
  'Vanilla JS Specialist',
];

const lerp = (a, b, t) => a + (b - a) * t;

function debounce(fn, ms) {
  let id;
  return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
}

export default function HeroSection({ active, onNavigate }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const mouse = useMousePosition();
  const typewriterText = useTypewriter(PHRASES);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sceneRef.current) return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.setClearColor(0x000000, 0);

    /* Scene + Camera */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, W() / H(), 0.1, 100);
    camera.position.z = 5;

    /* Lights */
    scene.add(new THREE.AmbientLight(WHITE, 0.3));
    const pointLight = new THREE.PointLight(GOLD, 2.5, 20);
    pointLight.position.set(4, 0, 0);
    scene.add(pointLight);

    /* Central Icosahedron */
    const icoGeo = new THREE.IcosahedronGeometry(1.4, 1);
    const icoFill = new THREE.Mesh(
      icoGeo,
      new THREE.MeshStandardMaterial({ color: BLACK, metalness: 0.2, roughness: 0.8 })
    );
    scene.add(icoFill);

    const icoWire = new THREE.Mesh(
      icoGeo,
      new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.7 })
    );
    scene.add(icoWire);

    /* Particle Field */
    const PARTICLE_COUNT = 2000;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePos = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 3 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      basePos[i * 3] = x;
      basePos[i * 3 + 1] = y;
      basePos[i * 3 + 2] = z;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: GOLD, size: 0.018, transparent: true, opacity: 0.55, sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let targetRotX = 0, targetRotY = 0, orbitAngle = 0;
    const _pv = new THREE.Vector3();
    const REPULSE_R = 1.2;
    const REPULSE_STRENGTH = 0.6;

    /* Resize */
    const onResize = debounce(() => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    }, 150);
    window.addEventListener('resize', onResize);

    /* Animate */
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);

      orbitAngle += 0.008;
      pointLight.position.x = Math.cos(orbitAngle) * 4;
      pointLight.position.z = Math.sin(orbitAngle) * 4;
      pointLight.position.y = Math.sin(orbitAngle * 0.5) * 2;

      const m = mouse.current;
      targetRotY = m.nx * 0.35;
      targetRotX = m.ny * -0.25;

      icoFill.rotation.y += 0.003;
      icoWire.rotation.y = icoFill.rotation.y;
      icoFill.rotation.x = lerp(icoFill.rotation.x, targetRotX, 0.05);
      icoWire.rotation.x = icoFill.rotation.x;

      /* Particle mouse repulsion */
      const posArr = particleGeo.attributes.position.array;
      const mnx = m.nx, mny = m.ny;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        _pv.set(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
        _pv.project(camera);
        const dx = _pv.x - mnx;
        const dy = _pv.y - mny;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPULSE_R && dist > 0.0001) {
          const force = (REPULSE_R - dist) / REPULSE_R;
          const bx = basePos[idx], by = basePos[idx + 1];
          posArr[idx] = lerp(posArr[idx], bx + (dx / dist) * force * REPULSE_STRENGTH, 0.05);
          posArr[idx + 1] = lerp(posArr[idx + 1], by + (dy / dist) * force * REPULSE_STRENGTH, 0.05);
        } else {
          posArr[idx] = lerp(posArr[idx], basePos[idx], 0.02);
          posArr[idx + 1] = lerp(posArr[idx + 1], basePos[idx + 1], 0.02);
          posArr[idx + 2] = lerp(posArr[idx + 2], basePos[idx + 2], 0.02);
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;

      renderer.render(scene, camera);
    }

    animate();
    sceneRef.current = { renderer, scene, camera };

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [mouse]);

  return (
    <section
      className={`section${active ? ' section--active' : ''}`}
      id="sectionHero"
      aria-label="Hero"
    >
      <div className="hero">
        <canvas className="hero__canvas" id="heroCanvas" ref={canvasRef} aria-hidden="true" />
        <div className="hero__overlay">
          <p className="hero__label" aria-hidden="true">// Hello —</p>
          <h1 className="hero__heading">
            <span className="hero__heading-name">Roshin </span>
            <span className="hero__heading-accent">R G</span>
          </h1>
          <div className="hero__typewriter-wrap" aria-live="polite">
            <span className="hero__typewriter-prefix">I am a</span>
            <span className="hero__typewriter" id="typewriter">{typewriterText}</span>
            <span className="hero__typewriter-cursor" aria-hidden="true" />
          </div>
          <div className="hero__ctas">
            <a
              href="#"
              className="hero__cta hero__cta--primary"
              id="ctaProjects"
              onClick={(e) => { e.preventDefault(); onNavigate('projects'); }}
            >
              View Projects →
            </a>
            <a
              href="#"
              className="hero__cta hero__cta--secondary"
              id="ctaContact"
              onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
            >
              Get in Touch
            </a>
            <a
              href="/Roshin_RG_CV.docx"
              className="hero__cta hero__cta--ghost"
              id="ctaResume"
              download="Roshin_RG_CV.docx"
            >
              Resume ↓
            </a>
          </div>
        </div>
        <div className="hero__scroll-hint" aria-hidden="true">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </div>
    </section>
  );
}
