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
    sharedRenderer.setClearColor(0x000000, 1); // --void-black
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

  // Hide the original placeholder canvas
  targetCanvas.style.display = 'none';
  
  // Apply classes from target to shared canvas so it styles correctly
  renderer.domElement.className = targetCanvas.className;
  
  // PERF: Pre-set dimensions on the shared canvas BEFORE inserting it into the DOM.
  // Without this, the browser computes intrinsic dimensions after insertion, which
  // triggers a layout shift on <body> (the root cause of desktop CLS 0.737).
  // We measure the container (parent of the hidden placeholder) and apply matching
  // dimensions so the canvas occupies exactly the same space from its first frame.
  const container = targetCanvas.parentElement;
  if (container) {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.domElement.style.cssText = `position:absolute;inset:0;width:${w}px;height:${h}px;`;
  } else {
    renderer.domElement.style.cssText = 'position:absolute;inset:0;';
  }
  
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
