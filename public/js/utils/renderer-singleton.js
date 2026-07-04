import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, WebGLRenderer } from 'three';
import { isMobile } from './device.js';

let sharedRenderer = null;
let currentCanvas = null;

export function getRenderer() {
  if (!sharedRenderer) {
    const canvas = document.createElement('canvas');
    canvas.id = 'sharedWebGLCanvas';
    // Remove hardcoded inline styles so that the CSS classes (like .skills__canvas) can properly control layout

    sharedRenderer = new WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !isMobile(),
      powerPreference: 'high-performance',
    });

    const dpr = Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2);
    sharedRenderer.setPixelRatio(dpr);
    sharedRenderer.setClearColor(0x050406, 1); // --bg-void
    sharedRenderer.outputColorSpace = SRGBColorSpace;
    sharedRenderer.toneMapping = ACESFilmicToneMapping;
    sharedRenderer.toneMappingExposure = 1.2;
    sharedRenderer.shadowMap.enabled = !isMobile();
    sharedRenderer.shadowMap.type = PCFSoftShadowMap;
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
  
  // Clear any inline styles that might interfere with CSS class-based layout
  renderer.domElement.style.cssText = '';
  
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
  // Pass false to prevent Three.js from setting inline style width/height
  renderer.setSize(w, h, false);
}
