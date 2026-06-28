/**
 * shared.js
 * Procedural Iron Man suit geometry and shared scene builders.
 * Builds a recognizable low-poly Iron Man silhouette from primitives.
 */

import * as THREE from 'three';
import { isMobile } from '../utils/three-setup.js';
import { arcReactorShader, createShaderMaterial } from '../utils/shader.js';

/* ─────────────────────────────────────────────────────────
   IRON MAN SUIT — Procedural Geometry
   Assembled from BoxGeometry + CylinderGeometry + SphereGeometry
───────────────────────────────────────────────────────── */
export function buildIronManSuit(options = {}) {
  const group = new THREE.Group();
  group.name  = 'IronManSuit';

  const {
    redColor  = 0xcc2200,
    goldColor = 0xd4af37,
    detail    = isMobile() ? 0 : 1,
  } = options;

  /* ── Materials ──────────────────────────────────────────── */
  const matRed = new THREE.MeshPhongMaterial({
    color:     redColor,
    shininess: 120,
    specular:  new THREE.Color(0xffd700),
    emissive:  new THREE.Color(0x220000),
  });

  const matGold = new THREE.MeshPhongMaterial({
    color:     goldColor,
    shininess: 200,
    specular:  new THREE.Color(0xffffff),
    emissive:  new THREE.Color(0x1a0f00),
  });

  const matDark = new THREE.MeshPhongMaterial({
    color:    0x111111,
    shininess: 60,
  });

  /* ── Helper: add box part ───────────────────────────────── */
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      mat
    );
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };

  const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, detail ? 12 : 8),
      mat
    );
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };

  const sph = (r, mat, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, detail ? 16 : 10, detail ? 12 : 8),
      mat
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };

  /* ── HEAD ───────────────────────────────────────────────── */
  const head = new THREE.Group();
  head.name  = 'head';
  // Helmet shell
  const helmetBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.0, 0.85),
    matRed
  );
  helmetBase.castShadow = true;
  head.add(helmetBase);

  // Visor slit
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.18, 0.1),
    new THREE.MeshPhongMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.6 })
  );
  visor.position.set(0, 0.1, 0.45);
  visor.name = 'visor';
  head.add(visor);

  // Faceplate lower
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.35, 0.92),
    matGold
  );
  face.position.set(0, -0.28, 0);
  head.add(face);

  head.position.set(0, 1.55, 0);
  group.add(head);
  group.userData.head = head;

  /* ── NECK ─────────────────────────────────────────────── */
  cyl(0.22, 0.25, 0.25, matDark, 0, 1.0, 0);

  /* ── TORSO ──────────────────────────────────────────────── */
  // Chest
  const chest = box(1.4, 1.1, 0.85, matRed, 0, 0.3, 0);
  chest.name  = 'chest';

  // Chest plate gold trim
  box(1.3, 0.08, 0.87, matGold, 0, 0.85, 0);

  // Abs / waist
  box(1.2, 0.5, 0.75, matGold, 0, -0.3, 0);

  // Hip ridge
  box(1.35, 0.15, 0.8, matRed, 0, -0.58, 0);

  /* ── ARC REACTOR ────────────────────────────────────────── */
  const arcGroup = new THREE.Group();
  arcGroup.name  = 'arcReactor';

  const arcOuter = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, detail ? 24 : 16),
    new THREE.MeshPhongMaterial({ color: 0x333333, shininess: 200 })
  );
  arcOuter.position.z = 0.43;

  const arcMat = createShaderMaterial(arcReactorShader);
  const arcInner = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, detail ? 24 : 16),
    arcMat
  );
  arcInner.position.z = 0.44;
  arcInner.name = 'arcReactorGlow';

  arcGroup.add(arcOuter, arcInner);
  arcGroup.position.set(0, 0.35, 0);
  group.add(arcGroup);
  group.userData.arcReactor = arcGroup;
  group.userData.arcMat     = arcMat;

  /* ── SHOULDERS ──────────────────────────────────────────── */
  [-1, 1].forEach(side => {
    const shoulder = new THREE.Group();
    // Pauldron
    sph(0.38, matRed, side * 0.9, 0.7, 0);
    // Upper arm attachment
    cyl(0.22, 0.24, 0.3, matGold, side * 0.88, 0.3, 0, 0, 0, Math.PI / 2);
    // Gold trim ring
    cyl(0.28, 0.28, 0.06, matGold, side * 0.9, 0.75, 0, 0, 0, Math.PI / 2);
    group.add(shoulder);
  });

  /* ── ARMS ───────────────────────────────────────────────── */
  [-1, 1].forEach(side => {
    const x = side * 0.88;
    // Upper arm
    cyl(0.22, 0.2, 0.55, matRed,  x, 0.1, 0,  0, 0, Math.PI / 2);
    // Elbow
    sph(0.2,  matGold, x, -0.18, 0);
    // Forearm
    cyl(0.2,  0.17, 0.5, matRed,  x, -0.48, 0, 0, 0, Math.PI / 2);
    // Wrist
    cyl(0.18, 0.16, 0.12, matGold, x, -0.76, 0, 0, 0, Math.PI / 2);
    // Hand / gauntlet
    box(0.3, 0.22, 0.32, matRed, x, -0.92, 0);
    // Repulsor on palm
    const repulsorMat = new THREE.MeshPhongMaterial({
      color: 0x00d9ff,
      emissive: 0x00d9ff,
      emissiveIntensity: 0.5,
    });
    const repulsor = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 10),
      repulsorMat
    );
    repulsor.position.set(x, -0.92, side * 0.17);
    repulsor.rotation.y = side > 0 ? 0 : Math.PI;
    repulsor.name = 'repulsor_' + (side > 0 ? 'r' : 'l');
    group.add(repulsor);
  });

  /* ── LEGS ───────────────────────────────────────────────── */
  [-1, 1].forEach(side => {
    const x = side * 0.35;
    // Thigh
    cyl(0.28, 0.25, 0.65, matRed,  x, -1.05, 0);
    // Knee
    sph(0.25, matGold, x, -1.43, 0);
    // Shin
    cyl(0.24, 0.2,  0.65, matRed,  x, -1.80, 0);
    // Boot
    box(0.42, 0.22, 0.55, matRed,  x, -2.18, 0.05);
    // Boot thruster (bottom)
    const thruster = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 10),
      new THREE.MeshPhongMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.3 })
    );
    thruster.position.set(x, -2.3, 0.05);
    thruster.rotation.x = Math.PI / 2;
    group.add(thruster);
  });

  /* ── Back thruster ───────────────────────────────────────── */
  cyl(0.18, 0.22, 0.4, matDark, 0, 0.2, -0.5);

  /* ── Final positioning ───────────────────────────────────── */
  group.scale.setScalar(0.7);
  group.position.y = 0.3;

  return group;
}

