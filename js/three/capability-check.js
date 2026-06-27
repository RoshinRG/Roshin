export function checkWebGLCapability() {
  // 1. Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.warn("WebGL Disabled: prefers-reduced-motion detected.");
    return false;
  }

  // 2. Check WebGL2 Support
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.warn("WebGL Disabled: WebGL2 not supported.");
      return false;
    }
    
    // 3. Timing Probe (Synchronous test to catch extremely slow hardware)
    // We clear a 1x1 buffer and read a pixel to force a sync pipeline flush.
    const startTime = performance.now();
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    const pixels = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    const duration = performance.now() - startTime;
    
    if (duration > 50) {
      console.warn(`WebGL Disabled: GPU too slow (probe took ${Math.round(duration)}ms).`);
      return false;
    }
    
    console.log(`WebGL Capability Check Passed. GPU probe took ${Math.round(duration)}ms.`);
    return true;
    
  } catch (e) {
    console.warn("WebGL Disabled: Exception during context creation.", e);
    return false;
  }
}
