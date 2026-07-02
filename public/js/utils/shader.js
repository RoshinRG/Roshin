/**
 * shader.js
 * Custom GLSL shaders for arc reactor glow and hologram scan-line effects.
 */

import { Color, FrontSide, ShaderMaterial, UniformsUtils } from 'three';

/* ─────────────────────────────────────────────────────────
   CORE GLOW SHADER
   A pulsing, energy-sphere look for the geodesic core.
───────────────────────────────────────────────────────── */
export const coreGlowShader = {
  uniforms: {
    uTime:      { value: 0 },
    uColor:     { value: new Color(0xB76E79) }, // --rg-core
    uCoreColor: { value: new Color(0xF7EDE8) }, // --rg-pearl
    uIntensity: { value: 1.0 },
  },
  vertexShader: /* glsl */`
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal   = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      vUv       = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3  uColor;
    uniform vec3  uCoreColor;
    uniform float uIntensity;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      // Fresnel rim glow
      vec3  viewDir  = normalize(-vPosition);
      float fresnel  = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);

      // Pulsing core
      float pulse    = 0.5 + 0.5 * sin(uTime * 3.0);
      float coreMask = 1.0 - smoothstep(0.0, 0.5, length(vUv - 0.5) * 2.0);

      // Concentric rings
      float rings    = sin(length(vUv - 0.5) * 30.0 - uTime * 4.0) * 0.5 + 0.5;
      rings         *= 1.0 - length(vUv - 0.5) * 2.5;
      rings          = max(rings, 0.0);

      vec3  col      = mix(uColor, uCoreColor, coreMask * pulse);
      col           += uColor * fresnel * 0.8;
      col           += vec3(0.4, 0.8, 1.0) * rings * 0.3;

      float alpha    = (fresnel * 0.7 + coreMask * 0.8 + rings * 0.2) * uIntensity;

      gl_FragColor   = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `,
};

/* ─────────────────────────────────────────────────────────
   HOLOGRAM SHADER
   Blue-tinted scan-line effect for the contact section wireframe.
───────────────────────────────────────────────────────── */
export const hologramShader = {
  uniforms: {
    uTime:    { value: 0 },
    uColor:   { value: new Color(0xB76E79) }, // --rg-core
    uOpacity: { value: 0.35 },
  },
  vertexShader: /* glsl */`
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {
      vPosition   = position;
      vNormal     = normalize(normalMatrix * normal);
      vUv         = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3  uColor;
    uniform float uOpacity;

    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // Horizontal scan lines
      float line  = sin(vUv.y * 200.0 - uTime * 4.0);
      line        = smoothstep(0.3, 0.7, line) * 0.4;

      // Fresnel edge glow
      vec3  view  = normalize(vec3(0.0, 0.0, 1.0));
      float rim   = pow(1.0 - abs(dot(vNormal, view)), 1.8) * 0.6;

      // Static noise flicker
      float noise = rand(vUv + uTime * 0.1);
      float flicker = step(0.97, noise) * 0.3;

      vec3  col   = uColor;
      float alpha = (line + rim + flicker + 0.1) * uOpacity;

      gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.8));
    }
  `,
};

/* ─────────────────────────────────────────────────────────
   SCAN PULSE SHADER
   Radial energy glow for project cards and skill nodes.
───────────────────────────────────────────────────────── */
export const scanPulseShader = {
  uniforms: {
    uTime:  { value: 0 },
    uColor: { value: new Color(0xB76E79) }, // --rg-core
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3  uColor;
    varying vec2  vUv;

    void main() {
      vec2  uv    = vUv - 0.5;
      float dist  = length(uv);
      float pulse = 0.5 + 0.5 * sin(uTime * 5.0);
      float ring  = smoothstep(0.35, 0.3, dist) - smoothstep(0.3, 0.1, dist);
      float core  = (1.0 - smoothstep(0.0, 0.12, dist)) * pulse;

      float alpha = (ring * 0.7 + core * 0.9);
      gl_FragColor = vec4(uColor, alpha * 0.85);
    }
  `,
};

/* ─────────────────────────────────────────────────────────
   Helper: create a ShaderMaterial from a shader definition
───────────────────────────────────────────────────────── */
export function createShaderMaterial(shaderDef, extra = {}) {
  return new ShaderMaterial({
    uniforms:       UniformsUtils.clone(shaderDef.uniforms),
    vertexShader:   shaderDef.vertexShader,
    fragmentShader: shaderDef.fragmentShader,
    transparent:    true,
    depthWrite:     false,
    side:           FrontSide,
    ...extra,
  });
}
