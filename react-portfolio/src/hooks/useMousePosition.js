import { useEffect, useRef, useCallback } from 'react';

/**
 * Shared mouse state — singleton, updated by one listener, read by all consumers.
 */
const mouseState = {
  x: 0, y: 0,   // raw px
  nx: 0, ny: 0,  // normalised [-1, 1]
};

let listenerAttached = false;

function attachListener() {
  if (listenerAttached) return;
  listenerAttached = true;

  let timeout;
  window.addEventListener('mousemove', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      mouseState.x = e.clientX;
      mouseState.y = e.clientY;
      mouseState.nx = (e.clientX / window.innerWidth) * 2 - 1;
      mouseState.ny = -(e.clientY / window.innerHeight) * 2 + 1;
    }, 16);
  }, { passive: true });
}

/**
 * useMousePosition — returns a ref to the shared mouse state object.
 * The ref.current is mutated in-place (no re-renders) for 60 fps Three.js usage.
 */
export default function useMousePosition() {
  const ref = useRef(mouseState);

  useEffect(() => {
    attachListener();
  }, []);

  return ref;
}
