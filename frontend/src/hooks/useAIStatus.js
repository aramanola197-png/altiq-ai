import { useState, useRef, useCallback } from 'react';

const PHRASES = ['Thinking…', 'Reasoning through it…', 'Putting it together…'];

/**
 * Shared AI loading status line — no duplication across pages.
 */
export function useAIStatus() {
  const [status, setStatus] = useState('');
  const [active, setActive] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback((customPhrases) => {
    const phrases = customPhrases || PHRASES;
    let i = 0;
    setActive(true);
    setStatus(phrases[0]);
    intervalRef.current = setInterval(() => {
      i = (i + 1) % phrases.length;
      setStatus(phrases[i]);
    }, 1800);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setActive(false);
    setStatus('');
  }, []);

  return { status, active, start, stop };
}
