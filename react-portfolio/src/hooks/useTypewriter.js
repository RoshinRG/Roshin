import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useTypewriter — cycles through phrases with a typing / deleting animation.
 * @param {string[]} phrases
 * @param {{ typeSpeed?: number, deleteSpeed?: number, pauseMs?: number, startDelay?: number }} opts
 * @returns {string} current displayed text
 */
export default function useTypewriter(
  phrases,
  { typeSpeed = 75, deleteSpeed = 40, pauseMs = 1800, startDelay = 1200 } = {}
) {
  const [text, setText] = useState('');
  const phraseIdx = useRef(0);
  const charIdx = useRef(0);
  const deleting = useRef(false);
  const started = useRef(false);

  const tick = useCallback(() => {
    const current = phrases[phraseIdx.current];

    if (!deleting.current) {
      charIdx.current++;
      setText(current.slice(0, charIdx.current));

      if (charIdx.current === current.length) {
        deleting.current = true;
        return pauseMs;
      }
      return typeSpeed + Math.random() * 40;
    } else {
      charIdx.current--;
      setText(current.slice(0, charIdx.current));

      if (charIdx.current === 0) {
        deleting.current = false;
        phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
        return 400;
      }
      return deleteSpeed;
    }
  }, [phrases, typeSpeed, deleteSpeed, pauseMs]);

  useEffect(() => {
    let timeoutId;

    const run = () => {
      const delay = tick();
      timeoutId = setTimeout(run, delay);
    };

    // Initial start delay
    timeoutId = setTimeout(() => {
      started.current = true;
      run();
    }, startDelay);

    return () => clearTimeout(timeoutId);
  }, [tick, startDelay]);

  return text;
}
