/**
 * about.js
 * AboutScene — Data stream matrix rain animation.
 * Matrix cubes fall and assemble into a single data block.
 */

import * as THREE from 'three';
import { BaseScene, createNeonKeyLight, createAmbientLight, createFillLight } from '../utils/three-setup.js';
import { createDataStream } from './constructs.js';

export class AboutScene extends BaseScene {
  constructor() { super('aboutCanvas'); }

  init() {
    if (!this.canvas) return;

    /* ── Lights ─────────────────────────────────────────── */
    createAmbientLight(this.scene);
    this.keyLight  = createNeonKeyLight(this.scene);
    this.fillLight = createFillLight(this.scene);

    /* ── Data Stream Matrix Rain ────────────────────────── */
    this.stream = createDataStream(216); // 6x6x6 cube
    this.scene.add(this.stream);

    /* ── Camera & Interactions ──────────────────────────── */
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);

    // Matrix scatter on click
    this._onClick = () => {
      this.stream.userData.time = 0; // restart animation
      const count = this.stream.count;
      for (let i = 0; i < count; i++) {
        // Scatter back to random start positions high up
        this.stream.userData.currents[i].set(
          (Math.random() - 0.5) * 20,
          15 + Math.random() * 20,
          (Math.random() - 0.5) * 20
        );
        this.stream.userData.rotations[i].set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
      }
    };
    this.canvas.addEventListener('click', this._onClick);
  }

  update(dt, elapsed) {
    if (!this.stream) return;

    const uData = this.stream.userData;
    uData.time += dt;
    
    // Animate over 3.5 seconds
    const progress = Math.min(uData.time / 3.5, 1);
    const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart

    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.stream.count; i++) {
      // Lerp position
      const curr = uData.currents[i];
      const target = uData.targets[i];
      
      const px = curr.x + (target.x - curr.x) * ease;
      const py = curr.y + (target.y - curr.y) * ease;
      const pz = curr.z + (target.z - curr.z) * ease;

      // Lerp rotation
      const rCurr = uData.rotations[i];
      const rTarget = uData.targetRotations[i];
      
      const rx = rCurr.x + (rTarget.x - rCurr.x) * ease;
      const ry = rCurr.y + (rTarget.y - rCurr.y) * ease;
      const rz = rCurr.z + (rTarget.z - rCurr.z) * ease;

      dummy.position.set(px, py, pz);
      dummy.rotation.set(rx, ry, rz);
      dummy.updateMatrix();
      this.stream.setMatrixAt(i, dummy.matrix);
    }
    
    this.stream.instanceMatrix.needsUpdate = true;
    
    // Slowly rotate the entire constructed matrix cube
    this.stream.rotation.y = elapsed * 0.2;
    this.stream.rotation.x = Math.sin(elapsed * 0.5) * 0.1;
  }

  dispose() {
    if (this._onClick) this.canvas.removeEventListener('click', this._onClick);
    super.dispose();
  }
}
