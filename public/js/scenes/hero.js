/**
 * hero.js
 * HeroScene — Two-phase init to eliminate TBT/LCP blocking:
 *   Phase 1 (init): mount renderer, set up lights + camera — ~1ms, runs immediately
 *   Phase 2 (_initGeometry): create cube geometry + particles — deferred to
 *              requestIdleCallback (desktop) or window load event (mobile)
 */

import { FogExp2, PointLight, Vector2 } from 'three';
import { BaseScene, createNeonKeyLight, createAmbientLight, createFillLight } from '../utils/three-setup.js';
import { isMobile } from '../utils/device.js';
import { ParticleSystem } from '../utils/particle-system.js';
import { createCyberCube } from './constructs.js';

export class HeroScene extends BaseScene {
  constructor() { super('heroCanvas'); }

  init() {
    if (!this.canvas) return;

    /* ── Phase 1: Lights + Camera — synchronous, ~1ms ──────────────────
       Done immediately so the canvas background shows before geometry loads. */
    createAmbientLight(this.scene);
    this.keyLight  = createNeonKeyLight(this.scene);
    this.fillLight = createFillLight(this.scene);

    // Background fog
    this.scene.fog = new FogExp2(0x050406, 0.0008);

    // Camera
    this.camera.position.set(0, 0.5, 7);
    this.camera.lookAt(isMobile() ? 0 : 2, 0.2, 0);

    // Cursor tracking (desktop only — cheap event listener, no geometry)
    this._mouse = new Vector2(0, 0);
    if (!isMobile()) {
      this._onMouseMove = (e) => {
        this._mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
        this._mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', this._onMouseMove);
    }

    /* ── Phase 2: Geometry + Particles — deferred off main thread ───────
       On desktop: requestIdleCallback (after LCP is measured and painted).
       On mobile: window load event (after all resources have settled) to
       avoid competing with LCP rendering on slower CPUs. */
    this._geometryReady = false;
    const initGeometry = () => this._initGeometry();

    if (isMobile()) {
      if (document.readyState === 'complete') {
        // Page already loaded — defer by one idle frame
        const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
        idle(initGeometry);
      } else {
        window.addEventListener('load', initGeometry, { once: true });
      }
    } else {
      // Desktop: use idle callback, fallback to 0ms setTimeout
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
      idle(initGeometry);
    }
  }

  _initGeometry() {
    if (this._disposed) return; // Scene may have been disposed before idle fires

    /* ── Cyber Cube ────────────────────────────────────────────────────── */
    this.core = createCyberCube();
    this.core.position.set(isMobile() ? 0 : 2.8, 0, 0);
    this.scene.add(this.core);

    /* ── Core point light ──────────────────────────────────────────────── */
    this.coreLight = new PointLight(0xB76E79, 4, 4);
    this.coreLight.position.copy(this.core.position);
    this.scene.add(this.coreLight);

    /* ── Particle nebula ───────────────────────────────────────────────── */
    this.particles = new ParticleSystem(this.scene, {
      count:   isMobile() ? 50 : 200,
      spread:  6,
      size:    0.03,
      speed:   0.3,
      palette: ['#7A3D45', '#7A3D45', '#7A3D45', '#7A3D45', '#7A3D45',
                '#B76E79', '#B76E79', '#B76E79',
                '#DDB8BC', '#DDB8BC',
                '#EDD5C8'],
    });

    this._geometryReady = true;
  }

  update(dt, elapsed) {
    // Phase 1 runs immediately; Phase 2 geometry is optional until ready
    if (!this._geometryReady || !this.core) return;

    const ud = this.core.userData || {};

    // Core motion
    this.core.rotation.y = elapsed * 0.35;
    if (ud.torus) {
      ud.torus.rotation.y = elapsed * 0.75;
      ud.torus.rotation.z = Math.sin(elapsed * 0.45) * 0.12;
    }
    if (ud.orbitGroup) {
      ud.orbitGroup.rotation.z = elapsed * 0.55;
    }
    if (ud.rings && ud.rings.length) {
      const op = 0.12 + 0.12 * (0.5 + 0.5 * Math.sin(elapsed * 3));
      ud.rings.forEach(r => {
        if (r.material) r.material.opacity = op;
      });
    }

    // Shader core pulse (uTime + uIntensity)
    if (ud.coreSphere?.material?.uniforms?.uTime) {
      ud.coreSphere.material.uniforms.uTime.value = elapsed;
      if (!isMobile() && ud.coreSphere.material.uniforms.uIntensity) {
        const mouseEnergy = (Math.abs(this._mouse.x) + Math.abs(this._mouse.y)) * 0.5;
        ud.coreSphere.material.uniforms.uIntensity.value = 0.85 + mouseEnergy * 1.3;
      }
    }

    /* ── Floating Y bobbing ─────────────────────────────────────────── */
    this.core.position.y = Math.sin(elapsed * 1.5) * 0.18;

    /* ── Core tilt via cursor (desktop only) ────────────────────────── */
    if (!isMobile()) {
      const targetRX = -this._mouse.y * 0.55;
      const targetRZ = this._mouse.x * 0.35;
      // Keep Y driven by the animation; cursor only tilts X/Z for stability.
      this.core.rotation.x += (targetRX - this.core.rotation.x) * 0.05;
      this.core.rotation.z += (targetRZ - this.core.rotation.z) * 0.05;
    }

    /* ── Core glow pulse ─────────────────────────────────────────────── */
    this.coreLight.intensity = 3 + 1.5 * Math.sin(elapsed * 3);
    this.coreLight.position.copy(this.core.position);

    /* ── Key light subtle orbit ─────────────────────────────────────── */
    this.keyLight.position.x = 3 + Math.sin(elapsed * 0.5) * 1;
    this.keyLight.position.z = 3 + Math.cos(elapsed * 0.5) * 1;

    /* ── Particles ──────────────────────────────────────────────────── */
    if (this.particles) {
      this.particles.mesh.position.copy(this.core.position);
      this.particles.update(elapsed);
    }
  }

  dispose() {
    this._disposed = true;
    if (this._onMouseMove)
      window.removeEventListener('mousemove', this._onMouseMove);
    if (this.particles) this.particles.dispose();
    super.dispose();
  }
}
