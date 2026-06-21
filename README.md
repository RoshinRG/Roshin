<p align="center">
  <strong>⬡ RRG.</strong>
</p>

<h1 align="center">Roshin R G — Portfolio</h1>

<p align="center">
  <em>Front-End Developer &amp; SPA Architect</em><br>
  A dark-luxury, single-page portfolio built with <strong>zero framework dependencies</strong> — pure Vanilla JS, Three.js WebGL, and BEM CSS.
</p>

<p align="center">
  <a href="https://roshinrg.github.io"><strong>🌐 Live Site</strong></a> · 
  <a href="https://github.com/roshinrg"><strong>GitHub</strong></a> · 
  <a href="mailto:roshin.rg.2024.aids@rajalakshmi.edu.in"><strong>Email</strong></a>
</p>

---

## ✨ Highlights

| Feature | Details |
|---|---|
| **Architecture** | Single Page Application (SPA) with hash-free client-side routing |
| **3D Scenes** | Four WebGL canvases powered by Three.js (Hero, Avatar, Skills, Contact) |
| **Styling** | 35 KB of hand-written BEM CSS — no Tailwind, no preprocessors |
| **Contact Form** | Google Sheets integration via Apps Script (no backend DB needed) |
| **Server** | Express.js with security headers, SPA fallback, and contact API |
| **SEO** | Schema.org JSON-LD, Open Graph, Twitter Cards, sitemap.xml |
| **Accessibility** | ARIA attributes, keyboard navigation (arrow keys), semantic HTML5 |
| **Performance** | Lazy scene initialization, `IntersectionObserver` reveals, tab-pause rendering |

---

## 📂 Project Structure

```
RGR PORTFOLIO/
│
├── index.html              # Main SPA shell — all 5 sections in one file
├── style.css               # Complete BEM design system (dark luxury theme)
├── script.js               # SPA router, Three.js scenes, all interactions
├── server.js               # Express server (static + API + SPA fallback)
│
├── google-apps-script.js   # Google Apps Script for Sheets contact form
├── Roshin_RG_CV.docx       # Downloadable resume
│
├── sitemap.xml             # SEO sitemap
├── robots.txt              # Crawler directives
│
├── package.json            # Node.js project config
├── package-lock.json       # Locked dependency tree
└── README.md               # ← You are here
```

---

## 🛠️ Tech Stack

### Front-End
- **Vanilla JavaScript (ES6+)** — No React, No Vue, No Angular
- **Three.js r134** — WebGL 3D scenes (CDN loaded with `defer`)
- **BEM CSS** — Scalable, conflict-free CSS methodology
- **Google Fonts** — Space Grotesk, Space Mono, Syne

### Back-End
- **Node.js** (≥ 18.0.0)
- **Express.js** `^4.18.2` — Static serving, API endpoint, SPA fallback

### Integrations
- **Google Apps Script** — Contact form → Google Sheets pipeline
- **Schema.org JSON-LD** — Structured data for search engines

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18.0.0
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/roshinrg/RGR-Portfolio.git
cd RGR-Portfolio

# Install dependencies
npm install
```

### Run Locally

```bash
# Start the server
npm start

# Or use the dev script (identical)
npm run dev
```

The server starts on **http://localhost:3000** by default.

| Endpoint | Description |
|---|---|
| `http://localhost:3000` | Main portfolio |
| `http://localhost:3000/models` | 3D Models section |
| `http://localhost:3000/api/contact` | Contact form API (POST) |

> **Tip:** Set a custom port with `PORT=8080 npm start`

### Run with Live Server (Hot Reload)

For front-end development with automatic browser refresh on file changes:

```bash
# Install live-server globally (one-time)
npm install -g live-server

# Start with hot reload
live-server --port=3000
```

> **Note:** `live-server` is ideal for rapid front-end iteration — it auto-reloads the browser on every save. Use the Express server (`npm start`) when you need the `/api/contact` endpoint or server-side features.

---

## 🏗️ Architecture

### SPA Router

The portfolio uses a custom hash-free SPA router in [`script.js`](script.js). All five sections exist in the DOM simultaneously — the router toggles `section--active` classes with a smooth page-transition overlay.

```
hero → about → projects → skills → contact
```

Navigation is bound to all `[data-section]` links, including the navbar, CTAs, mobile menu, and footer.

### Three.js Scenes

Four independent WebGL scenes are managed via the `state.scenes` registry:

| Scene | Canvas ID | Trigger | Description |
|---|---|---|---|
| **Hero** | `heroCanvas` | Page load | Icosahedron wireframe + 2000-particle field with mouse repulsion |
| **Avatar** | `avatarCanvas` | Page load | Torus knot with gold emissive wireframe overlay |
| **Skills** | `skillsCanvas` | Lazy (on navigate) | Floating sprite labels with sine-wave bobbing |
| **Contact** | `contactCanvas` | Lazy (on navigate) | Rotating grid plane with gold accent lighting |

