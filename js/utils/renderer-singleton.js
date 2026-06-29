import * as THREE from 'three';
import { isMobile } from './three-setup.js';

let sharedRenderer = null;
let currentCanvas = null;

export function getRenderer() {
  if (!sharedRenderer) {
    // Create a generic canvas for the renderer
    const canvas = document.createElement('canvas');
    canvas.id = 'sharedWebGLCanvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0'; // Should be behind content

    sharedRenderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !isMobile(),
      powerPreference: 'high-performance',
    });

    const dpr = Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2);
    sharedRenderer.setPixelRatio(dpr);
    sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;
    sharedRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    sharedRenderer.toneMappingExposure = 1.2;
    sharedRenderer.shadowMap.enabled = !isMobile();
    sharedRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  return sharedRenderer;
}

/**
 * Mounts the shared renderer's DOM element into the DOM slot of the targetCanvas,
 * hiding the targetCanvas.
 */
export function mountRenderer(targetCanvas) {
  if (!targetCanvas) return;
  
  const renderer = getRenderer();
  
  // If already mounted here, do nothing
  if (currentCanvas === targetCanvas) return;

  // We are going to replace targetCanvas visually.
  // The simplest way without changing HTML structure is to insert the renderer's canvas
  // right after the target canvas, and hide the target canvas.
  
  // First, if we were mounted somewhere else, we should remove the renderer canvas
  // (though `insertBefore` automatically moves the element)
  
  // Hide the original placeholder canvas
  targetCanvas.style.display = 'none';
  
  // Apply classes from target to shared canvas so it styles correctly
  renderer.domElement.className = targetCanvas.className;
  
  // Insert the shared renderer canvas exactly where the placeholder was
  if (targetCanvas.parentNode) {
      targetCanvas.parentNode.insertBefore(renderer.domElement, targetCanvas.nextSibling);
  }
  
  currentCanvas = targetCanvas;
}

export function resizeRenderer(camera) {
  if (!currentCanvas || !camera) return;
  
  // We measure the container of the current canvas, since the canvas itself is hidden
  const container = currentCanvas.parentElement;
  if (!container) return;

  const w = container.clientWidth;
  const h = container.clientHeight;
  
  if (w === 0 || h === 0) return; // Not visible yet

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  
  const renderer = getRenderer();
  renderer.setSize(w, h);
}
