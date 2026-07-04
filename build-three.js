const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const exportsList = [
  'ACESFilmicToneMapping', 'AmbientLight', 'BoxGeometry', 'CanvasTexture', 'Clock', 'Color', 'DoubleSide', 'DynamicDrawUsage', 'Euler', 'FogExp2', 'FrontSide', 'Group', 'InstancedBufferAttribute', 'InstancedMesh', 'Mesh', 'MeshBasicMaterial', 'MeshStandardMaterial', 'Object3D', 'PCFSoftShadowMap', 'PerspectiveCamera', 'PlaneGeometry', 'PointLight', 'SRGBColorSpace', 'Scene', 'ShaderMaterial', 'SphereGeometry', 'Sprite', 'SpriteMaterial', 'UniformsUtils', 'Vector2', 'Vector3', 'WebGLRenderer',
  'MathUtils' // Just in case, it's very commonly used
];

const entryContent = `export { ${exportsList.join(', ')} } from 'three';\n`;
fs.writeFileSync('three-exports.js', entryContent);

if (!fs.existsSync('public/js/vendor')) {
  fs.mkdirSync('public/js/vendor', { recursive: true });
}

esbuild.build({
  entryPoints: ['three-exports.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  outfile: 'public/js/vendor/three.js',
}).then(() => {
  console.log('Three.js bundled successfully.');
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
