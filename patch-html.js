/**
 * patch-html.js — applies all Lighthouse fixes to index.html and 404.html
 * Run once after restoring the originals; build.js will then re-inject modulepreloads.
 */
const fs = require('fs');

const THEME_SCRIPT = `  <!-- ⚡ Theme init — synchronous blocking script, MUST stay first in <head>.
       Reads localStorage and stamps data-theme on <html> before any CSS parses,
       so users with a saved "light" preference never see the dark-flash CLS hit. -->
  <script>
    (function () {
      var t = localStorage.getItem('rgr-theme');
      if (t === 'light' || t === 'dark') {
        document.documentElement.dataset.theme = t;
      }
      // After 2 RAFs (≈ first painted frame), add .theme-ready so the CSS
      // body transition is enabled — this ensures zero transition on initial load.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.documentElement.classList.add('theme-ready');
        });
      });
    })();
  <\/script>`;

['public/index.html', 'public/404.html'].forEach(function (file) {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  // 1. Add data-theme="dark" to <html> element (canonical default)
  html = html.replace(/<html\s+lang="en">/, '<html lang="en" data-theme="dark">');

  // 2. Remove data-theme="dark" from <body> so the <html> attr is the source of truth
  html = html.replace(/<body class="body" data-theme="dark">/, '<body class="body">');
  html = html.replace(/<body class="body" data-theme="light">/, '<body class="body">');

  // 3. Inject theme script immediately after <head> (before any other tag)
  //    Only inject if not already present
  if (!html.includes('rgr-theme')) {
    html = html.replace('<head>', '<head>\n' + THEME_SCRIPT);
  }

  fs.writeFileSync(file, html);
  console.log('Patched theme init into', file);
});

console.log('patch-html.js done.');
