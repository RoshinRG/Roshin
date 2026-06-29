/**
 * contact.js
 * ContactScene — Semi-transparent abstract geometric hologram background
 * with animated scan lines and noise flicker.
 */

import * as THREE from 'three';
import { BaseScene, createAmbientLight } from '../utils/three-setup.js';
import { hologramShader, createShaderMaterial } from '../utils/shader.js';
import { createCyberGlobe } from './constructs.js';

export class ContactScene extends BaseScene {
  constructor() { super('contactCanvas'); }

  init() {
    if (!this.canvas) return;

    createAmbientLight(this.scene);

    /* ── Hologram Sphere ─────────────────────────────────── */
    const sphereGeo = createCyberGlobe(2.5);

    // Hologram shader material
    const holoMat = createShaderMaterial(hologramShader, { 
      side: THREE.DoubleSide,
      wireframe: true 
    });
    
    this.hologramMesh = new THREE.Mesh(sphereGeo, holoMat);
    this._holoMat = holoMat;

    this.hologramMesh.position.set(2.5, 0, -1);
    this.scene.add(this.hologramMesh);

    /* ── Scan-line plane (full-screen quad) ─────────────── */
    const scanMat = new THREE.MeshBasicMaterial({
      color:       0x00ff41,
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

    /* ── Soft green edge light ────────────────────────────── */
    const edgeLight = new THREE.PointLight(0x00ff41, 1, 10);
    edgeLight.position.set(-3, 2, 2);
    this.scene.add(edgeLight);

    /* ── Camera ─────────────────────────────────────────── */
    this.camera.position.set(0, 0, 7);
    this.camera.lookAt(2, 0, 0);
  }

  update(dt, elapsed) {
    if (!this.hologramMesh) return;

    /* ── Geometric gentle rotation ───────────────────────── */
    this.hologramMesh.rotation.y = elapsed * 0.3;
    this.hologramMesh.rotation.x = elapsed * 0.1;

    /* ── Hologram shader time ────────────────────────────── */
    if (this._holoMat) {
      this._holoMat.uniforms.uTime.value = elapsed;

      // Random flicker
      const flicker = 0.28 + 0.07 * Math.sin(elapsed * 7.3) + 0.04 * Math.random();
      this._holoMat.uniforms.uOpacity.value = flicker;
      
      // Manual Glitch Translation
      if (Math.random() > 0.95) {
        this.hologramMesh.position.x = 2.5 + (Math.random() - 0.5) * 0.2;
      } else {
        this.hologramMesh.position.x = 2.5;
      }
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
