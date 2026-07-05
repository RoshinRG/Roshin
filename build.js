const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

/* ── Theme-init script injected into <head> on every build ─────────────── */
const THEME_SCRIPT = [
  '  <!-- \u26a1 Theme init \u2014 synchronous blocking script, MUST stay first in <head>.',
  '       Reads localStorage and stamps data-theme on <html> before any CSS parses,',
  '       so users with a saved "light" preference never see a dark-flash CLS hit. -->',
  '  <script>',
  '    (function () {',
  "      var t = localStorage.getItem('rgr-theme');",
  "      if (t === 'light' || t === 'dark') {",
  '        document.documentElement.dataset.theme = t;',
  '      }',
  '      // After 2 RAFs (first painted frame), add .theme-ready so the CSS',
  '      // body transition is enabled \u2014 ensures zero layout-shifting transition on load.',
  '      requestAnimationFrame(function () {',
  '        requestAnimationFrame(function () {',
  "          document.documentElement.classList.add('theme-ready');",
  '        });',
  '      });',
  '    })();',
  '  <\/script>',
].join('\n');

async function build() {
  try {
    // \u2500\u2500 Clean dist before building to remove stale hashed chunks \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    if (fs.existsSync('public/dist')) {
      fs.rmSync('public/dist', { recursive: true, force: true });
      console.log('Cleaned public/dist');
    }

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

    // \u2500\u2500 Build modulepreload list from metafile \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const meta = result.metafile;
    const outputs = Object.keys(meta.outputs);

    // Helper to recursively find all static-import chunk dependencies
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

    // Gather preloads: main deps + hero scene + animations + renderer
    const preloads = new Set();
    const mainChunk = outputs.find(o => o.endsWith('main.js') && !o.endsWith('.map'));
    if (mainChunk) getDependencies(mainChunk, preloads);

    const heroChunk = outputs.find(o => o.includes('/hero-') && !o.endsWith('.map'));
    if (heroChunk) { preloads.add(heroChunk); getDependencies(heroChunk, preloads); }

    const animationsChunk = outputs.find(o => o.includes('/animations-') && !o.endsWith('.map'));
    if (animationsChunk) { preloads.add(animationsChunk); getDependencies(animationsChunk, preloads); }

    const rendererChunk = outputs.find(o => o.includes('/renderer-singleton-') && !o.endsWith('.map'));
    if (rendererChunk) { preloads.add(rendererChunk); getDependencies(rendererChunk, preloads); }

    const preloadHtml = Array.from(preloads)
      .filter(p => p.endsWith('.js'))
      .map(p => `  <link rel="modulepreload" href="/${p.replace('public/', '')}">`)
      .join('\n');

    // ── Patch HTML files ──────────────────────────────────────────────────
    ['public/index.html', 'public/404.html'].forEach(file => {
      let html = fs.readFileSync(file, 'utf8');

      // 1. Ensure <html> has data-theme="dark" (synchronous default)
      html = html.replace(/<html lang="en"(?! data-theme)>/, '<html lang="en" data-theme="dark">');

      // 2. Remove data-theme from <body> — <html> is the single source of truth
      html = html.replace(/<body class="body" data-theme="[^"]*">/, '<body class="body">');

      // 3. Inject theme blocking script after <head> (idempotent)
      if (!html.includes('rgr-theme')) {
        html = html.replace('<head>', '<head>\n' + THEME_SCRIPT);
      }

      // 4. Fix CSS loading: use synchronous <link rel="stylesheet"> instead of the
      //    async preload+onload trick. The async trick hides the hero content behind
      //    a CSS gap on slow mobile CPUs, delaying LCP by 3-4 seconds.
      //    The CSS is still preloaded (fetch priority is high), but now it blocks
      //    rendering correctly so opacity:1 hero text is painted immediately.
      html = html.replace(
        /<link rel="preload" href="style\.css" as="style" onload="[^"]*">/,
        '<link rel="stylesheet" href="style.css">'
      );
      // Remove the noscript fallback (no longer needed with sync load)
      html = html.replace(/<noscript><link rel="stylesheet" href="style\.css"><\/noscript>\s*/g, '');

      // 5. Ensure font-9.woff2 (Cormorant Garamond latin, the LCP font) has fetchpriority=high
      html = html.replace(
        /<link rel="preload" as="font" type="font\/woff2" href="\/fonts\/font-9\.woff2" crossorigin>/,
        '<link rel="preload" as="font" type="font/woff2" href="/fonts/font-9.woff2" crossorigin fetchpriority="high">'
      );

      // 6. Replace modulepreloads (remove old, inject fresh hashed filenames)
      html = html.replace(/<link rel="modulepreload" href="\/dist\/.*?">\s*/g, '');
      html = html.replace('</head>', `${preloadHtml}\n</head>`);

      fs.writeFileSync(file, html);
      console.log(`Patched and injected modulepreloads into ${file}`);
    });

    console.log('Build completed successfully.');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();
