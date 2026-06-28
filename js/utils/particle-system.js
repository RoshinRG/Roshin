/**
 * particle-system.js
 * InstancedMesh-based particle system with Brownian motion,
 * alpha fade near edges, and gold/cyan color flicker.
 */

import * as THREE from 'three';
import { isMobile } from './three-setup.js';

const _dummy  = new THREE.Object3D();
const _color  = new THREE.Color();

export class ParticleSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {object} opts
   * @param {number}  opts.count       - particle count (desktop)
   * @param {number}  opts.spread      - position spread radius
   * @param {number}  opts.size        - particle base size
   * @param {number}  opts.speed       - Brownian motion speed multiplier
   * @param {boolean} opts.depthBound  - constrain z within ±spread/2
   * @param {string[]} opts.palette    - hex color strings to cycle
   */
  constructor(scene, opts = {}) {
    this.scene    = scene;
    const mobile  = isMobile();

    this.opts = {
      count:      mobile ? 60 : (opts.count || 150),
      spread:     opts.spread    || 8,
      size:       opts.size      || 0.04,
      speed:      opts.speed     || 0.3,
      depthBound: opts.depthBound !== false,
      palette:    opts.palette   || ['#d4af37', '#ffd700', '#00d9ff', '#ffffff'],
    };

    this._init();
  }

  _init() {
    const { count, size, spread, palette } = this.opts;

    const geo = new THREE.SphereGeometry(size, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent:  true,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(count * 3), 3
    );

    // Particle state arrays
    this.positions  = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.opacities  = new Float32Array(count);
    this.phases     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random position
      const x = (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread;
      const z = this.opts.depthBound
        ? (Math.random() - 0.5) * spread * 0.5
        : 0;

      this.positions[i * 3]     = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      // Random velocity
      this.velocities[i * 3]     = (Math.random() - 0.5) * 0.02;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      this.opacities[i] = Math.random();
      this.phases[i]    = Math.random() * Math.PI * 2;

      // Color from palette
      const hex = palette[Math.floor(Math.random() * palette.length)];
      _color.set(hex);
      this.mesh.setColorAt(i, _color);
    }

    this.mesh.instanceColor.needsUpdate = true;
    this.scene.add(this.mesh);
  }

  update(elapsed) {
    const { count, spread, speed } = this.opts;
    const half = spread / 2;

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;

      // Brownian nudge
      this.velocities[ix]     += (Math.random() - 0.5) * 0.003 * speed;
      this.velocities[iy]     += (Math.random() - 0.5) * 0.003 * speed;
      this.velocities[iz]     += (Math.random() - 0.5) * 0.001 * speed;

      // Dampen
      this.velocities[ix]     *= 0.96;
      this.velocities[iy]     *= 0.96;
      this.velocities[iz]     *= 0.96;

      // Move
      this.positions[ix]      += this.velocities[ix];
      this.positions[iy]      += this.velocities[iy];
      this.positions[iz]      += this.velocities[iz];

      // Wrap at boundary
      for (const axis of [ix, iy]) {
        if (this.positions[axis] > spread) this.positions[axis] = -spread;
        if (this.positions[axis] < -spread) this.positions[axis] = spread;
      }

      // Edge fade: alpha drops near ±spread boundary
      const edgeDist = Math.min(
        (this.positions[ix] + spread) / half,
        (spread - this.positions[ix]) / half,
        (this.positions[iy] + spread) / half,
        (spread - this.positions[iy]) / half,
        1
      );
      // Flickering alpha
      const flicker = 0.5 + 0.5 * Math.sin(elapsed * 2 + this.phases[i]);
      const alpha   = Math.min(edgeDist, flicker) * 0.8;

      // Apply to matrix
      _dummy.position.set(
        this.positions[ix],
        this.positions[iy],
        this.positions[iz]
      );
      _dummy.scale.setScalar(0.5 + flicker * 0.5);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);

      // Occasional color flicker
      if (Math.random() < 0.003) {
        const hex = this.opts.palette[Math.floor(Math.random() * this.opts.palette.length)];
        _color.set(hex);
        this.mesh.setColorAt(i, _color);
        this.mesh.instanceColor.needsUpdate = true;
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
