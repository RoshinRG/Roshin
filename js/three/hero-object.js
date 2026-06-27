import * as THREE from 'three';

export class HeroObject {
  constructor() {
    this.group = new THREE.Group();
    this.isActive = true;
    
    const style = getComputedStyle(document.documentElement);
    const roseGold = parseInt(style.getPropertyValue('--rose-gold').trim().replace('#', '0x')) || 0xE8C99B;

    // Create a PCB-plane representation. We use a plane geometry with 15x15 segments.
    // 15x15 = 225 faces -> EdgesGeometry will produce well under 2,000 segments.
    const geometry = new THREE.PlaneGeometry(30, 20, 15, 10);
    const edges = new THREE.EdgesGeometry(geometry);
    
    const material = new THREE.LineBasicMaterial({
      color: roseGold,
      transparent: true,
      opacity: 0.4
    });
    
    this.mesh = new THREE.LineSegments(edges, material);
    
    // Position it slightly off-center to act as a backdrop for the Hero text
    this.mesh.position.set(10, 0, -20);
    this.mesh.rotation.x = Math.PI / 4; // Tilt it back
    
    this.group.add(this.mesh);
    
    // For Parallax
    this.targetRotationX = this.mesh.rotation.x;
    this.targetRotationY = this.mesh.rotation.y;
  }

  update(delta, mouseVector) {
    // Clamped parallax: max ±4° (which is approx ±0.07 radians)
    const maxRot = 0.07;
    
    // mouseVector is normalized [-1, 1]
    const destX = this.targetRotationX + (mouseVector.y * maxRot);
    const destY = this.targetRotationY + (mouseVector.x * maxRot);
    
    // Lerp with 0.05 damping factor
    this.mesh.rotation.x += (destX - this.mesh.rotation.x) * 0.05;
    this.mesh.rotation.y += (destY - this.mesh.rotation.y) * 0.05;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
