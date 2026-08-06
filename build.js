const esbuild = require('esbuild');
const fs = require('fs');

const THEME_SCRIPT = [
  '  <!-- Theme init -->',
  '  <script>',
  '    (function () {',
  "      var t = localStorage.getItem('rgr-theme');",
  "      if (t === 'light' || t === 'dark') {",
  '        document.documentElement.dataset.theme = t;',
  '      }',
  '      requestAnimationFrame(function () {',
  '        requestAnimationFrame(function () {',
  "          document.documentElement.classList.add('theme-ready');",
  '        });',
  '      });',
  '    })();',
  '  <\/script>',
].join('\n');

function normalizeBasePath(raw) {
  if (!raw) return '';
  let base = String(raw).trim();
  if (!base || base === '/') return '';
  if (!base.startsWith('/')) base = '/' + base;
  return base.replace(/\/+$/, '');
}

const BASE_PATH = normalizeBasePath(process.env.BASE_PATH || '');

function applyBaseToHtml(html) {
  if (!BASE_PATH) return html;
  const skip = BASE_PATH.replace(/^\//, ''); // e.g. "Roshin"
  const absAttr = new RegExp('(href|src)="/(?!' + skip + '/)', 'g');
  const absUrl = new RegExp('url\\(/(?!' + skip + '/)', 'g');
  html = html.replace(absAttr, '$1="' + BASE_PATH + '/');
  html = html.replace(absUrl, 'url(' + BASE_PATH + '/');
  html = html.replace(
    /content="https:\/\/roshinrg\.dev\//g,
    'content="https://roshinrg.github.io' + BASE_PATH + '/'
  );
  return html;
}

function applyBaseToCss(css) {
  if (!BASE_PATH) return css;
  const skip = BASE_PATH.replace(/^\//, '');
  const absUrl = new RegExp('url\\(/(?!' + skip + '/)', 'g');
  return css.replace(absUrl, 'url(' + BASE_PATH + '/');
}

async function build() {
  try {
    if (BASE_PATH) console.log('Building with BASE_PATH=' + BASE_PATH);

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
      define: {
        __BASE_PATH__: JSON.stringify(BASE_PATH),
      },
    });

    const meta = result.metafile;
    const outputs = Object.keys(meta.outputs);

    function getDependencies(entryFile, deps) {
      deps = deps || new Set();
      if (!meta.outputs[entryFile]) return deps;
      meta.outputs[entryFile].imports.forEach(function (imp) {
        if (imp.kind === 'import-statement' && imp.path.endsWith('.js')) {
          deps.add(imp.path);
          getDependencies(imp.path, deps);
        }
      });
      return deps;
    }

    const MAX_PRELOAD_BYTES = 10000;
    const preloads = new Set();
    const mainChunk = outputs.find(function (o) {
      return o.endsWith('main.js') && !o.endsWith('.map');
    });
    if (mainChunk) getDependencies(mainChunk, preloads);

    const preloadHtml = Array.from(preloads)
      .filter(function (p) {
        if (!p.endsWith('.js')) return false;
        const info = meta.outputs[p];
        if (info && info.bytes > MAX_PRELOAD_BYTES) {
          console.log('  Skipped modulepreload for ' + p);
          return false;
        }
        return true;
      })
      .map(function (p) {
        return '  <link rel="modulepreload" href="/' + p.replace(/^public\//, '') + '">';
      })
      .join('\n');

    if (BASE_PATH) {
      const cssPath = 'public/style.css';
      fs.writeFileSync(cssPath, applyBaseToCss(fs.readFileSync(cssPath, 'utf8')));
      console.log('Prefixed font URLs in public/style.css');
    }

    ['public/index.html', 'public/404.html'].forEach(function (file) {
      let html = fs.readFileSync(file, 'utf8');

      html = html.replace(/<html lang="en"(?! data-theme)>/, '<html lang="en" data-theme="dark">');
      html = html.replace(/<body class="body" data-theme="[^"]*">/, '<body class="body">');

      if (!html.includes('rgr-theme')) {
        html = html.replace('<head>', '<head>\n' + THEME_SCRIPT);
      }

      html = html.replace(
        /<link rel="preload" href="style\.css" as="style" onload="[^"]*">/,
        '<link rel="stylesheet" href="style.css">'
      );
      html = html.replace(/<noscript><link rel="stylesheet" href="style\.css"><\/noscript>\s*/g, '');

      html = html.replace(
        /<link rel="preload" as="font" type="font\/woff2" href="\/fonts\/font-15\.woff2" crossorigin>/,
        '<link rel="preload" as="font" type="font/woff2" href="/fonts/font-15.woff2" crossorigin fetchpriority="high">'
      );

      html = html.replace(/<link rel="modulepreload" href="[^"]*\/dist\/[^"]*">\s*/g, '');
      html = html.replace('</head>', preloadHtml + '\n</head>');

      html = html.replace(
        /<script type="module" src="[^"]*\/dist\/main\.js"(?: defer)?><\/script>/,
        '<script type="module" src="/dist/main.js" fetchpriority="high"></script>'
      );

      html = applyBaseToHtml(html);

      fs.writeFileSync(file, html);
      console.log('Patched ' + file);
    });

    console.log('Build completed successfully.');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();
