/**
 * hero.js
 * HeroScene — Full Iron Man suit, floating animation, arc reactor glow,
 * particle trails, cursor look-at interaction.
 */

import * as THREE from 'three';
import { IronManScene, createGoldKeyLight, createAmbientLight, createFillLight, isMobile } from '../utils/three-setup.js';
import { ParticleSystem } from '../utils/particle-system.js';
import { buildIronManSuit } from './shared.js';

export class HeroScene extends IronManScene {
  constructor() { super('heroCanvas'); }

  init() {
    if (!this.canvas) return;

    /* ── Lights ─────────────────────────────────────────── */
    createAmbientLight(this.scene);
    this.keyLight  = createGoldKeyLight(this.scene);
    this.fillLight = createFillLight(this.scene);

    /* ── Background gradient fog ────────────────────────── */
    this.scene.fog = new THREE.FogExp2(0x050505, 0.08);

    /* ── Iron Man suit ──────────────────────────────────── */
    this.suit = buildIronManSuit();
    this.suit.position.set(isMobile() ? 0 : 2.8, 0, 0);
    this.scene.add(this.suit);

    /* ── Arc reactor point light (at chest) ─────────────── */
    this.arcLight = new THREE.PointLight(0xd4af37, 4, 3);
    this.arcLight.position.set(
      this.suit.position.x,
      this.suit.position.y + 0.35 * 0.7,
      0.5
    );
    this.scene.add(this.arcLight);

    /* ── Particle trail system ──────────────────────────── */
    this.particles = new ParticleSystem(this.scene, {
      count:   isMobile() ? 40 : 120,
      spread:  5,
      size:    0.03,
      speed:   0.4,
      palette: ['#d4af37', '#ffd700', '#00d9ff'],
    });

    /* ── Camera position ────────────────────────────────── */
    this.camera.position.set(0, 0.5, 7);
    this.camera.lookAt(isMobile() ? 0 : 2, 0.2, 0);

    /* ── Cursor tracking ────────────────────────────────── */
    this._mouse = new THREE.Vector2(0, 0);
    if (!isMobile()) {
      this._onMouseMove = (e) => {
        this._mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
        this._mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener('mousemove', this._onMouseMove);
    }
  }

  update(dt, elapsed) {
    if (!this.suit) return;

    /* ── Y-axis rotation ─────────────────────────────────── */
    this.suit.rotation.y = elapsed * (Math.PI * 2 / 8); // 360° / 8s

    /* ── Floating Y bobbing (0–20px range ~4s) ──────────── */
    const baseY = isMobile() ? 0 : 0;
    this.suit.position.y = baseY + Math.sin(elapsed * 1.5) * 0.18;

    /* ── Head cursor look-at (desktop only) ─────────────── */
    if (!isMobile() && this.suit.userData.head) {
      const head = this.suit.userData.head;
      const targetRX = -this._mouse.y * 0.3;
      const targetRY = this._mouse.x  * 0.4 + this.suit.rotation.y;
      head.rotation.x += (targetRX - head.rotation.x) * 0.06;
      head.rotation.y += (targetRY - head.rotation.y) * 0.06;
    }

    /* ── Arc reactor glow pulse ──────────────────────────── */
    if (this.suit.userData.arcMat) {
      this.suit.userData.arcMat.uniforms.uTime.value = elapsed;
      this.arcLight.intensity = 3 + 1.5 * Math.sin(elapsed * 3);
    }

    /* ── Key light subtle orbit ──────────────────────────── */
    this.keyLight.position.x = 3 + Math.sin(elapsed * 0.5) * 1;
    this.keyLight.position.z = 3 + Math.cos(elapsed * 0.5) * 1;

    /* ── Particles ───────────────────────────────────────── */
    if (this.particles) {
      this.particles.mesh.position.copy(this.suit.position);
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
