/**
 * skills.js
 * SkillsScene — 3D floating skill labels orbiting center.
 * Glowing core node at center follows mouse.
 */

import { CanvasTexture, Color, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SphereGeometry, Sprite, SpriteMaterial, Vector2 } from 'three';
import { BaseScene, createNeonKeyLight, createAmbientLight, isMobile } from '../utils/three-setup.js';
import { scanPulseShader, createShaderMaterial } from '../utils/shader.js';

const SKILLS = [
  'Three.js', 'WebGL', 'GLSL', 'JavaScript', 'TypeScript',
  'React', 'Next.js', 'CSS3', 'HTML5', 'PWA',
  'Web Workers', 'GSAP', 'Canvas 2D', 'Node.js', 'Git',
  'Performance', 'WebXR', 'Vite',
];

export class SkillsScene extends BaseScene {
  constructor() {
    super('skillsCanvas', { alpha: true });
    this._mouse = new Vector2(0, 0);
    this._target = new Vector2(0, 0);
  }

  init() {
    if (!this.canvas) return;

    createAmbientLight(this.scene);
    createNeonKeyLight(this.scene);

    /* ── Skill label sprites ─────────────────────────────── */
    this.labelGroup = new Group();
    this._labels    = [];

    SKILLS.forEach((name, i) => {
      const sprite = this._makeTextSprite(name);
      const angle  = (i / SKILLS.length) * Math.PI * 2;
      const r      = isMobile() ? 1.8 : 2.4;
      const layer  = Math.floor(i / 6);
      sprite.position.set(
        Math.cos(angle) * (r - layer * 0.5),
        Math.sin(angle) * (r - layer * 0.5) * 0.7,
        (Math.random() - 0.5) * 1.5,
      );
      sprite.userData = { angle, speed: 0.12 + Math.random() * 0.08, r: r - layer * 0.5 };
      this.labelGroup.add(sprite);
      this._labels.push(sprite);
    });
    this.scene.add(this.labelGroup);

    /* ── Central Core Node ───────────────────────────────── */
    this.coreNodeMesh = this._buildCoreNode();
    this.scene.add(this.coreNodeMesh);

    /* ── Camera ─────────────────────────────────────────── */
    this.camera.position.set(0, 0, 5);

    /* ── Mouse tracking ──────────────────────────────────── */
    this._onMove = (e) => {
      const container = this.canvas.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      this._mouse.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      this._mouse.y = -((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    };
    if (this.canvas.parentElement) {
      this.canvas.parentElement.addEventListener('mousemove', this._onMove);
    }
  }

  _makeTextSprite(text) {
    const canvas  = document.createElement('canvas');
    canvas.width  = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle   = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 64);

    ctx.font         = 'bold 22px "JetBrains Mono", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#C9878F'; // --rg-mid
    ctx.shadowColor  = 'rgba(183, 110, 121, 0.8)'; // --rg-core glow
    ctx.shadowBlur   = 8;
    ctx.fillText(text, 128, 32);

    const texture = new CanvasTexture(canvas);
    const mat     = new SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite:  false,
    });
    const sprite = new Sprite(mat);
    sprite.scale.set(1.4, 0.36, 1);
    sprite.userData.text = text;
    return sprite;
  }

  _buildCoreNode() {
    const group = new Group();
    group.name  = 'coreNode';

    // Outer glow plane using scanPulseShader
    const mat   = createShaderMaterial(scanPulseShader);
    const plane = new Mesh(new PlaneGeometry(1, 1), mat);
    plane.name  = 'coreGlow';
    group.userData.mat = mat;
    group.add(plane);

    // Inner glowing sphere — rose gold
    const sphereMat = new MeshStandardMaterial({ 
      color: 0x1A0A0E, 
      emissive: new Color(0xB76E79), // --rg-core
      emissiveIntensity: 0.8,
      roughness: 0.2 
    });
    const sphere = new Mesh(new SphereGeometry(0.15, 16, 16), sphereMat);
    sphere.position.z = 0.05;
    group.add(sphere);

    return group;
  }

  update(dt, elapsed) {
    if (!this._labels) return;

    /* ── Orbit labels ────────────────────────────────────── */
    this._labels.forEach((sprite, i) => {
      sprite.userData.angle += sprite.userData.speed * dt;
      const a = sprite.userData.angle;
      const r = sprite.userData.r;
      sprite.position.x = Math.cos(a) * r;
      sprite.position.y = Math.sin(a) * r * 0.7;

      // Push away from mouse cursor (within canvas space)
      const dx = sprite.position.x - this._target.x * 2.5;
      const dy = sprite.position.y - this._target.y * 2.5;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 1.2) {
        const push = (1.2 - d) * 0.6;
        sprite.position.x += (dx / d) * push;
        sprite.position.y += (dy / d) * push;
      }

      // Glow pulse on proximity — rose gold hue
      const proximity = Math.max(0, 1 - d / 1.5);
      const m = sprite.material;
      m.opacity = 0.7 + proximity * 0.3;
      m.color?.setHSL(0.97, 0.7, 0.6 + proximity * 0.2); // rose gold hue
    });

    /* ── Smooth mouse follow for core node ───────────────── */
    this._target.x += (this._mouse.x - this._target.x) * 0.06;
    this._target.y += (this._mouse.y - this._target.y) * 0.06;
    this.coreNodeMesh.position.set(this._target.x * 2.5, this._target.y * 2.5, 0.2);

    /* ── Core Node shader time ───────────────────────────── */
    if (this.coreNodeMesh.userData.mat) {
      this.coreNodeMesh.userData.mat.uniforms.uTime.value = elapsed;
    }

    /* ── Slowly rotate label group ───────────────────────── */
    this.labelGroup.rotation.z = Math.sin(elapsed * 0.1) * 0.05;
  }

  dispose() {
    if (this._onMove && this.canvas.parentElement) {
      this.canvas.parentElement.removeEventListener('mousemove', this._onMove);
    }
    this._labels.forEach(s => { s.material.map?.dispose(); s.material.dispose(); });
    super.dispose();
  }
}
