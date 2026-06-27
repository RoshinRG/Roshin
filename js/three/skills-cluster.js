import * as THREE from 'three';

export class SkillsCluster {
  constructor() {
    this.group = new THREE.Group();
    this.isActive = false; // Starts inactive, toggled by ScrollSpy
    
    // Position it appropriately (e.g., right side of the screen or centered)
    this.group.position.set(0, 0, 0);

    const style = getComputedStyle(document.documentElement);
    const getHex = (varName) => parseInt(style.getPropertyValue(varName).trim().replace('#', '0x')) || 0xFFFFFF;

    // Define categories and their materials (max 5)
    this.categories = [
      { name: "Core", color: getHex('--rose-gold'), depth: 2.0 },
      { name: "DOM", color: getHex('--rose-gold-dim'), depth: 2.5 },
      { name: "Architecture", color: getHex('--circuit-trace'), depth: 3.0 },
      { name: "Styling", color: getHex('--circuit-trace'), depth: 3.5 },
      { name: "Tools", color: getHex('--circuit-trace'), depth: 4.5 }
    ];

    const skillsData = [
      { text: "Vanilla JS", category: 0 }, { text: "HTML5", category: 0 }, { text: "CSS3", category: 0 },
      { text: "DOM Traversing", category: 1 }, { text: "MutationObserver", category: 1 }, { text: "Event Handling", category: 1 },
      { text: "SPA Patterns", category: 2 }, { text: "Service Workers", category: 2 }, { text: "BEM CSS", category: 2 },
      { text: "CSS Grid", category: 3 }, { text: "Flexbox", category: 3 }, { text: "Animations", category: 3 },
      { text: "Three.js", category: 4 }, { text: "Python", category: 4 }, { text: "Git", category: 4 }
    ];

    this.materials = this.categories.map(c => new THREE.SpriteMaterial({
      color: c.color,
      transparent: true,
      depthTest: false // Ensures sprites don't clip each other awkwardly
    }));

    this.sprites = [];
    this.createHelix(skillsData);

    // Interaction variables
    this.isDragging = false;
    this.previousPointer = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    // We only attach to the document when the component is active, 
    // but for simplicity, we attach here and check `isActive` inside handlers.
    document.addEventListener('pointerdown', this.onPointerDown);
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerUp);
  }

  createHelix(skills) {
    const count = skills.length;
    for (let i = 0; i < count; i++) {
      const skill = skills[i];
      const cat = this.categories[skill.category];
      
      const texture = this.createCanvasTexture(skill.text);
      
      // Clone the shared material and assign the unique texture
      const mat = this.materials[skill.category].clone();
      mat.map = texture;

      const sprite = new THREE.Sprite(mat);
      
      // Scale sprite based on text aspect ratio (approx)
      sprite.scale.set(texture.image.width / 50, texture.image.height / 50, 1);
      
      // Position in a helix/sphere
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      
      // Map expertise (category) to depth/radius
      const r = cat.depth;
      
      sprite.position.x = r * Math.cos(theta) * Math.sin(phi);
      sprite.position.y = r * Math.sin(theta) * Math.sin(phi);
      sprite.position.z = r * Math.cos(phi);
      
      this.group.add(sprite);
      this.sprites.push({ mesh: sprite, material: mat, texture: texture });
    }
  }

  createCanvasTexture(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Make it high-res for crisp text
    canvas.width = 256;
    canvas.height = 64;
    
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    // Needed to keep text sharp
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  onPointerDown(e) {
    if (!this.isActive) return;
    this.isDragging = true;
    this.previousPointer.x = e.clientX;
    this.previousPointer.y = e.clientY;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  onPointerMove(e) {
    if (!this.isDragging || !this.isActive) return;
    
    const deltaX = e.clientX - this.previousPointer.x;
    const deltaY = e.clientY - this.previousPointer.y;
    
    this.velocity.x = deltaX * 0.005;
    this.velocity.y = deltaY * 0.005;
    
    this.group.rotation.y += this.velocity.x;
    this.group.rotation.x += this.velocity.y;
    
    this.previousPointer.x = e.clientX;
    this.previousPointer.y = e.clientY;
  }

  onPointerUp() {
    this.isDragging = false;
  }

  update(delta) {
    if (!this.isActive) return; // Freeze entirely if not visible

    // Apply inertia decay
    if (!this.isDragging) {
      this.group.rotation.y += this.velocity.x;
      this.group.rotation.x += this.velocity.y;
      
      this.velocity.x *= 0.95; // damping
      this.velocity.y *= 0.95;
      
      // Auto-rotation if completely still
      if (Math.abs(this.velocity.x) < 0.001 && Math.abs(this.velocity.y) < 0.001) {
        this.group.rotation.y += delta * 0.1;
      }
    }
  }

  dispose() {
    document.removeEventListener('pointerdown', this.onPointerDown);
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerUp);

    this.materials.forEach(m => m.dispose());
    this.sprites.forEach(s => {
      s.mesh.geometry.dispose();
      s.material.dispose();
      s.texture.dispose();
    });
  }
}
