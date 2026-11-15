import { useEffect, useRef } from 'react';

/**
 * While an overlay (side menu, popup, photo viewer) is open, the phone's back button – and the browser's back –
 * closes it, instead of leaving the screen underneath (what users expect in the Android app).
 * Opening adds a history entry with the same address; closing from the UI (X, tap outside) removes it again.
 */
export function useBackClose(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const marker = `overlay-${Math.random().toString(36).slice(2)}`;
    let pushed = false;
    let poppedByBack = false;
    const onPop = () => {
      poppedByBack = true;
      closeRef.current();
    };
    // deferred so React's dev double-mount doesn't push and pop an entry in the same tick
    const t = window.setTimeout(() => {
      window.history.pushState({ ...(window.history.state as object | null), overlay: marker }, '');
      pushed = true;
      window.addEventListener('popstate', onPop);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('popstate', onPop);
      // closed from the UI: drop our entry – unless the app navigated to another screen meanwhile
      const state = window.history.state as { overlay?: string } | null;
      if (pushed && !poppedByBack && state?.overlay === marker) window.history.back();
    };
  }, [open]);
}
