/**
 * projects.js
 * ProjectsScene — Ripple-driven instanced "data field".
 * The 3D feel now matches the redesigned layout: a lateral holographic
 * background with mouse/cursor-driven energy waves.
 */

import {
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  Vector2,
} from 'three';
import { BaseScene, createAmbientLight } from '../utils/three-setup.js';
import { isMobile } from '../utils/device.js';

export class ProjectsScene extends BaseScene {
  constructor() { super('projectsCanvas'); }

  init() {
    if (!this.canvas) return;

    this._mouse = new Vector2(0, 0); // normalized [-1..1] within projects canvas area
    this._pulse = 0; // injected energy on hover
    this._dummy = new Object3D();

    createAmbientLight(this.scene);

    /* ── Instanced data field (ripple) ───────────────────── */
    const desktop = !isMobile();
    const gridW = desktop ? 52 : 30;
    const gridH = desktop ? 32 : 18;
    const count = gridW * gridH;

    this._baseX = new Float32Array(count);
    this._baseY = new Float32Array(count);
    this._nx = new Float32Array(count);
    this._ny = new Float32Array(count);
    this._phases = new Float32Array(count);
    this._baseScale = new Float32Array(count);

    const geo = new SphereGeometry(desktop ? 0.018 : 0.020, 4, 4);
    const mat = new MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    this.field = new InstancedMesh(geo, mat, count);
    this.field.instanceMatrix.setUsage(DynamicDrawUsage);

    this.field.instanceColor = new InstancedBufferAttribute(
      new Float32Array(count * 3),
      3
    );

    const palette = desktop
      ? [0xB76E79, 0xC9878F, 0xDDB8BC, 0xEDD5C8]
      : [0xB76E79, 0xC9878F, 0xEDD5C8];

    const spacingX = desktop ? 0.24 : 0.22;
    const spacingY = desktop ? 0.22 : 0.20;
    const halfW = ((gridW - 1) * spacingX) / 2;
    const halfH = ((gridH - 1) * spacingY) / 2;

    const _color = new Color();

    for (let iy = 0; iy < gridH; iy++) {
      for (let ix = 0; ix < gridW; ix++) {
        const i = iy * gridW + ix;

        const x = ix * spacingX - halfW;
        const y = iy * spacingY - halfH;

        this._baseX[i] = x;
        this._baseY[i] = y;

        // normalized coords for ripple influence
        this._nx[i] = (ix / (gridW - 1)) * 2 - 1;
        this._ny[i] = (iy / (gridH - 1)) * 2 - 1;

        this._phases[i] = Math.random() * Math.PI * 2;
        this._baseScale[i] = 0.65 + Math.random() * 0.75;

        // Color
        const hex = palette[Math.floor(Math.random() * palette.length)];
        const r = ((hex >> 16) & 255) / 255;
        const g = ((hex >> 8) & 255) / 255;
        const b = (hex & 255) / 255;
        _color.setRGB(r, g, b);
        this.field.setColorAt(i, _color);

        this._dummy.position.set(x, y, 0);
        this._dummy.scale.setScalar(this._baseScale[i] * 0.85);
        this._dummy.updateMatrix();
        this.field.setMatrixAt(i, this._dummy.matrix);
      }
    }

    this.field.instanceColor.needsUpdate = true;
    this.scene.add(this.field);

    /* ── Camera — slight perspective ──────────────────────── */
    this.camera.fov = desktop ? 70 : 75;
    this.camera.position.set(0, 0, 6);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    /* ── Scan Pulse (CSS2D alternative: we fire CSS) ─────── */
    this._setupCardHover();

    // Desktop: pointer energy injection based on cursor position.
    if (desktop) this._setupPointerEnergy();
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

        // Inject energy into the 3D field
        this._pulse = 1;
      };
    }
    grid.addEventListener('mouseenter', this._onCardHover, true);
  }

  _setupPointerEnergy() {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    let rafId = 0;
    let pending = null;

    const update = () => {
      rafId = 0;
      if (!pending) return;
      const { x, y } = pending;
      pending = null;
      this._mouse.set(x, y);
    };

    this._onPointerMove = (e) => {
      const rect = grid.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pending = { x: nx, y: ny };
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    this._onPointerLeave = () => {
      this._mouse.set(0, 0);
    };

    grid.addEventListener('pointermove', this._onPointerMove, { passive: true });
    grid.addEventListener('pointerleave', this._onPointerLeave, { passive: true });
  }

  update(dt, elapsed) {
    if (!this.field) return;

    // Decay injected energy
    this._pulse = Math.max(0, this._pulse - dt * 0.65);

    for (let i = 0; i < this.field.count; i++) {
      const x = this._baseX[i];
      const y = this._baseY[i];

      const wave = Math.sin(elapsed * 1.15 + this._phases[i]) * 0.55;

      // Ripple influence from cursor
      const dx = this._nx[i] - this._mouse.x;
      const dy = this._ny[i] - this._mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist * 0.9);

      const ripple =
        Math.sin(elapsed * 2.25 - dist * 8) *
        influence *
        (0.35 + this._pulse * 0.95);

      const z = wave + ripple;
      const s = this._baseScale[i] * (0.80 + influence * 0.30 + this._pulse * 0.15);

      this._dummy.position.set(x, y, z);
      this._dummy.scale.setScalar(s);
      this._dummy.updateMatrix();
      this.field.setMatrixAt(i, this._dummy.matrix);
    }

    this.field.instanceMatrix.needsUpdate = true;
    if (this.field.material) {
      this.field.material.opacity = 0.86 + 0.12 * (0.5 + 0.5 * Math.sin(elapsed * 0.8));
    }
  }

  dispose() {
    const grid = document.getElementById('projectsGrid');
    if (grid && this._onCardHover) {
      grid.removeEventListener('mouseenter', this._onCardHover, true);
    }
    if (this.field) {
      this.scene.remove(this.field);
      this.field.geometry.dispose();
      this.field.material.dispose();
    }
    const pointerGrid = document.getElementById('projectsGrid');
    if (pointerGrid) {
      if (this._onPointerMove) pointerGrid.removeEventListener('pointermove', this._onPointerMove);
      if (this._onPointerLeave) pointerGrid.removeEventListener('pointerleave', this._onPointerLeave);
    }
    super.dispose();
  }
}
