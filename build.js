const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['public/js/main.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'esm',
  splitting: true, // code-split dynamic imports
  outdir: 'public/dist',
  target: ['es2020']
}).then(() => {
  console.log('Build completed successfully.');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
