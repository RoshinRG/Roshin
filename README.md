# Roshin R G — Portfolio

> **Front-End Developer · SPA Architect · AI & Data Science Student**  
> A production-quality 3D immersive portfolio built with pure Vanilla JS, Three.js, and BEM CSS — zero framework dependencies.

🌐 **Live:** [roshinrg.github.io](https://roshinrg.github.io) &nbsp;|&nbsp; 📧 [roshin.rg.2024.aids@rajalakshmi.edu.in](mailto:roshin.rg.2024.aids@rajalakshmi.edu.in) &nbsp;|&nbsp; 🐙 [github.com/roshinrg](https://github.com/roshinrg)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic, accessible) |
| Styling | Vanilla CSS — BEM + CSS Custom Properties |
| Logic | Vanilla JavaScript (ES2020+, no bundler) |
| 3D / WebGL | Three.js r134 (CDN) |
| Server | Node.js + Express |
| Fonts | Space Grotesk · Space Mono · Syne (Google Fonts) |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) >= 18.0.0

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/roshinrg/roshinrg.github.io.git
cd roshinrg.github.io

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

Open **http://localhost:3000** in your browser.

---

## Project Structure

```
RGR PORTFOLIO/
├── index.html          # SPA shell — all sections, SEO meta, Schema.org JSON-LD
├── style.css           # BEM design system — tokens, layout, components, animations
├── script.js           # Three.js scenes + SPA router + all interactions
├── server.js           # Express server — static serving + /api/contact endpoint
├── package.json
├── robots.txt
├── sitemap.xml
└── models/             # 3D models sub-section (separate SPA)
```

---

## Features

### 🌐 SPA Router
- Instant section switching with a 200 ms fade transition
- Sections: **Hero · About · Projects · Skills · Contact**
- Keyboard navigation via `←` `→` arrow keys
- Active nav link synced to current section

### 🎮 Three.js Scenes

| Scene | Geometry | Notes |
|---|---|---|
| Hero | `IcosahedronGeometry` | Gold wireframe + black fill, slow Y rotation, cursor tilt (lerp 0.05) |
| Hero Particles | `BufferGeometry` points | 2 000 particles on sphere shell r=3–5, mouse repulsion |
| Hero Light | `PointLight` (gold) | Orbiting at radius 4, `AmbientLight` white 0.3 |
| About Avatar | `TorusKnotGeometry` | Metallic material + gold wireframe overlay |
| Skills | Canvas `Sprite` labels | 15 floating pills, mouse parallax |
| Contact | `GridHelper` | Animated gold grid plane |

### ✨ Interactions
- **Custom cursor** — gold dot + lagging ring, hover-grow on interactive elements
- **Typewriter** — cycles 4 roles with realistic variable typing speed
- **Project card tilt** — 3D `perspective()` tilt + radial spotlight gradient on hover
- **Scroll reveal** — `IntersectionObserver` with staggered CSS transition delays
- **Contact form** — `fetch` POST to `/api/contact`, loading state, success/error toast

### 📐 Design System
- **Background:** `#000000` · **Accent:** `#d4af37` (gold) · **Text:** `#f5f5f0`
- 40+ CSS custom properties (`--color-*`, `--space-*`, `--transition-*`, `--shadow-*`)
- Fully responsive — mobile nav overlay, fluid typography via `clamp()`
- `prefers-reduced-motion` respected

---

## API

### `POST /api/contact`

Accepts a JSON body and logs the submission to `contact-log.jsonl`.

**Request**
```json
{
  "name":    "Jane Doe",
  "email":   "jane@example.com",
  "subject": "Freelance project",
  "message": "Hey Roshin, let's work together!"
}
```

**Response (200)**
```json
{ "ok": true, "message": "Message received." }
```

**Response (400)**
```json
{ "error": "Required fields missing." }
```

---

## SEO & Performance

- `<title>`, `<meta description>`, Open Graph, Twitter Card tags
- **Schema.org JSON-LD** — `Person` entity with job title, email, location
- `sitemap.xml` · `robots.txt`
- Three.js scenes lazy-initialised per section (Skills + Contact on first visit)
- Mouse handler debounced at 16 ms; resize handler debounced at 150 ms
- `will-change` applied only on actively animated elements

---

## About

**Roshin R G** is a second-year B.Tech AI & Data Science student at Rajalakshmi Engineering College, Chennai (graduating 2028), specialising in Vanilla JS, SPA architecture, and BEM CSS.

- 📍 Chennai, Tamil Nadu, India
- 📞 +91 6369 460 964
- 🏢 AI/ML Intern — AK InfoPark Pvt Ltd (2024)

---

## License

`UNLICENSED` — All rights reserved. Source shared for reference only.
