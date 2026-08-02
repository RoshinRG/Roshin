# ⚡ RGR Portfolio — Terminal-themed SPA

> **"The best abstraction is the one you understand completely."**

A production-grade **Single-Page Application** portfolio built with **zero frameworks** — pure vanilla JavaScript, BEM CSS, and live Three.js/WebGL Cyberpunk animations across all five sections.

[![Live Demo](https://img.shields.io/badge/Live_Demo-roshinrg.github.io-d4af37?style=flat-square&logo=github)](https://roshinrg.github.io)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-100-brightgreen?style=flat-square&logo=googlechrome)](https://roshinrg.github.io)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](https://roshinrg.github.io)

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Live Demo](#-live-demo)
3. [Architecture](#-architecture)
4. [File Structure](#-file-structure)
5. [Tech Stack](#-tech-stack)
6. [Features](#-features)
7. [Local Development](#-local-development)
8. [Deployment](#-deployment)
9. [Personalisation Guide](#-personalisation-guide)
10. [Performance](#-performance)
11. [Accessibility](#-accessibility)
12. [PWA & Service Worker](#-pwa--service-worker)
13. [Optional Backend](#-optional-express-backend)
14. [Browser Support](#-browser-support)
15. [Author](#-author)

---

## 🎯 Project Overview

This portfolio is both a **showcase** and a **demonstration** of what's possible with deliberate, intentional vanilla JavaScript. No React, no Vue, no build tools — every event listener, every DOM query, every Three.js scene is hand-crafted.

### Design Goals

| Goal | Implementation |
|---|---|
| Zero frameworks | Vanilla JS ES Modules only |
| No build step | Direct `<script type="module">` in browser |
| 100 Lighthouse score | Optimised assets, Service Worker, semantic HTML |
| 60 FPS WebGL | `InstancedMesh`, frustum culling, RAF loop |
| Offline-capable | Cache-first Service Worker |
| Accessible | WCAG 2.1 AA, `inert`, semantic landmarks |

---

## 🌐 Live Demo

**→ [https://roshinrg.github.io](https://roshinrg.github.io)**

| Section | Route | 3D Scene |
|---|---|---|
| Hero | `/` | Cyber grid + data streams |
| About | `/about` | Armor assembly animation |
| Projects | `/projects` | Ambient particle field |
| Skills | `/skills` | Orbiting skill labels + repulsor hand |
| Contact | `/contact` | Hologram suit with scan-lines |

---

## 🏗️ Architecture

### SPA Router

The site uses a **custom history API router** — no library required:

```
URL change → history.pushState({ route }) → navigate(route)
  → Hide previous section
  → Lazy-init Three.js scene (first visit only)
  → Show new section
  → Fade transition overlay (280ms)
```

Key properties:
- **Lazy initialisation** — Three.js scenes are only created on first visit to that section
- **Pause/resume** — The animation RAF loop pauses when a section is hidden, resuming on return
- **Popstate** — Browser back/forward handled via the `popstate` event
- **Keyboard** — Arrow keys navigate between sections

### Three.js Scene System

All scenes extend a shared `IronManScene` base class:

```js
class IronManScene {
  init()           // Create geometry, lights, start RAF
  update(dt, t)    // Called every frame (deltaTime, elapsed)
  pause()          // Cancel RAF
  resume()         // Restart RAF
  dispose()        // Clean up GPU resources
}
```

### BEM CSS Methodology

Every class follows strict **Block__Element--Modifier** naming:

```css
.hero__stat-number           /* element */
.nav__link--active           /* modifier */
.skill-tag--accent           /* modifier */
.project-card__btn--primary  /* modifier */
```

---

## 📁 File Structure

```
RGR PORTFOLIO/
│
├── index.html               ← SPA shell (all 5 sections, hidden/shown by router)
├── style.css                ← Design system + BEM component styles (~1330 lines)
├── manifest.json            ← PWA manifest (theme, icons, display mode)
├── sw.js                    ← Service Worker (cache-first, offline fallback)
├── server.js                ← Optional Express backend (contact form + static)
├── package.json             ← npm config (only needed for optional backend)
├── README.md                ← This file
│
├── googlef5738759e2f6272f.html   ← Google Search Console verification
├── sitemap.xml                   ← XML sitemap for all 5 SPA routes
│
└── js/
    ├── main.js              ← SPA Router, boot sequence, SW registration
    ├── animations.js        ← Scroll reveal, contact form, theme, hamburger
    │
    ├── scenes/              ← One Three.js scene per portfolio section
    │   ├── shared.js        ← Procedural Cyberpunk data constructs geometry (shared)
    │   ├── hero.js          ← Hero: full suit + particle trail system
    │   ├── about.js         ← About: armor plate assembly animation
    │   ├── projects.js      ← Projects: ambient instanced particle field
    │   ├── skills.js        ← Skills: orbiting text sprites + repulsor hand
    │   └── contact.js       ← Contact: hologram suit + scan-line sweep
    │
    └── utils/               ← Shared utilities
        ├── three-setup.js   ← IronManScene base class + light helpers
        ├── shader.js        ← GLSL shaders (arc reactor, hologram, repulsor)
        ├── particle-system.js  ← InstancedMesh particle system
        └── loader.js        ← GLTF/GLB loader + DRACO + procedural fallback
```

---

## 🛠️ Tech Stack

### Core

| Technology | Version | Purpose |
|---|---|---|
| HTML5 | — | Semantic SPA shell |
| CSS3 | — | BEM design system, keyframe animations |
| JavaScript | ES2024 | SPA router, DOM, event handling |
| Three.js | 0.160.0 | WebGL 3D scenes |
| GLSL | — | Custom arc reactor, hologram, repulsor shaders |

### Browser APIs Used

| API | Used For |
|---|---|
| `history.pushState` | SPA routing without page reloads |
| `IntersectionObserver` | Scroll reveal animations |
| `ResizeObserver` | Canvas resize handling |
| `requestAnimationFrame` | 60 FPS animation loop |
| `InstancedMesh` | GPU-instanced particles (10,000+) |
| `Service Worker` | Offline caching + PWA |
| `localStorage` | Theme persistence (dark/light) |
| `HTMLElement.inert` | Accessible mobile menu focus trapping |

### CDN Dependencies (no npm required)

```html
<!-- Three.js via import map (in index.html) -->
"three":          "https://unpkg.com/three@0.160.0/build/three.module.js"
"three/addons/":  "https://unpkg.com/three@0.160.0/examples/jsm/"

<!-- Google Fonts -->
Syne (headings)  ·  Space Grotesk (body)  ·  Space Mono (monospace)
```

---

## ✨ Features

### 🎭 Five Distinct Three.js Scenes

- **Hero** — Procedural Cyberpunk data constructs (gold/red armor plates) with glowing arc reactor and trailing particles that follow cursor movement
- **About** — Armor assembly animation where plates orbit and lock into position; resets on click
- **Projects** — Ambient particle field with 3,000 InstancedMesh particles creating an electric atmosphere
- **Skills** — 18 skill labels rendered as CanvasTexture sprites orbiting at varying radii; a repulsor hand follows your mouse and pushes labels away on proximity
- **Contact** — Hologram Cyberpunk data constructs with real-time scan-line sweep, Fresnel edge glow, and random opacity flicker

### ⚡ Custom GLSL Shaders

| Shader | Effect |
|---|---|
| `arcReactorShader` | Pulsing concentric rings with blue glow |
| `hologramShader` | Scan-lines + noise + Fresnel edge glow + flicker |
| `repulsorShader` | Radial expanding rings with energy colour |

### 📱 Responsive & Mobile

- Breakpoints: **1024px**, **768px**, **480px**
- Reduced particle counts on mobile via `isMobile()` helper
- Hamburger menu with `inert` focus trapping
- Touch-friendly card interactions

### 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| Primary Gold | `#d4af37` | Main accent, headings, CTAs |
| Accent Cyan | `#00d9ff` | Expert skill tags, links |
| Hacker Green | `#00ff41` | Cyberpunk data constructs detail |
| Background | `#080808` | Page background |
| Surface | `#111111` | Cards, nav, form inputs |

### 🌗 Theme Toggle

Supports dark (default) and light modes. Preference persisted in `localStorage` under key `rgr-theme`.

### 🔍 SEO

- Semantic HTML5 landmarks
- Schema.org `Person` JSON-LD structured data
- Open Graph + Twitter Card meta tags
- `sitemap.xml` with all 5 routes
- Google Search Console verification file included

---

## 💻 Local Development

### Option 1 — Quickest (no install)

```bash
npx serve . --listen 3131 --single
# → http://localhost:3131
```

### Option 2 — VS Code Live Server

Install the **Live Server** extension → right-click `index.html` → **Open with Live Server**.

> ⚠️ Must serve from the project root for import maps and Service Worker scope to work correctly.

### Option 3 — Python

```bash
python -m http.server 3131
```

### Option 4 — Node.js Backend

```bash
npm install
npm run dev    # nodemon hot-reload
# → http://localhost:3000
```

### Environment Variables (backend only)

Create `.env` in the project root:

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
MAIL_TO=roshin.rg.2024.aids@rajalakshmi.edu.in
MAIL_FROM="RGR Portfolio <no-reply@roshinrg.dev>"
ALLOWED_ORIGIN=https://roshinrg.github.io
```

> For Gmail: enable 2FA → Google Account Security → create an **App Password** → use as `SMTP_PASS`.

---

## 🚀 Deployment

### GitHub Pages (Recommended — Free)

```bash
git add .
git commit -m "feat: Terminal-themed SPA portfolio"
git push origin main
```

Then: **Settings → Pages → Deploy from branch → main → / (root)**

Live at: `https://roshinrg.github.io`

> For true SPA routing on GitHub Pages, copy `index.html` to `404.html` — GitHub Pages serves `404.html` for unknown paths, which lets the client-side router take over.

```bash
copy index.html 404.html
```

### Netlify

Drop the folder at [app.netlify.com/drop](https://app.netlify.com/drop) and add a `_redirects` file:

```
/* /index.html 200
```

---

## 🎨 Personalisation Guide

### 1. Update Your Contact Details

In `index.html`, find and replace:

| Find | Replace With |
|---|---|
| `roshin.rg.2024.aids@rajalakshmi.edu.in` | Your email |
| `https://github.com/roshinrg` | Your GitHub |
| `https://roshinrg.github.io` | Your URL |
| `Roshin_RG_CV.docx` | Your resume filename |

### 2. Change Hero Text

```html
<!-- index.html ~line 116 -->
<p class="hero__eyebrow">
  Open to freelance &amp; internships · Chennai, India
</p>
<p class="hero__role">Front‑End Developer &amp; SPA Architect</p>
<p class="hero__tagline">Your tagline here.</p>
```

### 3. Add/Edit Project Cards

Copy this template inside `#sectionProjects → .projects__grid`:

```html
<article class="project-card reveal-item" data-project="N">
  <div class="project-card__repulsor" aria-hidden="true"></div>
  <div class="project-card__inner">
    <div class="project-card__header">
      <span class="project-card__tag">Tag1</span>
      <span class="project-card__tag">Tag2</span>
    </div>
    <h3 class="project-card__title">Project Name</h3>
    <p class="project-card__desc">Short description of the project.</p>
    <div class="project-card__footer">
      <a href="LIVE_URL" class="project-card__btn project-card__btn--primary"
         target="_blank" rel="noopener">Live Demo ↗</a>
      <a href="GITHUB_URL" class="project-card__btn project-card__btn--ghost"
         target="_blank" rel="noopener">GitHub</a>
    </div>
  </div>
</article>
```

### 4. Change Colour Scheme

All design tokens are CSS custom properties at the top of `style.css`:

```css
:root {
  --color-primary-gold:  #d4af37;   /* Main accent */
  --color-accent-cyan:   #00d9ff;   /* Secondary accent */
  --color-iron-red:      #00ff41;   /* Suit red */
  --color-bg-primary:    #080808;   /* Page background */
  --color-surface:       #111111;   /* Cards/inputs */
}
```

### 5. Use a Real GLTF Model

```js
// In any scene file:
import { modelLoader } from '../utils/loader.js';

// Inside init():
const suit = await modelLoader.load('/models/iron-man.glb');
this.scene.add(suit);
// Falls back to procedural suit automatically if file is missing
```

### 6. Connect the Contact Form

Get a free Formspree endpoint at [formspree.io](https://formspree.io) and update:

```html
<form id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID">
```

Or use the included Express backend with nodemailer (see [Optional Backend](#-optional-express-backend)).

### 7. Update the Sitemap

Edit `sitemap.xml` — replace `roshinrg.github.io` with your domain.

### 8. Update Schema.org Structured Data

Near the bottom of `index.html`, update the `<script type="application/ld+json">` block with your real name, email, location, education, and social links.

---

## 📊 Performance

### Targets & Strategy

| Metric | Target | Strategy |
|---|---|---|
| Lighthouse Performance | 100 | No render-blocking, deferred JS |
| WebGL Frame Rate | 60 FPS | InstancedMesh, RAF pause when hidden |
| First Contentful Paint | < 1.2s | Preconnect fonts, inline critical CSS |
| Largest Contentful Paint | < 2.5s | No layout shift, fixed canvas dims |
| Cumulative Layout Shift | 0 | CSS `aspect-ratio`, no late-loading assets |
| Time to Interactive | < 3s | Lazy Three.js init per section |

### Key Optimisations

- **`InstancedMesh`** — Single GPU draw call for all particles (up to 10,000 instances)
- **Lazy scene init** — Three.js context is only created when a section is first visited
- **RAF pause/resume** — Animation loops are stopped when sections are hidden
- **Mobile guard** — Halves particle count, disables cursor tracking on touch devices
- **CDN import map** — Three.js cached by browser between page loads
- **Service Worker** — Full offline capability after first load

---

## ♿ Accessibility

| Standard | Status |
|---|---|
| WCAG 2.1 Level AA | ✅ Compliant |
| Semantic HTML landmarks | ✅ `<header>`, `<nav>`, `<main>`, `<footer>` |
| Skip navigation link | ✅ `.skip-link` → `#main-content` |
| Keyboard navigation | ✅ Tab + Arrow keys between sections |
| Focus management | ✅ `inert` on closed mobile menu |
| Screen reader support | ✅ `aria-label` on all interactive elements |
| Colour contrast | ✅ Gold on black: 7.2:1 (exceeds AA 4.5:1) |
| Void element self-close | ✅ HTML5 compliant (no `<meta />`) |
| Redundant roles removed | ✅ No `role="main"` on `<main>` etc. |

---

## 🔧 PWA & Service Worker

### Manifest (`manifest.json`)

```json
{
  "name": "Roshin RG Portfolio",
  "short_name": "RGR",
  "display": "standalone",
  "theme_color": "#d4af37",
  "background_color": "#080808",
  "start_url": "/"
}
```

### Caching Strategy (`sw.js`)

| Event | Action |
|---|---|
| `install` | Pre-cache all 17 static assets individually |
| `activate` | Delete caches from previous `CACHE_NAME` versions |
| `fetch GET` | Cache-first for same-origin; skip CDN/Formspree/Fonts |
| Offline navigate | Return `index.html` as fallback |

To force a full cache refresh: bump `CACHE_NAME` in `sw.js`:
```js
const CACHE_NAME = 'rgr-portfolio-v2'; // increment version
```

---

## 🖥️ Optional Express Backend

`server.js` provides a self-hosted email alternative to Formspree:

### Endpoint

```
POST /api/contact
Body: { name, email, subject, message }

Success: 200 { ok: true, message: "Message sent successfully." }
Error:   400 { error: "Validation message" }
Error:   500 { error: "SMTP error" }
```

### Features

- Rate limited: **5 requests / 15 minutes / IP**
- Input validation (name ≥ 2 chars, valid email, message ≥ 10 chars)
- HTML email template with your branding
- CORS configured for your portfolio domain
- SPA fallback: all `GET *` routes serve `index.html`

### Setup

```bash
npm install
# Create .env (see Local Development)
npm start       # production
npm run dev     # development (nodemon)
```

Update `index.html` form action:
```html
<form action="/api/contact" method="POST" ...>
```

---

## 🌐 Browser Support

| Browser | Minimum | Notes |
|---|---|---|
| Chrome / Edge | 89+ | Full support |
| Firefox | 108+ | Full support |
| Safari | 16.4+ | Full support (`inert` since 15.5) |
| Mobile Chrome | 89+ | Auto reduced particles |
| Mobile Safari | 16.4+ | Full support |

> **Internet Explorer** — Not supported. This project requires CSS Custom Properties and WebGL 2.
> **Import Maps** — Older browsers without native import map support (e.g., Safari < 16.4) are supported via the included `es-module-shims` polyfill.

---

## 📁 Key Files Quick Reference

| File | Lines | Purpose |
|---|---|---|
| `index.html` | 638 | SPA shell — all 5 sections |
| `style.css` | ~1330 | Complete BEM design system |
| `js/main.js` | ~100 | Router, boot, SW registration |
| `js/animations.js` | ~200 | Scroll reveal, form, theme, menu |
| `js/scenes/hero.js` | ~200 | Hero 3D scene |
| `js/scenes/skills.js` | ~140 | Skills 3D scene |
| `js/utils/shader.js` | ~100 | GLSL shaders |
| `js/utils/three-setup.js` | ~80 | Base scene class |
| `sw.js` | ~70 | Service Worker |
| `server.js` | ~120 | Optional Express backend |

---

## 👤 Author

**Roshin R G** — Front-End Developer & SPA Architect

| | |
|---|---|
| 🎓 | B.Tech AI & Data Science — Rajalakshmi Engineering College, Chennai (2024–2028) |
| 💼 | Freelance Web Developer — RGR Nexus |
| 📧 | [roshin.rg.2024.aids@rajalakshmi.edu.in](mailto:roshin.rg.2024.aids@rajalakshmi.edu.in) |
| 🐙 | [github.com/roshinrg](https://github.com/roshinrg) |
| 🌐 | [roshinrg.github.io](https://roshinrg.github.io) |
| 📍 | Chennai, Tamil Nadu, India |

> *"I build high-performance single-page applications with vanilla JS, BEM CSS, and 3D web experiences."*

---

## 📄 License

MIT License © 2026 Roshin R G

Permission is hereby granted, free of charge, to any person obtaining a copy of this software to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

<div align="center">

**Built with ⚡ using Three.js + Vanilla JS · No frameworks · No build tools**

*RGR Nexus · Chennai, India · 2026*

</div>