All scenes share:
- `requestAnimationFrame` render loops
- Debounced resize handlers
- Tab-visibility pause (native RAF behavior)
- Mouse-parallax via normalized cursor coordinates

### Custom Cursor

A dual-element cursor system:
- **Dot** — instant position tracking via `mousemove`
- **Ring** — smoothly follows via `lerp()` in its own RAF loop
- **Hover detection** — expands on interactive elements (`a`, `button`, `.project-card`, etc.)

---

## 📧 Contact Form Setup

The contact form supports **two backends** simultaneously:

### 1. Google Sheets (Primary — Production)

Form submissions are sent to a Google Sheet via Google Apps Script.

**Setup steps:**

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Paste the contents of [`google-apps-script.js`](google-apps-script.js)
4. Deploy as **Web App** (Execute as: Me, Access: Anyone)
5. Copy the deployment URL
6. Paste it into `script.js` as the `GOOGLE_SHEET_URL` constant

The form sends a `POST` request with `mode: 'no-cors'` and a JSON body:

```json
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "subject": "...",
  "message": "..."
}
```

The Apps Script auto-creates headers on the first submission and formats each row with a timestamp in IST (Asia/Kolkata).

### 2. Express API (Fallback — Local Dev)

The Express server at `/api/contact` validates and logs submissions to `contact-log.jsonl`:

```bash
POST http://localhost:3000/api/contact
Content-Type: application/json

{ "name": "Test", "email": "test@example.com", "message": "Hello!" }
```

---

## 🎨 Sections Overview

### // Hero
- Animated typewriter cycling through roles: *Front-End Developer*, *SPA Architect*, *AI & Data Science Student*, *Vanilla JS Specialist*
- 3D icosahedron with gold wireframe + particle field
- CTAs: View Projects, Get in Touch, Resume download

### // 01 About
- 3D torus knot avatar with gold emissive material
- Quick stats: 4+ Projects, 15+ Skills, SPA Expert
- Internship experience card (AI/ML Intern @ AK InfoPark)
- Education timeline (B.Tech AI & DS 2024–2028)

### // 02 Projects

| # | Project | Stack |
|---|---|---|
| 01 | **Location Multi Cuisine Restaurant** | Node.js, Express, NeDB, JWT, Admin Panel |
| 02 | **Portfolio Website** | SPA, PWA, Three.js, Service Worker, BEM CSS |
| 03 | **Secure-Pay** | jQuery, Card Detection, Field Masking, CSS Animations |
| 04 | **Art-Gallery** | HTML5, CSS Grid, Masonry Layout, Semantic HTML |

Each project card features a 3D tilt effect with spotlight tracking on `mousemove`.

### // 03 Skills
- 3D floating skill labels (canvas-based sprites)
- Organized into: Core Languages, DOM & Browser APIs, Architecture, Styling, Other & Tools

### // 04 Contact
- Contact form with client-side validation
- Direct links: Email, GitHub, Phone, Location
- 3D grid plane background with gold accent lighting

---

## 🔒 Security

The Express server sets the following headers on every response:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

---

## ♿ Accessibility

- **ARIA landmarks** — `aria-label` on all sections, `aria-hidden` on decorative canvases
- **Keyboard navigation** — Arrow keys navigate between sections
- **Mobile nav** — ESC key closes overlay, `aria-expanded` on hamburger
- **Live regions** — Typewriter uses `aria-live="polite"`, toast uses `role="status"`
- **Focus management** — Project cards have `tabindex="0"` for keyboard access

---

## 📈 SEO

- **Canonical URL** — `https://roshinrg.github.io`
- **Schema.org JSON-LD** — Person schema with education, contact, and social links
- **Open Graph** — Title, description, image for social sharing
- **Twitter Card** — `summary_large_image` card type
- **Sitemap** — [`sitemap.xml`](sitemap.xml) with main portfolio + models section
- **Robots** — [`robots.txt`](robots.txt) allowing all crawlers

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Express server (`node server.js`) |
| `npm run dev` | Same as `npm start` (development mode) |

---

## 🧑‍💻 Author

**Roshin R G**

- 🎓 B.Tech AI & Data Science — Rajalakshmi Engineering College, Chennai (2024–2028)
- 📧 [roshin.rg.2024.aids@rajalakshmi.edu.in](mailto:roshin.rg.2024.aids@rajalakshmi.edu.in)
- 📱 +91 6369 460 964
- 🐙 [github.com/roshinrg](https://github.com/roshinrg)
- 🌍 Chennai, Tamil Nadu, India

---

## 📄 License

This project is **UNLICENSED** and private. All rights reserved.

---

<p align="center">
  <em>Crafted with precision & vanilla JS.</em>
</p>
