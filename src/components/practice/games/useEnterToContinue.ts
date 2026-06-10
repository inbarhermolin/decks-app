import { useEffect } from 'react';

/**
 * Fires `onContinue` when Enter is pressed, but only while `ready` is true
 * and the active element is not an input/textarea (so typing isn't intercepted).
 */
export function useEnterToContinue(ready: boolean, onContinue: () => void) {
  useEffect(() => {
    if (!ready) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      onContinue();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ready, onContinue]);
}
