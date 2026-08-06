/**
 * nexus-sphere.js
 * Shared glowing cyan wireframe geodesic sphere — background for every route.
 */

import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Vector2,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';

const CYAN = 0x4fd2ff;
const CYAN_SOFT = 0x1a6f9a;

function createGlowSprite(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(180,240,255,0.95)');
  g.addColorStop(0.42, 'rgba(79,210,255,0.45)');
  g.addColorStop(1, 'rgba(79,210,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function densifyVertices(geometry, copies = 1) {
  // Duplicate positions with tiny jitter so points feel denser / glowier
  const pos = geometry.getAttribute('position');
  const out = [];
  for (let c = 0; c < copies; c++) {
    for (let i = 0; i < pos.count; i++) {
      const j = c === 0 ? 0 : (Math.random() - 0.5) * 0.012;
      out.push(pos.getX(i) + j, pos.getY(i) + j, pos.getZ(i) + j);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(out, 3));
  return geo;
}

export function createNexusSphere(canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 768px)').matches;

  const scene = new Scene();
  scene.background = new Color(0x000000);

  const camera = new PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, mobile ? 7.2 : 6.4);

  const renderer = new WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 1);

  // Ensure the drawing buffer matches CSS box (avoids 0×0 / stale sizes)
  const syncSize = () => {
    const w = Math.max(1, canvas.clientWidth || window.innerWidth);
    const h = Math.max(1, canvas.clientHeight || window.innerHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  const root = new Group();
  // Sit in the right half so the hero card on the left doesn't cover it
  root.position.set(mobile ? 0.15 : 1.55, 0.05, 0);
  scene.add(root);

  const detail = mobile ? 2 : 3;
  const radius = 2.15;
  const baseGeo = new IcosahedronGeometry(radius, detail);
  const wireGeo = new WireframeGeometry(baseGeo);

  const lines = new LineSegments(
    wireGeo,
    new LineBasicMaterial({
      color: CYAN_SOFT,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );
  root.add(lines);

  // Inner faint shell for depth
  const innerGeo = new IcosahedronGeometry(radius * 0.72, Math.max(1, detail - 1));
  const innerLines = new LineSegments(
    new WireframeGeometry(innerGeo),
    new LineBasicMaterial({
      color: CYAN_SOFT,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    }),
  );
  root.add(innerLines);

  const glowMap = createGlowSprite(64);
  const pointSize = mobile ? 0.12 : 0.095;

  const points = new Points(
    densifyVertices(baseGeo, 1),
    new PointsMaterial({
      size: pointSize,
      map: glowMap,
      color: CYAN,
      transparent: true,
      opacity: 0.95,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  root.add(points);

  // Softer bloom layer (larger, dimmer points)
  const bloom = new Points(
    densifyVertices(baseGeo, 1),
    new PointsMaterial({
      size: pointSize * 2.6,
      map: glowMap,
      color: CYAN,
      transparent: true,
      opacity: 0.28,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  root.add(bloom);

  const mouse = new Vector2(0, 0);
  const target = new Vector2(0, 0);

  const onPointer = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    target.set(x * 0.35, y * 0.22);
  };

  if (!reduced && !mobile) {
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

  let raf = 0;
  let running = true;
  const clockStart = performance.now();

  function resize() {
    syncSize();
  }

  syncSize();
  window.addEventListener('resize', resize, { passive: true });

  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);

    const t = (performance.now() - clockStart) / 1000;

    if (!reduced) {
      mouse.x += (target.x - mouse.x) * 0.04;
      mouse.y += (target.y - mouse.y) * 0.04;

      root.rotation.y = t * 0.18 + mouse.x * 0.4;
      root.rotation.x = Math.sin(t * 0.22) * 0.12 + mouse.y * 0.35;
      root.rotation.z = Math.sin(t * 0.15) * 0.05;

      const pulse = 1 + Math.sin(t * 1.4) * 0.03;
      points.material.size = pointSize * pulse;
      bloom.material.size = pointSize * 2.6 * pulse;
      lines.material.opacity = 0.32 + Math.sin(t * 1.1) * 0.06;
    }

    renderer.render(scene, camera);
  }

  tick();

  const onVisibility = () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      tick();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      [baseGeo, wireGeo, innerGeo, points.geometry, bloom.geometry].forEach((g) => g?.dispose?.());
      [lines.material, innerLines.material, points.material, bloom.material].forEach((m) => m?.dispose?.());
      glowMap.dispose();
      renderer.dispose();
    },
  };
}
