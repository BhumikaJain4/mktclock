import { useState, useEffect, useRef, useCallback } from 'react';
import { ChallengeAttempt } from '../types';
import { challengeService } from '../services/challenges';

interface UseFocusTimerProps {
  attempt: ChallengeAttempt | null;
  onComplete: (finalElapsed: number) => void;
  onInterrupt: (elapsed: number, reason: string) => void;
}

export function useFocusTimer({ attempt, onComplete, onInterrupt }: UseFocusTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => attempt?.elapsed_seconds || 0);
  const startTimeRef = useRef<number>(Date.now());
  const initialElapsedRef = useRef<number>(attempt?.elapsed_seconds || 0);
  const isFinalizedRef = useRef<boolean>(false);

  const targetSeconds = attempt?.target_seconds || 1800;

  // Initialize or re-sync when attempt changes
  useEffect(() => {
    if (!attempt) return;
    isFinalizedRef.current = false;
    const serverStartedAt = new Date(attempt.started_at).getTime();
    const now = Date.now();
    const calculatedElapsed = Math.max(
      attempt.elapsed_seconds || 0,
      Math.floor((now - serverStartedAt) / 1000)
    );

    startTimeRef.current = now - (calculatedElapsed * 1000);
    initialElapsedRef.current = calculatedElapsed;
    setElapsedSeconds(calculatedElapsed);
  }, [attempt?.id, attempt?.started_at]);

  // High-precision clock tick: calculates elapsed time from wall-clock/performance timestamp
  useEffect(() => {
    if (!attempt || attempt.status !== 'active') return;

    const interval = setInterval(() => {
      if (isFinalizedRef.current) return;

      const now = Date.now();
      const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);
      setElapsedSeconds(currentElapsed);

      // Check if target completed
      if (currentElapsed >= targetSeconds) {
        isFinalizedRef.current = true;
        clearInterval(interval);
        onComplete(targetSeconds);
      }
    }, 250); // 250ms interval ensures smooth display without drifting

    return () => clearInterval(interval);
  }, [attempt, targetSeconds, onComplete]);

  // Periodic heartbeat persistence every 6 seconds
  useEffect(() => {
    if (!attempt || attempt.status !== 'active') return;

    const heartbeatInterval = setInterval(() => {
      if (isFinalizedRef.current) return;
      const currentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      challengeService.heartbeat(attempt.id, currentSeconds).catch((err) => {
        console.warn('Heartbeat failed:', err);
      });
    }, 6000);

    return () => clearInterval(heartbeatInterval);
  }, [attempt]);

  const handleManualInterrupt = useCallback((reason: string = 'page_hidden') => {
    if (isFinalizedRef.current || !attempt) return;
    isFinalizedRef.current = true;
    const finalElapsed = Math.min(
      targetSeconds,
      Math.floor((Date.now() - startTimeRef.current) / 1000)
    );
    onInterrupt(finalElapsed, reason);
  }, [attempt, targetSeconds, onInterrupt]);

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const progressPercentage = Math.min(100, (elapsedSeconds / targetSeconds) * 100);

  return {
    elapsedSeconds,
    remainingSeconds,
    progressPercentage,
    targetSeconds,
    handleManualInterrupt,
  };
}
