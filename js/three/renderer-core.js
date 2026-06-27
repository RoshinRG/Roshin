import * as THREE from 'three';

export class RendererCore {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    
    // Cap pixel ratio to 2 for performance, especially on mobile
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true, // Allow void-black CSS background to show through
      powerPreference: "high-performance"
    });
    
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // Transparent clear

    this.scene = new THREE.Scene();
    
    // Single global camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 50);
    this.scene.add(this.camera);

    this.components = [];
    this.rafId = null;
    this.lastTime = 0;

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    
    // Pre-allocate vector for mouse tracking
    this.mouse = new THREE.Vector2();
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });
  }

  addComponent(component) {
    if (component.mesh || component.group) {
      this.scene.add(component.mesh || component.group);
    }
    this.components.push(component);
  }

  removeComponent(component) {
    if (component.mesh || component.group) {
      this.scene.remove(component.mesh || component.group);
    }
    this.components = this.components.filter(c => c !== component);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    
    this.components.forEach(c => {
      if (c.onResize) c.onResize(width, height);
    });
  }

  start() {
    if (!this.rafId) {
      this.lastTime = performance.now();
      this.render();
    }
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  render(time) {
    this.rafId = requestAnimationFrame(this.render.bind(this));
    
    const delta = (time - this.lastTime) * 0.001; // in seconds
    this.lastTime = time;

    // Update all components
    this.components.forEach(c => {
      if (c.update && c.isActive !== false) {
        c.update(delta, this.mouse);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.components.forEach(c => {
      if (c.dispose) c.dispose();
    });
    this.scene.clear();
    this.renderer.dispose();
  }
}
