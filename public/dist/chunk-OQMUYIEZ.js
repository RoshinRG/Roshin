import{a as i,i as o,v as r,w as a}from"./chunk-XC6Q6NIR.js";var l={uniforms:{uTime:{value:0},uColor:{value:new o(12021369)},uCoreColor:{value:new o(16248296)},uIntensity:{value:1}},vertexShader:`
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal   = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      vUv       = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
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
  `},t={uniforms:{uTime:{value:0},uColor:{value:new o(12021369)},uOpacity:{value:.35}},vertexShader:`
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {
      vPosition   = position;
      vNormal     = normalize(normalMatrix * normal);
      vUv         = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
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
  `},s={uniforms:{uTime:{value:0},uColor:{value:new o(12021369)}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
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
  `};function m(e,n={}){return new a({uniforms:r.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,transparent:!0,depthWrite:!1,side:i,...n})}export{t as a,s as b,m as c};
//# sourceMappingURL=chunk-OQMUYIEZ.js.map