/* ─────────────────────────────────────────────────────────
   Build a minimal "armor plate" for the About assembly scene.
───────────────────────────────────────────────────────── */
export function buildArmorPlates() {
  const plates = [];
  const matRed = new THREE.MeshPhongMaterial({
    color: 0xcc2200, shininess: 120, specular: new THREE.Color(0xffd700),
  });
  const matGold = new THREE.MeshPhongMaterial({
    color: 0xd4af37, shininess: 200, specular: new THREE.Color(0xffffff),
  });

  const defs = [
    // [w, h, d, mat, targetX, targetY, targetZ]
    [0.9, 1.0, 0.85, matRed,  0,      1.08, 0    ],   // head
    [1.4, 1.1, 0.85, matRed,  0,      0.21, 0    ],   // chest
    [0.75,0.5, 0.75, matGold, 0,     -0.21, 0    ],   // abs
    [0.7, 0.65, 0.55, matRed, -0.62,  0.07, 0    ],   // L upper arm
    [0.7, 0.65, 0.55, matRed,  0.62,  0.07, 0    ],   // R upper arm
    [0.7, 0.65, 0.55, matRed, -0.62, -0.34, 0    ],   // L forearm
    [0.7, 0.65, 0.55, matRed,  0.62, -0.34, 0    ],   // R forearm
    [0.55,0.65, 0.5, matRed, -0.25, -0.75, 0    ],   // L thigh
    [0.55,0.65, 0.5, matRed,  0.25, -0.75, 0    ],   // R thigh
    [0.45,0.55, 0.45, matRed,-0.25, -1.30, 0    ],   // L shin
    [0.45,0.55, 0.45, matRed, 0.25, -1.30, 0    ],   // R shin
  ];

  defs.forEach(([w, h, d, mat, tx, ty, tz], i) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.clone());
    mesh.castShadow = true;
    // Scattered start position
    mesh.position.set(
      tx + (Math.random() - 0.5) * 5,
      ty + (Math.random() - 0.5) * 5,
      tz + (Math.random() - 0.5) * 3,
    );
    mesh.userData.target = new THREE.Vector3(tx * 0.7, ty * 0.7, tz);
    mesh.userData.delay  = i * 0.12;
    plates.push(mesh);
  });

  return plates;
}
