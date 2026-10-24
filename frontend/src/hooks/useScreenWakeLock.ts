import { useState, useEffect, useCallback, useRef } from 'react';

export type WakeLockState = 'unsupported' | 'requesting' | 'active' | 'released' | 'denied';

export function useScreenWakeLock(enabled: boolean = false) {
  const [status, setStatus] = useState<WakeLockState>('unsupported');
  const sentinelRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 'wakeLock' in navigator;

  const requestWakeLock = useCallback(async () => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }

    try {
      setStatus('requesting');
      const sentinel = await (navigator as any).wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setStatus('active');

      sentinel.addEventListener('release', () => {
        // Only set to released if component hasn't explicitly replaced it
        if (sentinelRef.current === sentinel) {
          sentinelRef.current = null;
          setStatus('released');
        }
      });
    } catch (err: any) {
      console.warn('Wake lock request denied or failed:', err);
      setStatus('denied');
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err) {
        console.warn('Error releasing wake lock:', err);
      }
      sentinelRef.current = null;
      setStatus('released');
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [enabled, requestWakeLock, releaseWakeLock]);

  // Handle visibility recovery: re-request lock if page becomes visible again and still enabled
  useEffect(() => {
    if (!enabled || !isSupported) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, isSupported, requestWakeLock]);

  return {
    status,
    isSupported,
    isActive: status === 'active',
  };
}
