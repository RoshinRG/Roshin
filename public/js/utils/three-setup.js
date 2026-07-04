/**
 * three-setup.js
 * BaseScene — Base class for all Three.js sections.
 * Handles renderer, camera, resize, pause/resume, device detection.
 */

import { AmbientLight, Clock, PerspectiveCamera, PointLight, Scene } from 'three';
import { getRenderer, mountRenderer, resizeRenderer } from './renderer-singleton.js';
import { isMobile, isReducedMotion } from './device.js';

export class BaseScene {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.options = {
      alpha: true,
      antialias: !isMobile(),
      powerPreference: 'high-performance',
      ...options,
    };

    this.scene    = new Scene();
    this.clock    = new Clock();
    this.isActive = false;
    this.animId   = null;

    mountRenderer(this.canvas);
    this.renderer = getRenderer();
    this._buildCamera();
    this._onResize = this._onResize.bind(this);
    // Debounce resize to avoid cascading layout reads during drag-resize (fixes forced reflow)
    this._onResizeDebounced = (() => {
      let timer;
      return () => { clearTimeout(timer); timer = setTimeout(() => this._onResize(), 100); };
    })();
    window.addEventListener('resize', this._onResizeDebounced);
  }


  /* ── Camera ─────────────────────────────────────────────── */
  _buildCamera() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera = new PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
  }

  /* ── Resize handler ─────────────────────────────────────── */
  _onResize() {
    if (!this.canvas) return;
    
    // Only resize the shared renderer and camera if this scene is active
    if (this.isActive) {
        resizeRenderer(this.camera);
    }
    
    const w = this.canvas.clientWidth || (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 0);
    const h = this.canvas.clientHeight || (this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 0);
    
    if (this.onResize && w > 0 && h > 0) this.onResize(w, h);
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
    if (isReducedMotion()) {
      console.warn('[A11Y] Reduced motion is enabled on your OS. Three.js animations are paused.');
      // Render at least one frame so the canvas isn't empty
      this.update(0.016, 0);
      this.renderer.render(this.scene, this.camera);
      return;
    }
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
    window.removeEventListener('resize', this._onResizeDebounced);
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => {
          m.dispose();
          if (m.map) m.map.dispose();
          if (m.lightMap) m.lightMap.dispose();
          if (m.bumpMap) m.bumpMap.dispose();
          if (m.normalMap) m.normalMap.dispose();
          if (m.specularMap) m.specularMap.dispose();
          if (m.envMap) m.envMap.dispose();
        });
      }
    });
    this.scene.clear();
    // this.renderer.dispose(); // DO NOT DISPOSE SHARED RENDERER
  }
}

/* ── Shared lighting factory — Rose Gold three-point rig ─── */
export function createNeonKeyLight(scene) {
  // Key light — rose gold warmth from upper left
  const light = new PointLight(0xB76E79, 2.5, 80);
  light.position.set(-20, 20, 10);
  light.castShadow = !isMobile();
  scene.add(light);
  return light;
}

export function createAmbientLight(scene) {
  // Ambient — dark warm shadow fill
  const ambient = new AmbientLight(0x1A0D10, 0.6);
  scene.add(ambient);
  return ambient;
}

export function createFillLight(scene) {
  // Rim light — cool shimmer from upper right
  const fill = new PointLight(0xEDD5C8, 1.2, 60);
  fill.position.set(20, 15, -10);
  scene.add(fill);
  return fill;
}

export function createDeepAccentLight(scene) {
  // Deep accent — subtle deep rose from below
  const accent = new PointLight(0x7A3D45, 0.8, 40);
  accent.position.set(0, -15, 5);
  scene.add(accent);
  return accent;
}
