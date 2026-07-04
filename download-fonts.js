const fs = require('fs');
const https = require('https');
const path = require('path');

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

const fontsDir = path.join(__dirname, 'public', 'fonts');
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

https.get(GOOGLE_FONTS_URL, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
  let css = '';
  res.on('data', d => css += d);
  res.on('end', async () => {
    const urlRegex = /url\((https:\/\/[^)]+)\)/g;
    let match;
    let newCss = css;
    let i = 0;
    const downloads = [];
    
    while ((match = urlRegex.exec(css)) !== null) {
      const url = match[1];
      const filename = `font-${i++}.woff2`;
      const localPath = `/fonts/${filename}`;
      newCss = newCss.replace(url, localPath);
      
      downloads.push(new Promise((resolve, reject) => {
        https.get(url, (res) => {
          const fileStream = fs.createWriteStream(path.join(fontsDir, filename));
          res.pipe(fileStream);
          fileStream.on('finish', () => { fileStream.close(); resolve(); });
        }).on('error', reject);
      }));
    }
    
    await Promise.all(downloads);
    
    const stylePath = path.join(__dirname, 'public', 'style.css');
    const existingStyle = fs.readFileSync(stylePath, 'utf8');
    fs.writeFileSync(stylePath, newCss + '\n\n' + existingStyle);
    console.log('Fonts downloaded and style.css updated.');
  });
});
