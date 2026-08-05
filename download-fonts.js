const fs = require('fs');
const https = require('https');
const path = require('path');

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Poppins:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

const fontsDir = path.join(__dirname, 'public', 'fonts');
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

https.get(GOOGLE_FONTS_URL, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
  let css = '';
  res.on('data', d => css += d);
  res.on('end', async () => {
    css = css.replace(/font-display:\s*swap/g, 'font-display: optional');
    const urlRegex = /url\((https:\/\/[^)]+)\)/g;
    let match;
    let newCss = css;
    let i = 0;
    const downloads = [];
    const urls = [];

    while ((match = urlRegex.exec(css)) !== null) {
      urls.push(match[1]);
    }

    for (const url of urls) {
      const filename = `font-${i++}.woff2`;
      const localPath = `/fonts/${filename}`;
      newCss = newCss.split(url).join(localPath);

      downloads.push(new Promise((resolve, reject) => {
        https.get(url, (r) => {
          const fileStream = fs.createWriteStream(path.join(fontsDir, filename));
          r.pipe(fileStream);
          fileStream.on('finish', () => { fileStream.close(); resolve(); });
        }).on('error', reject);
      }));
    }

    await Promise.all(downloads);

    const stylePath = path.join(__dirname, 'public', 'style.css');
    const existingStyle = fs.readFileSync(stylePath, 'utf8');
    const marker = '/* ─── 1. DESIGN TOKENS';
    const idx = existingStyle.indexOf(marker);
    if (idx === -1) {
      console.error('DESIGN TOKENS marker not found in style.css');
      process.exit(1);
    }
    const bannerStart = existingStyle.lastIndexOf('/* ═', idx);
    const cutAt = bannerStart !== -1 ? bannerStart : idx;
    fs.writeFileSync(stylePath, newCss.trim() + '\n\n' + existingStyle.slice(cutAt));
    console.log(`Fonts downloaded (${i} files: Playfair Display, Poppins, JetBrains Mono) and style.css updated.`);
  });
});
