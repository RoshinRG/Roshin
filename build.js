const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  try {
    const result = await esbuild.build({
      entryPoints: ['public/js/main.js'],
      bundle: true,
      minify: true,
      sourcemap: true,
      format: 'esm',
      splitting: true,
      outdir: 'public/dist',
      target: ['es2020'],
      metafile: true,
    });

    // Priority 3 & 6: Module Preloading to fix Waterfall
    const meta = result.metafile;
    const outputs = Object.keys(meta.outputs);
    
    // Helper to recursively find all chunk dependencies
    function getDependencies(entryFile, deps = new Set()) {
      if (!meta.outputs[entryFile]) return deps;
      meta.outputs[entryFile].imports.forEach(imp => {
        if (imp.kind === 'import-statement' && imp.path.endsWith('.js')) {
          deps.add(imp.path);
          getDependencies(imp.path, deps);
        }
      });
      return deps;
    }

    // Find main and hero chunks
    const mainChunk = outputs.find(o => o.endsWith('main.js') && !o.endsWith('.map'));
    const heroChunk = outputs.find(o => o.includes('/hero-') && !o.endsWith('.map'));
    
    const preloads = new Set();
    if (mainChunk) getDependencies(mainChunk, preloads);
    if (heroChunk) {
      preloads.add(heroChunk);
      getDependencies(heroChunk, preloads);
    }

    const animationsChunk = outputs.find(o => o.includes('/animations-') && !o.endsWith('.map'));
    if (animationsChunk) {
      preloads.add(animationsChunk);
      getDependencies(animationsChunk, preloads);
    }

    // Add renderer manually because it's a dynamic import from main.js but critical for hero
    const rendererChunk = outputs.find(o => o.includes('/renderer-singleton-') && !o.endsWith('.map'));
    if (rendererChunk) {
      preloads.add(rendererChunk);
      getDependencies(rendererChunk, preloads);
    }

    const preloadHtml = Array.from(preloads)
      .filter(p => p.endsWith('.js'))
      .map(p => `<link rel="modulepreload" href="/${p.replace('public/', '')}">`)
      .join('\n  ');

    // Inject into HTML files
    ['public/index.html', 'public/404.html'].forEach(file => {
      let html = fs.readFileSync(file, 'utf8');
      
      // Remove old modulepreloads if they exist
      html = html.replace(/<link rel="modulepreload" href="\/dist\/.*?">\s*/g, '');
      
      // Inject new ones right before </head>
      html = html.replace('</head>', `  ${preloadHtml}\n</head>`);
      
      fs.writeFileSync(file, html);
      console.log(`Injected modulepreloads into ${file}`);
    });

    console.log('Build completed successfully.');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();
