/**
 * projects.js
 * ProjectsScene — Ambient particle field rendered to canvas overlay.
 * CSS handles repulsor blast on project card hover.
 */

import * as THREE from 'three';
import { BaseScene, createAmbientLight, isMobile } from '../utils/three-setup.js';
import { ParticleSystem } from '../utils/particle-system.js';

export class ProjectsScene extends BaseScene {
  constructor() { super('projectsCanvas'); }

  init() {
    if (!this.canvas) return;

    createAmbientLight(this.scene);

    /* ── Slow-moving ambient particle field ─────────────── */
    this.particles = new ParticleSystem(this.scene, {
      count:   isMobile() ? 50 : 180,
      spread:  12,
      size:    0.025,
      speed:   0.15,
      palette: ['#00ff41', '#008f11', '#003b00', '#ffffff'],
    });

    /* ── Camera — flat orthographic-ish perspective ──────── */
    this.camera.fov = 75;
    this.camera.position.set(0, 0, 6);
    this.camera.updateProjectionMatrix();

    /* ── Scan Pulse (CSS2D alternative: we fire CSS) ─────── */
    this._setupCardHover();
  }

  _setupCardHover() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    grid.addEventListener('mouseenter', (e) => {
      const card = e.target.closest('.project-card');
      if (!card) return;
      // Reset then fire animation via CSS class toggle
      const pulse = card.querySelector('.project-card__pulse');
      if (!pulse) return;
      pulse.style.animation = 'none';
      // Trigger reflow
      void pulse.offsetWidth;
      pulse.style.animation = '';
    }, true);
  }

  update(dt, elapsed) {
    if (this.particles) this.particles.update(elapsed);
  }

  dispose() {
    if (this._setupCardHover) {
       // Just clean up particles, delegated listener lives on DOM but safe to leave since singleton
    }
    if (this.particles) this.particles.dispose();
    super.dispose();
  }
}
