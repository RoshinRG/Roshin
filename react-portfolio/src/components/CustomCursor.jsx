import { useEffect, useRef } from 'react';

const lerp = (a, b, t) => a + (b - a) * t;

const HOVER_TARGETS = 'a, button, [tabindex], .project-card, .contact__link-item, .about__stat';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const cursorPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let ringX = 0, ringY = 0;
    let rafId;

    function animateRing() {
      ringX = lerp(ringX, cursorPos.current.x, 0.1);
      ringY = lerp(ringY, cursorPos.current.y, 0.1);
      ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
      rafId = requestAnimationFrame(animateRing);
    }

    animateRing();

    const onMouseMove = (e) => {
      cursorPos.current.x = e.clientX;
      cursorPos.current.y = e.clientY;
      dot.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
    };

    const onMouseOver = (e) => {
      if (e.target.closest(HOVER_TARGETS)) {
        document.body.classList.add('cursor--hover');
      }
    };

    const onMouseOut = (e) => {
      if (e.target.closest(HOVER_TARGETS)) {
        document.body.classList.remove('cursor--hover');
      }
    };

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.body.classList.remove('cursor--hover');
    };
  }, []);

  return (
    <>
      <div className="cursor" id="cursor" aria-hidden="true">
        <div className="cursor__dot" id="cursorDot" ref={dotRef}></div>
      </div>
      <div className="cursor cursor--ring" id="cursorRing" aria-hidden="true">
        <div className="cursor__ring" id="cursorRingInner" ref={ringRef}></div>
      </div>
    </>
  );
}
