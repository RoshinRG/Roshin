/**
 * three-setup.js
 * IronManScene — Base class for all Three.js sections.
 * Handles renderer, camera, resize, pause/resume, device detection.
 */

import * as THREE from 'three';

export const isMobile = () => window.innerWidth <= 768;
export const isReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class IronManScene {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.options = {
      alpha: true,
      antialias: !isMobile(),
      powerPreference: 'high-performance',
      ...options,
    };

    this.scene    = new THREE.Scene();
    this.clock    = new THREE.Clock();
    this.isActive = false;
    this.animId   = null;

    this._buildRenderer();
    this._buildCamera();
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  /* ── Renderer ───────────────────────────────────────────── */
  _buildRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas:         this.canvas,
      alpha:          this.options.alpha,
      antialias:      this.options.antialias,
      powerPreference: this.options.powerPreference,
    });

    const dpr = Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping      = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = !isMobile();
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  }

  /* ── Camera ─────────────────────────────────────────────── */
  _buildCamera() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
  }

  /* ── Resize handler ─────────────────────────────────────── */
  _onResize() {
    if (!this.canvas) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.onResize) this.onResize(w, h);
  }

  /* ── Lifecycle ──────────────────────────────────────────── */
  init() { /* Override in subclass */ }

  _tick() {
    if (!this.isActive) return;
    this.animId = requestAnimationFrame(() => this._tick());
    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    this.update(dt, elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  update(dt, elapsed) { /* Override in subclass */ }

  start() {
    if (this.isActive) return;
    if (isReducedMotion()) return;
    this.isActive = true;
    this.clock.start();
    this._tick();
  }

  pause() {
    this.isActive = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = null;
  }

  resume() {
    if (!this.isActive) this.start();
  }

  dispose() {
    this.pause();
    window.removeEventListener('resize', this._onResize);
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material))
          obj.material.forEach(m => m.dispose());
        else
          obj.material.dispose();
      }
    });
    this.renderer.dispose();
  }
}

/* ── Shared lighting factory ──────────────────────────────── */
export function createGoldKeyLight(scene) {
  const light = new THREE.PointLight(0xd4af37, 3, 20);
  light.position.set(3, 4, 3);
  light.castShadow = !isMobile();
  scene.add(light);
  return light;
}

export function createAmbientLight(scene) {
  const ambient = new THREE.AmbientLight(0x0a1a3a, 0.8);
  scene.add(ambient);
  return ambient;
}

export function createFillLight(scene) {
  const fill = new THREE.PointLight(0x00d9ff, 0.5, 15);
  fill.position.set(-4, -2, 2);
  scene.add(fill);
  return fill;
}
