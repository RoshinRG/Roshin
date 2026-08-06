# RGR Portfolio — Roshin R G

Vanilla JS SPA portfolio with a shared Three.js nexus-sphere background, BEM CSS, and PWA support.

**Live:** [roshinrg.dev](https://roshinrg.dev) · **Repo:** [RoshinRG/Roshin](https://github.com/RoshinRG/Roshin)

---

## Stack

| Layer | Choice |
|---|---|
| UI | Vanilla JS (ES modules), BEM CSS |
| 3D | Three.js — one shared glowing wireframe sphere |
| Build | esbuild (`npm run build` → `public/dist/`) |
| Server | Express (`npm start`) — static `public/` + optional `/api/contact` |
| PWA | Service Worker + `manifest.json` |

## Routes

| Path | Section |
|---|---|
| `/` | Home |
| `/about` | About |
| `/projects` | Projects |
| `/skills` | Skills |
| `/contact` | Contact |

Client router uses the History API. Reloading a deep link works via Express SPA fallback (and `404.html` / `_redirects` / `.htaccess` on static hosts).

---

## Quick start

```bash
npm install
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

| Script | What it does |
|---|---|
| `npm start` | Express on port 3000 |
| `npm run build` | Bundle `public/js/main.js` → `public/dist/` |
| `npm run dev` | Nodemon Express |
| `npm run serve` | Static `public/` only (no API) |
| `node download-fonts.js` | Re-download local woff2 fonts into `public/fonts/` |

---

## Project layout

```
├── server.js                 # Express: static + /api/contact + SPA fallback
├── build.js                  # esbuild + HTML modulepreload patch
├── download-fonts.js         # Optional font refresh tool
├── package.json
├── public/                   # ← deployed site root
│   ├── index.html            # SPA shell
│   ├── 404.html              # Deep-link fallback (GitHub Pages / static)
│   ├── style.css
│   ├── sw.js                 # Service worker
│   ├── manifest.json
│   ├── Roshin_RG_CV.pdf
│   ├── fonts/                # Self-hosted Playfair / Poppins / JetBrains Mono
│   ├── dist/                 # Built JS (generated)
│   └── js/
│       ├── main.js           # Router + boot
│       ├── animations.js     # Theme, menu, form, reveals
│       └── scenes/
│           └── nexus-sphere.js   # Shared Three.js background
└── .github/workflows/static.yml  # Build + deploy public/ to Pages
```

### What was removed as unused

| Removed | Why |
|---|---|
| Root `index.html` | Legacy shell; referenced missing `script.js`; site uses `public/` |
| `patch-html.js` | Theme/HTML patches already live in `build.js` |
| Unused `font-6`…`font-11`, `16–19`, `32–39` | Not referenced in `style.css` |
| Root `.htaccess` | Wrong rewrite target; replaced by `public/.htaccess` |

---

## Architecture notes

- **One WebGL scene** for every route: fixed `#bgCanvas` + `createNexusSphere()`.
- **Router** hides all sections except the active route (including on reload).
- **Three.js** loads via dynamic `import()` so the router chunk stays small.
- **Contact form** can use Formspree or `POST /api/contact` (set SMTP in `.env`).

Example `.env` for the contact API:

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
MAIL_TO=you@example.com
ALLOWED_ORIGIN=https://roshinrg.dev
```

---

## Deploy

### GitHub Pages (this repo)

Push to `main`. The workflow runs `npm ci && npm run build` and publishes **`public/`**.

### Express / Render / VPS

```bash
npm install --omit=dev
npm run build
npm start
```

Bind to `0.0.0.0:$PORT` in hosted environments (Render, etc.).

---

## Author

**Roshin R G** — Front-End Developer & SPA Architect  
Chennai, India · B.Tech AI & Data Science, Rajalakshmi Engineering College

---

MIT
