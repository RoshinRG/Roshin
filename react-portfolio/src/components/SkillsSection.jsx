import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import useMousePosition from '../hooks/useMousePosition';
import useReveal from '../hooks/useReveal';
import { skillGroups, skillSprites } from '../data/skills';

const GOLD = 0xd4af37;
const WHITE = 0xffffff;

const lerp = (a, b, t) => a + (b - a) * t;

function debounce(fn, ms) {
  let id;
  return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
}

export default function SkillsSection({ active }) {
  const sectionRef = useReveal();
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const mouse = useMousePosition();

  /* Lazy-init the 3D skills scene when section becomes active */
  useEffect(() => {
    if (!active || sceneRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.clientWidth || 1000;
    const h = canvas.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
    camera.position.z = 5;

    scene.add(new THREE.AmbientLight(WHITE, 0.5));
    const light = new THREE.PointLight(GOLD, 1.5, 20);
    light.position.set(0, 3, 5);
    scene.add(light);

    /* Build sprite labels from canvas textures */
    function makeSprite(text, isStar) {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 64;
      const ctx = c.getContext('2d');

      // Background pill
      ctx.fillStyle = isStar ? 'rgba(212,175,55,0.18)' : 'rgba(20,20,20,0.85)';
      const r = 12;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(c.width - r, 0);
      ctx.quadraticCurveTo(c.width, 0, c.width, r);
      ctx.lineTo(c.width, c.height - r);
      ctx.quadraticCurveTo(c.width, c.height, c.width - r, c.height);
      ctx.lineTo(r, c.height);
      ctx.quadraticCurveTo(0, c.height, 0, c.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isStar ? 'rgba(212,175,55,0.8)' : 'rgba(212,175,55,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isStar ? '#d4af37' : '#c0c0b8';
      ctx.font = `${isStar ? '600' : '400'} 22px "Space Grotesk", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.length > 18 ? text.slice(0, 16) + '…' : text, c.width / 2, c.height / 2);

      const tex = new THREE.CanvasTexture(c);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const spr = new THREE.Sprite(mat);
      spr.scale.set(2.2, 0.55, 1);
      return spr;
    }

    const sprites = [];
    skillSprites.forEach((s) => {
      const spr = makeSprite(s.label, s.star);
      spr.position.set(s.x, s.y, s.z);
      spr.userData.baseY = s.y;
      spr.userData.phase = Math.random() * Math.PI * 2;
      spr.userData.speed = 0.4 + Math.random() * 0.4;
      scene.add(spr);
      sprites.push(spr);
    });

    const onResize = debounce(() => {
      const nw = canvas.clientWidth, nh = canvas.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }, 150);
    window.addEventListener('resize', onResize);

    let t = 0;
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      t += 0.012;

      sprites.forEach((spr) => {
        spr.position.y = spr.userData.baseY + Math.sin(t * spr.userData.speed + spr.userData.phase) * 0.12;
      });

      const m = mouse.current;
      scene.rotation.y = lerp(scene.rotation.y, m.nx * 0.15, 0.04);
      scene.rotation.x = lerp(scene.rotation.x, m.ny * 0.08, 0.04);

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

  return (
    <section
      className={`section${active ? ' section--active' : ''}`}
      id="sectionSkills"
      aria-label="Skills"
      ref={sectionRef}
    >
      <div className="section-inner">
        <div className="section-header reveal">
          <span className="section-header__index">// 03</span>
          <h2 className="section-header__title">What I work with.</h2>
          <p className="section-header__subtitle">
            Tools and technologies I reach for without thinking twice.
          </p>
        </div>

        {/* Floating 3D skills canvas */}
        <div className="skills__canvas-wrap reveal">
          <canvas
            className="skills__canvas"
            id="skillsCanvas"
            ref={canvasRef}
            aria-label="3D floating skill labels"
            aria-hidden="false"
          />
        </div>

        {/* Skills grid */}
        <div className="skills__grid">
          {skillGroups.map((group) => (
            <div
              key={group.name}
              className={`skills__group reveal${group.delay ? ` reveal--delay-${group.delay}` : ''}`}
            >
              <div className="skills__group-name">{group.name}</div>
              <ul className="skills__items" aria-label={group.ariaLabel}>
                {group.items.map((item) => (
                  <li key={item.label} className="skills__item">
                    {item.label}
                    {item.star && <span className="skills__item-star">★ expert</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
