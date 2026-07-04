/**
 * hero.js
 * HeroScene — Geodesic core centerpiece, floating animation, core glow,
 * particle trails, cursor look-at interaction.
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

    /* ── Lights ─────────────────────────────────────────── */
    createAmbientLight(this.scene);
    this.keyLight  = createNeonKeyLight(this.scene);
    this.fillLight = createFillLight(this.scene);

    /* ── Background gradient fog ────────────────────────── */
    this.scene.fog = new FogExp2(0x050406, 0.0008); // --bg-void

    /* ── Cyber Cube ─────────────────────────────────────── */
    this.core = createCyberCube();
    this.core.position.set(isMobile() ? 0 : 2.8, 0, 0);
    this.scene.add(this.core);

    /* ── Core point light ───────────────────────────────── */
    this.coreLight = new PointLight(0xB76E79, 4, 4); // --rg-core
    this.coreLight.position.copy(this.core.position);
    this.scene.add(this.coreLight);

    /* ── Particle nebula system ─────────────────────────── */
    this.particles = new ParticleSystem(this.scene, {
      count:   isMobile() ? 60 : 200,
      spread:  6,
      size:    0.03,
      speed:   0.3,
      // Rose Gold constellation — weighted: 50% dim, 30% core, 15% light, 5% shimmer
      palette: ['#7A3D45', '#7A3D45', '#7A3D45', '#7A3D45', '#7A3D45',
                '#B76E79', '#B76E79', '#B76E79',
                '#DDB8BC', '#DDB8BC',
                '#EDD5C8'],
    });

    /* ── Camera position ────────────────────────────────── */
    this.camera.position.set(0, 0.5, 7);
    this.camera.lookAt(isMobile() ? 0 : 2, 0.2, 0);

    /* ── Cursor tracking ────────────────────────────────── */
    this._mouse = new Vector2(0, 0);
    if (!isMobile()) {
      this._onMouseMove = (e) => {
        this._mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
        this._mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', this._onMouseMove);
    }
  }

  update(dt, elapsed) {
    if (!this.core) return;

    /* ── Y-axis rotation ─────────────────────────────────── */
    this.core.rotation.y = elapsed * 0.5;
    
    if (this.core.userData.outer) {
      this.core.userData.outer.rotation.x = elapsed * 0.2;
      this.core.userData.outer.rotation.y = -elapsed * 0.1;
    }
    
    if (this.core.userData.inner) {
      this.core.userData.inner.scale.setScalar(1 + 0.05 * Math.sin(elapsed * 4));
    }
    
    if (this.core.userData.orbits) {
      this.core.userData.orbits.rotation.z = elapsed;
    }

    /* ── Floating Y bobbing (0–20px range ~4s) ──────────── */
    const baseY = isMobile() ? 0 : 0;
    this.core.position.y = baseY + Math.sin(elapsed * 1.5) * 0.18;

    /* ── Core tilt via cursor (desktop only) ────────────── */
    if (!isMobile()) {
      const targetRX = -this._mouse.y * 0.5;
      const targetRY = this._mouse.x  * 0.5;
      this.core.rotation.x += (targetRX - this.core.rotation.x) * 0.05;
      // We don't overwrite rotation.y because it's spinning continuously, 
      // but we can tilt the Z axis instead
      this.core.rotation.z += (targetRY - this.core.rotation.z) * 0.05;
    }

    /* ── Core glow pulse ────────────────────────────────── */
    this.coreLight.intensity = 3 + 1.5 * Math.sin(elapsed * 3);
    this.coreLight.position.copy(this.core.position);

    /* ── Key light subtle orbit ──────────────────────────── */
    this.keyLight.position.x = 3 + Math.sin(elapsed * 0.5) * 1;
    this.keyLight.position.z = 3 + Math.cos(elapsed * 0.5) * 1;

    /* ── Particles ───────────────────────────────────────── */
    if (this.particles) {
      this.particles.mesh.position.copy(this.core.position);
      this.particles.update(elapsed);
    }
  }

  dispose() {
    if (this._onMouseMove)
      window.removeEventListener('mousemove', this._onMouseMove);
    if (this.particles) this.particles.dispose();
    super.dispose();
  }
}
