/**
 * loader.js
 * ModelLoader — GLTF/GLB model loading wrapper with fallback
 * to procedural geometry if a model file isn't found.
 *
 * Usage:
 *   import { ModelLoader } from '../utils/loader.js';
 *   const loader = new ModelLoader();
 *   const suit = await loader.load('/models/iron-man.glb');
 *   scene.add(suit);
 *
 * If the model fails to load (404, network error, etc.), the loader
 * automatically falls back to buildIronManSuit() from shared.js.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { buildIronManSuit } from '../scenes/shared.js';

/* Singleton DRACO decoder — shared across all loader instances */
let _dracoLoader = null;
function getDracoLoader() {
  if (!_dracoLoader) {
    _dracoLoader = new DRACOLoader();
    _dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    _dracoLoader.setDecoderConfig({ type: 'js' });
  }
  return _dracoLoader;
}

export class ModelLoader {
  constructor() {
    this._gltf   = new GLTFLoader();
    this._cache  = new Map(); // url → THREE.Group (prevents double loads)
    this._gltf.setDRACOLoader(getDracoLoader());
  }

  /**
   * Load a GLTF/GLB model by URL.
   * Falls back to procedural Iron Man suit on any error.
   *
   * @param {string} url  — Path or URL to .glb / .gltf file
   * @param {object} opts — Options passed to buildIronManSuit on fallback
   * @returns {Promise<THREE.Group>}
   */
  async load(url, opts = {}) {
    if (this._cache.has(url)) {
      return this._cache.get(url).clone();
    }

    return new Promise((resolve) => {
      this._gltf.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          this._prepareModel(model);
          this._cache.set(url, model);
          resolve(model.clone());
        },
        undefined, // progress — omitted
        (err) => {
          console.warn(`[ModelLoader] Failed to load "${url}", using procedural fallback.`, err);
          const fallback = buildIronManSuit(opts);
          resolve(fallback);
        }
      );
    });
  }

  /**
   * Prepare a freshly loaded GLTF scene —
   * enables shadows, adjusts materials.
   */
  _prepareModel(model) {
    model.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow    = true;
      child.receiveShadow = true;

      // Ensure PBR materials look right
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
          if (mat.isMeshStandardMaterial) {
            mat.envMapIntensity = 1.2;
            mat.needsUpdate     = true;
          }
        });
      }
    });

    // Auto-scale: fit within a 4-unit bounding box
    const box    = new THREE.Box3().setFromObject(model);
    const size   = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) model.scale.setScalar(4 / maxDim);

    // Centre at origin
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
  }

  /** Pre-warm the loader by fetching a URL without blocking render. */
  preload(url) {
    this.load(url).catch(() => {});
  }

  /** Release DRACO decoder when done with all loading. */
  static disposeDraco() {
    _dracoLoader?.dispose();
    _dracoLoader = null;
  }
}

/* Default shared instance */
export const modelLoader = new ModelLoader();
