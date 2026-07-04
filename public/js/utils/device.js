export const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
export const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
