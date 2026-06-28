/**
 * constructs.js
 * Generators for hacker/cyberpunk themed abstract Three.js geometries.
 */

import * as THREE from 'three';
import { getThemeColors } from '../utils/three-setup.js';

/**
 * createCyberCube
 * Creates a glowing tesseract/wireframe cube for the hero centerpiece.
 */
export function createCyberCube() {
  const colors = getThemeColors();
  const group = new THREE.Group();

  // Outer wireframe box
  const outerGeo = new THREE.BoxGeometry(3, 3, 3);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0x00ff41, // Terminal Green
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  group.add(outerMesh);

  // Inner solid core box
  const innerGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x008f11,
    emissive: 0x00ff41,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.9,
    wireframe: true
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  group.add(innerMesh);

  // Data nodes orbiting
  const nodeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00ff41 });
  const orbitGroup = new THREE.Group();
  
  for (let i = 0; i < 6; i++) {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    const angle = (i / 6) * Math.PI * 2;
    node.position.set(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0);
    orbitGroup.add(node);
  }
  
  // Tilt it so it doesn't look flat
  orbitGroup.rotation.x = Math.PI / 4;
  orbitGroup.rotation.y = Math.PI / 4;
  
  group.add(orbitGroup);

  // Store references for animation
  group.userData = {
    outer: outerMesh,
    inner: innerMesh,
    orbits: orbitGroup,
    baseScale: 1
  };

  return group;
}

/**
 * createDataStream
 * Creates an InstancedMesh of small cubes falling like matrix rain,
 * which eventually converge into a solid geometric block.
 */
export function createDataStream(count = 200) {
  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ff41,
    emissive: 0x008f11,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.8,
  });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  
  instancedMesh.userData = {
    targets: [],
    currents: [],
    rotations: [],
    targetRotations: [],
    time: 0
  };

  const dummy = new THREE.Object3D();
  
  // Build a cube structure as the target shape
  // Arrange them in a 3D grid
  const gridSize = Math.ceil(Math.cbrt(count));
  const offset = (gridSize - 1) / 2;
  const spacing = 0.4;
  let idx = 0;

  for (let x = 0; x < gridSize && idx < count; x++) {
    for (let y = 0; y < gridSize && idx < count; y++) {
      for (let z = 0; z < gridSize && idx < count; z++) {
        // Rain drop starting position (high up, scattered)
        const startX = (Math.random() - 0.5) * 20;
        const startY = 15 + Math.random() * 20;
        const startZ = (Math.random() - 0.5) * 20;
        instancedMesh.userData.currents.push(new THREE.Vector3(startX, startY, startZ));

        // Target grid position
        const targetX = (x - offset) * spacing;
        const targetY = (y - offset) * spacing;
        const targetZ = (z - offset) * spacing;
        instancedMesh.userData.targets.push(new THREE.Vector3(targetX, targetY, targetZ));

        // Rotations
        const startRot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const targetRot = new THREE.Euler(0, 0, 0); // Align perfectly to grid
        
        instancedMesh.userData.rotations.push(startRot);
        instancedMesh.userData.targetRotations.push(targetRot);

        dummy.position.set(startX, startY, startZ);
        dummy.rotation.copy(startRot);
        dummy.scale.setScalar(Math.random() * 0.5 + 0.5);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }
  }
  
  instancedMesh.instanceMatrix.needsUpdate = true;
  return instancedMesh;
}

/**
 * createCyberGlobe
 * A wireframe sphere for the contact section to pair with the glitch shader.
 */
export function createCyberGlobe(radius = 3) {
  // A dense sphere geometry looks good with the hologram scanlines
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  return geometry;
}
