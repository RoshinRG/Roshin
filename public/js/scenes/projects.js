/**
 * projects.js
 * ProjectsScene — Ambient particle field rendered to canvas overlay.
 * CSS handles repulsor blast on project card hover.
 */


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
      palette: ['#7A3D45', '#7A3D45', '#7A3D45', '#B76E79', '#B76E79', '#DDB8BC', '#EDD5C8'],
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

    if (!this._onCardHover) {
      this._onCardHover = (e) => {
        const card = e.target.closest('.project-card');
        if (!card) return;
        // Reset then fire animation via CSS class toggle
        const pulse = card.querySelector('.project-card__pulse');
        if (!pulse) return;
        pulse.style.animation = 'none';
        // Trigger reflow
        void pulse.offsetWidth;
        pulse.style.animation = '';
      };
    }
    grid.addEventListener('mouseenter', this._onCardHover, true);
  }

  update(dt, elapsed) {
    if (this.particles) this.particles.update(elapsed);
  }

  dispose() {
    const grid = document.getElementById('projectsGrid');
    if (grid && this._onCardHover) {
      grid.removeEventListener('mouseenter', this._onCardHover, true);
    }
    if (this.particles) this.particles.dispose();
    super.dispose();
  }
}
