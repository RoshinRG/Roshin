import { useEffect, useRef } from 'react';

/**
 * useReveal — IntersectionObserver-based reveal animation.
 * Adds 'reveal--visible' when the element enters the viewport.
 * @param {{ threshold?: number }} opts
 */
export default function useReveal({ threshold = 0.12 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('reveal--visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold }
    );

    // Observe all .reveal children inside this container
    const targets = el.querySelectorAll('.reveal');
    targets.forEach((t) => {
      if (!t.classList.contains('reveal--visible')) {
        io.observe(t);
      }
    });

    return () => io.disconnect();
  }, [threshold]);

  return ref;
}
