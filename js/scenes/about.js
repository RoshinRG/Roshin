/**
 * about.js
 * AboutScene — Armor plate scatter → assembly animation.
 * Pause on hover, resume on leave.
 */

import * as THREE from 'three';
import { IronManScene, createGoldKeyLight, createAmbientLight, createFillLight } from '../utils/three-setup.js';
import { buildArmorPlates } from './shared.js';

const ASSEMBLE_DURATION = 3.5; // seconds to assemble
const HOLD_DURATION     = 1.5; // seconds to hold assembled state
const SCATTER_DURATION  = 1.0; // seconds to scatter back

export class AboutScene extends IronManScene {
  constructor() {
    super('avatarCanvas', { alpha: true });
    this._phase   = 'assemble'; // 'assemble' | 'hold' | 'scatter'
    this._phaseT  = 0;
    this._paused  = false;
  }

  init() {
    if (!this.canvas) return;

    createAmbientLight(this.scene);
    createGoldKeyLight(this.scene);
    createFillLight(this.scene);

    /* ── Plates ─────────────────────────────────────────── */
    this.plates = buildArmorPlates();
    this.plates.forEach(p => this.scene.add(p));
    this._storeScatterPositions();

    /* ── Camera ─────────────────────────────────────────── */
    this.camera.position.set(0, 0, 5.5);
    this.camera.lookAt(0, 0, 0);

    /* ── Hover pause / resume ───────────────────────────── */
    this._onEnter = () => { this._paused = true; };
    this._onLeave = () => { this._paused = false; };
    this._onClick = () => { this._resetAnimation(); };
    this.canvas.addEventListener('mouseenter', this._onEnter);
    this.canvas.addEventListener('mouseleave', this._onLeave);
    this.canvas.addEventListener('click',      this._onClick);
  }

  _storeScatterPositions() {
    this._scatterPos = this.plates.map(p => p.position.clone());
  }

  _resetAnimation() {
    this._phase  = 'assemble';
    this._phaseT = 0;
    this.plates.forEach((p, i) => {
      p.position.copy(this._scatterPos[i]);
    });
  }

  update(dt, elapsed) {
    if (this._paused || !this.plates) return;

    this._phaseT += dt;

    if (this._phase === 'assemble') {
      const t = Math.min(this._phaseT / ASSEMBLE_DURATION, 1);
      const ease = easeOutExpo(t);
      this.plates.forEach(p => {
        p.position.lerp(p.userData.target, ease * 0.07);
        p.rotation.y = elapsed * 0.3 * (1 - ease);
      });
      if (t >= 1) { this._phase = 'hold'; this._phaseT = 0; }
    }
    else if (this._phase === 'hold') {
      // Slow gentle rotation of assembled suit
      this.plates.forEach(p => { p.rotation.y = elapsed * 0.4; });
      if (this._phaseT >= HOLD_DURATION) { this._phase = 'scatter'; this._phaseT = 0; }
    }
    else if (this._phase === 'scatter') {
      const t = Math.min(this._phaseT / SCATTER_DURATION, 1);
      this.plates.forEach((p, i) => {
        p.position.lerp(this._scatterPos[i], easeInQuad(t) * 0.15);
      });
      if (t >= 1) { this._phase = 'assemble'; this._phaseT = 0; this._resetAnimation(); }
    }
  }

  dispose() {
    if (this.canvas) {
      this.canvas.removeEventListener('mouseenter', this._onEnter);
      this.canvas.removeEventListener('mouseleave', this._onLeave);
      this.canvas.removeEventListener('click',      this._onClick);
    }
    super.dispose();
  }
}

/* Easing helpers */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function easeInQuad(t) { return t * t; }
