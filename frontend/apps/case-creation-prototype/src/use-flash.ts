import { useEffect, useRef, useState } from 'react';

/**
 * A value the form set by itself (the STAT prefill, a confirmed patient) flashes, so the change
 * can't go unnoticed. Never on mount, and only when `when` says the form — not the user — moved it.
 */
export function useFlash(value: unknown, when: boolean) {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!when) return;
    setOn(true);
    const id = setTimeout(() => setOn(false), 900);
    return () => clearTimeout(id);
  }, [value]);
  return on;
}
