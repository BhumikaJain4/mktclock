import { useEffect, useRef } from 'react';

interface PageVisibilityOptions {
  onHidden?: () => void;
  onVisible?: () => void;
  enabled?: boolean;
}

export function usePageVisibility({ onHidden, onVisible, enabled = true }: PageVisibilityOptions) {
  const onHiddenRef = useRef(onHidden);
  const onVisibleRef = useRef(onVisible);

  useEffect(() => {
    onHiddenRef.current = onHidden;
    onVisibleRef.current = onVisible;
  }, [onHidden, onVisible]);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onHiddenRef.current?.();
      } else if (document.visibilityState === 'visible') {
        onVisibleRef.current?.();
      }
    };

    const handlePageHide = () => {
      onHiddenRef.current?.();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [enabled]);
}
