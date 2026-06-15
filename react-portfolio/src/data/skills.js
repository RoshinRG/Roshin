/**
 * Skills data — extracted from index.html
 */

export const skillGroups = [
  {
    name: 'Core Languages',
    delay: 0,
    ariaLabel: 'Core languages skills',
    items: [
      { label: 'Vanilla JS', star: true },
      { label: 'jQuery', star: true },
      { label: 'HTML5', star: true },
      { label: 'CSS3', star: true },
    ],
  },
  {
    name: 'DOM & Browser APIs',
    delay: 1,
    ariaLabel: 'DOM and Browser API skills',
    items: [
      { label: 'DOM Traversal & Manipulation', star: false },
      { label: 'MutationObserver', star: false },
      { label: 'IntersectionObserver', star: false },
      { label: 'Event Handling', star: false },
      { label: 'Web Storage', star: false },
    ],
  },
  {
    name: 'Architecture',
    delay: 2,
    ariaLabel: 'Architecture skills',
    items: [
      { label: 'SPA Patterns', star: true },
      { label: 'BEM CSS', star: true },
      { label: 'Conflict-free CSS', star: true },
      { label: 'CSS Custom Properties', star: false },
      { label: 'Service Workers', star: false },
    ],
  },
  {
    name: 'Styling',
    delay: 3,
    ariaLabel: 'Styling skills',
    items: [
      { label: 'CSS Grid', star: false },
      { label: 'Flexbox', star: false },
      { label: 'Responsive Design', star: false },
      { label: 'CSS Animations', star: false },
      { label: 'Tailwind CSS', star: false },
    ],
  },
  {
    name: 'Other & Tools',
    delay: 4,
    ariaLabel: 'Other skills',
    items: [
      { label: 'Python', star: false },
      { label: 'R', star: false },
      { label: 'C', star: false },
      { label: 'Git & GitHub', star: false },
      { label: 'Three.js / WebGL', star: false },
    ],
  },
];

/** 3D floating skill sprite data for the skills canvas */
export const skillSprites = [
  { label: 'Vanilla JS',   star: true,  x: -3.5, y:  1.2, z: 0.0 },
  { label: 'HTML5',         star: true,  x:  1.8, y:  1.6, z: 0.3 },
  { label: 'CSS3',          star: true,  x: -1.2, y:  0.5, z: 0.8 },
  { label: 'jQuery',        star: true,  x:  3.2, y:  0.8, z: -0.4 },
  { label: 'SPA Patterns',  star: true,  x: -2.8, y: -1.0, z: 0.5 },
  { label: 'BEM CSS',       star: true,  x:  2.0, y: -1.4, z: 0.2 },
  { label: 'Three.js',      star: false, x: -0.5, y:  1.8, z: -0.5 },
  { label: 'Python',        star: false, x:  3.8, y: -0.5, z: 0.3 },
  { label: 'Git',           star: false, x: -3.8, y:  0.0, z: -0.2 },
  { label: 'CSS Grid',      star: false, x:  0.2, y: -1.8, z: 0.6 },
  { label: 'Flexbox',       star: false, x: -1.8, y: -0.2, z: -0.8 },
  { label: 'Service Worker', star: false, x: 2.6, y:  0.2, z: -0.7 },
  { label: 'IntersectionObserver', star: false, x: -0.2, y: 0.0, z: 1.2 },
  { label: 'CSS Props',     star: false, x:  1.0, y: -0.6, z: -1.0 },
  { label: 'WebGL',         star: false, x: -2.2, y:  1.0, z: 0.9 },
];
