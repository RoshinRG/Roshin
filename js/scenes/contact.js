/**
 * contact.js
 * ContactScene — Semi-transparent Iron Man hologram background
 * with animated scan lines and noise flicker.
 */

import * as THREE from 'three';
import { IronManScene, createAmbientLight } from '../utils/three-setup.js';
import { hologramShader, createShaderMaterial } from '../utils/shader.js';
import { buildIronManSuit } from './shared.js';

export class ContactScene extends IronManScene {
  constructor() { super('contactCanvas'); }

  init() {
    if (!this.canvas) return;

    createAmbientLight(this.scene);

    /* ── Hologram suit ───────────────────────────────────── */
    this.suit = buildIronManSuit({ redColor: 0x003366, goldColor: 0x004488 });

    // Override all materials with hologram shader
    const holoMat = createShaderMaterial(hologramShader, { side: THREE.DoubleSide });
    this.suit.traverse(child => {
      if (child.isMesh) {
        child.material = holoMat;
        child.castShadow = false;
      }
    });
    this._holoMat = holoMat;

    this.suit.position.set(2.5, -0.3, -1);
    this.suit.scale.setScalar(1.0);
    this.scene.add(this.suit);

    /* ── Scan-line plane (full-screen quad) ─────────────── */
    const scanMat = new THREE.MeshBasicMaterial({
      color:       0x00d9ff,
      transparent: true,
      opacity:     0.06,
      side:        THREE.DoubleSide,
    });
    this._scanLine = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 0.03),
      scanMat
    );
    this._scanLine.position.z = 0.5;
    this.scene.add(this._scanLine);

    /* ── Soft blue edge light ────────────────────────────── */
    const edgeLight = new THREE.PointLight(0x00d9ff, 1, 10);
    edgeLight.position.set(-3, 2, 2);
    this.scene.add(edgeLight);

    /* ── Camera ─────────────────────────────────────────── */
    this.camera.position.set(0, 0, 7);
    this.camera.lookAt(2, 0, 0);
  }

  update(dt, elapsed) {
    if (!this.suit) return;

    /* ── Suit gentle rotation ────────────────────────────── */
    this.suit.rotation.y = elapsed * 0.2;

    /* ── Hologram shader time ────────────────────────────── */
    if (this._holoMat) {
      this._holoMat.uniforms.uTime.value = elapsed;

      // Random flicker
      const flicker = 0.28 + 0.07 * Math.sin(elapsed * 7.3) + 0.04 * Math.random();
      this._holoMat.uniforms.uOpacity.value = flicker;
    }

    /* ── Scan line animation ─────────────────────────────── */
    if (this._scanLine) {
      const period = 2.0; // seconds per full sweep
      const t      = (elapsed % period) / period;
      // Map t [0,1] → y from +5 (top) to -5 (bottom)
      this._scanLine.position.y = 5 - t * 10;
      this._scanLine.material.opacity = 0.04 + 0.08 * Math.sin(t * Math.PI);
    }
  }
}
