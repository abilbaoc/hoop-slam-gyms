import { useEffect, useRef } from 'react';

/** Calls the handler when the user clicks/taps outside the referenced element. */
export function useClickAway<T extends HTMLElement>(onAway: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handle = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onAway();
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [onAway]);

  return ref;
}
