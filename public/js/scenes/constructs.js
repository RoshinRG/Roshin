/**
 * constructs.js
 * Generators for hacker/cyberpunk themed abstract Three.js geometries.
 */

import {
  BoxGeometry,
  DynamicDrawUsage,
  Euler,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RingGeometry,
  SphereGeometry,
  TorusKnotGeometry,
  Vector3,
} from 'three';
import { isMobile } from '../utils/device.js';
import { coreGlowShader, createShaderMaterial } from '../utils/shader.js';

/**
 * createCyberCube
 * Creates a glowing tesseract/wireframe cube for the hero centerpiece.
 */
export function createCyberCube() {
  const group = new Group();

  // Wireframe torus knot shell (new hero look)
  const shellGeo = new TorusKnotGeometry(1.25, 0.42, 160, 28);
  const shellMat = new MeshBasicMaterial({
    color: 0xE8C39E,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const torus = new Mesh(shellGeo, shellMat);
  torus.rotation.x = Math.PI / 2;
  group.add(torus);

  // Shader-driven energy sphere (pulses via uTime)
  const coreMat = createShaderMaterial(coreGlowShader, { transparent: true });
  const coreSphereGeo = new SphereGeometry(0.36, 32, 32);
  const coreSphere = new Mesh(coreSphereGeo, coreMat);
  group.add(coreSphere);

  // Halo rings (cheap, layered glow)
  const ringGeo = new RingGeometry(0.92, 1.08, 180);
  const ringMat = new MeshBasicMaterial({
    color: 0xD4AF37,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
  });

  const ring1 = new Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2;
  ring1.rotation.y = Math.PI / 6;
  group.add(ring1);

  const ring2 = new Mesh(ringGeo, ringMat);
  ring2.rotation.x = Math.PI / 2;
  ring2.rotation.y = -Math.PI / 7;
  group.add(ring2);

  // Data nodes orbiting along a tilted helix
  const nodeGeo = new BoxGeometry(0.14, 0.14, 0.14);
  const nodeMat = new MeshBasicMaterial({ color: 0xB76E79 });
  const orbitGroup = new Group();
  const nodeCount = isMobile() ? 7 : 11;

  for (let i = 0; i < nodeCount; i++) {
    const node = new Mesh(nodeGeo, nodeMat);
    const t = i / nodeCount;
    const angle = t * Math.PI * 2;
    const r = 2.15 - t * 0.6;
    node.position.set(
      Math.cos(angle) * r,
      Math.sin(angle) * r * 0.65,
      (Math.random() - 0.5) * 1.2
    );
    orbitGroup.add(node);
  }

  orbitGroup.rotation.x = Math.PI / 5;
  orbitGroup.rotation.y = Math.PI / 6;
  group.add(orbitGroup);

  group.userData = {
    torus,
    coreSphere,
    rings: [ring1, ring2],
    orbitGroup,
  };

  return group;
}

/**
 * createDataStream
 * Creates an InstancedMesh of small cubes falling like matrix rain,
 * which eventually converge into a solid geometric block.
 */
export function createDataStream(count = 200) {
  // Instanced "armor plates" assembling into a helmet-ish structure.
  const geometry = new BoxGeometry(0.46, 0.08, 0.30);
  const material = new MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.95,
  });

  const instancedMesh = new InstancedMesh(geometry, material, count);
  instancedMesh.instanceMatrix.setUsage(DynamicDrawUsage);
  
  instancedMesh.userData = {
    targets: [],
    currents: [],
    rotations: [],
    targetRotations: [],
    scales: [],
    time: 0
  };

  const dummy = new Object3D();
  
  for (let i = 0; i < count; i++) {
    // Rain start (high up, scattered)
    const startX = (Math.random() - 0.5) * 18;
    const startY = 10 + Math.random() * 18;
    const startZ = (Math.random() - 0.5) * 18;
    instancedMesh.userData.currents.push(new Vector3(startX, startY, startZ));

    // Target outward volume (helmet-ish: bias to upper hemisphere)
    let dir;
    do {
      dir = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    } while (dir.y < -0.28);

    const radius = 2.7 + (Math.random() - 0.5) * 0.35;
    const target = dir.multiplyScalar(radius);
    instancedMesh.userData.targets.push(target.clone());

    // Plate orientation roughly facing outward from the center
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = Math.asin(dir.y);

    const startRot = new Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    const targetRot = new Euler(pitch, yaw, Math.random() * Math.PI);

    instancedMesh.userData.rotations.push(startRot);
    instancedMesh.userData.targetRotations.push(targetRot);

    const scale = 0.65 + Math.random() * 0.85;
    instancedMesh.userData.scales.push(scale);

    dummy.position.copy(instancedMesh.userData.currents[i]);
    dummy.rotation.copy(startRot);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }
  
  instancedMesh.instanceMatrix.needsUpdate = true;
  return instancedMesh;
}

/**
 * createCyberGlobe
 * A wireframe sphere for the contact section to pair with the glitch shader.
 */
export function createCyberGlobe(radius = 3) {
  // Faceted, slightly displaced globe so the hologram shader picks up edges.
  const geometry = new IcosahedronGeometry(radius, 6);
  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    const ripple =
      0.06 * Math.sin(nx * 10.0 + ny * 8.0 + nz * 6.0) +
      0.04 * Math.cos(nx * 6.0 - nz * 7.0 + ny * 3.5);

    const newLen = radius * (1 + ripple);
    pos.setXYZ(i, nx * newLen, ny * newLen, nz * newLen);
  }

  geometry.computeVertexNormals();
  return geometry;
}
