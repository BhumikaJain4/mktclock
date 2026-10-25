import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { challengeService } from '../services/challenges';
import { ChallengeAttempt } from '../types';
import { DurationSelector } from '../components/DurationSelector';
import { FocusTimer } from '../components/FocusTimer';
import { LoadingState } from '../components/LoadingState';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { useFocusTimer } from '../hooks/useFocusTimer';
import { formatDurationDisplay, formatSeconds } from '../utils/formatters';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';

interface TimerPageProps {
  navigate: (route: string, state?: any) => void;
}

export const TimerPage: React.FC<TimerPageProps> = ({ navigate }) => {
  const { user, refreshUser } = useAuth();
  const [activeAttempt, setActiveAttempt] = useState<ChallengeAttempt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Notification for interrupted session when returning to page
  const [interruptedNotice, setInterruptedNotice] = useState<{
    elapsedSeconds: number;
    isPersonalBest: boolean;
    reason: string;
  } | null>(null);

  // Screen wake lock: held while an active challenge is in progress
  const isTimerActive = !!activeAttempt && activeAttempt.status === 'active';
  const { status: wakeLockStatus } = useScreenWakeLock(isTimerActive);

  // Synchronize active challenge on mount
  const syncActiveChallenge = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await challengeService.getActiveChallenge();
      if (res.active) {
        setActiveAttempt(res.active);
      } else {
        setActiveAttempt(null);
      }
    } catch (err: any) {
      console.warn('Could not sync active challenge:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncActiveChallenge();
  }, [syncActiveChallenge]);

  // Handle completion flow
  const handleComplete = useCallback(async (finalElapsed: number) => {
    if (!activeAttempt) return;
    isEndingRef.current = true;
    try {
      const completedAttempt = await challengeService.completeChallenge(
        activeAttempt.id,
        finalElapsed
      );
      await refreshUser();
      setActiveAttempt(null);
      // Navigate to celebratory completion screen with completed attempt data
      navigate('/challenge/complete', { attempt: completedAttempt });
    } catch (err: any) {
      console.error('Error completing challenge:', err);
      setErrorMsg(err.message || 'Failed to finalize challenge completion.');
    }
  }, [activeAttempt, navigate, refreshUser]);

  // Handle interruption flow (leaving page, phone lock, tab switch)
  const handleInterrupt = useCallback(async (elapsed: number, reason: string = 'page_hidden') => {
    if (!activeAttempt || activeAttempt.status !== 'active') return;
    try {
      const interruptedAttempt = await challengeService.interruptChallenge(
        activeAttempt.id,
        elapsed,
        reason,
        true // use keepalive for network reliability on unload/hide
      );
      await refreshUser();
      setActiveAttempt(null);

      // Present constructive summary upon return
      setInterruptedNotice({
        elapsedSeconds: interruptedAttempt.elapsed_seconds,
        isPersonalBest: !!interruptedAttempt.is_new_personal_best,
        reason,
      });
    } catch (err: any) {
      console.warn('Interruption recording error:', err);
      setActiveAttempt(null);
    }
  }, [activeAttempt, refreshUser]);

  // Monotonic focus clock
  const {
    remainingSeconds,
    elapsedSeconds,
    progressPercentage,
    targetSeconds,
    handleManualInterrupt,
  } = useFocusTimer({
    attempt: activeAttempt,
    onComplete: handleComplete,
    onInterrupt: handleInterrupt,
  });

  // Track active attempt and elapsed time in refs for unmount & beforeunload handlers
  const activeAttemptRef = React.useRef(activeAttempt);
  activeAttemptRef.current = activeAttempt;

  const elapsedSecondsRef = React.useRef(elapsedSeconds);
  elapsedSecondsRef.current = elapsedSeconds;

  const isEndingRef = React.useRef(false);

  // Trigger interruption when user navigates away from timer page or closes browser
  useEffect(() => {
    const handleBeforeUnload = () => {
      const current = activeAttemptRef.current;
      if (current && current.status === 'active' && !isEndingRef.current) {
        challengeService.interruptChallenge(
          current.id,
          elapsedSecondsRef.current,
          'page_unloaded',
          true
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const current = activeAttemptRef.current;
      if (current && current.status === 'active' && !isEndingRef.current) {
        // Leaving the timer page immediately interrupts and saves valid unbroken minutes
        challengeService.interruptChallenge(
          current.id,
          elapsedSecondsRef.current,
          'left_timer_page',
          true
        ).then(() => {
          refreshUser().catch(() => {});
        }).catch((err) => {
          console.warn('Auto-save on leaving timer page:', err);
        });
      }
    };
  }, [refreshUser]);

  // Page Visibility API Hook: Trigger interruption when document becomes hidden
  usePageVisibility({
    enabled: isTimerActive,
    onHidden: () => {
      // The moment the page becomes hidden or app switches, immediately end the attempt
      handleManualInterrupt('page_hidden');
    },
  });

  // Start new challenge
  const handleStartChallenge = async (minutes: number) => {
    setIsStarting(true);
    setErrorMsg(null);
    setInterruptedNotice(null);
    try {
      const newAttempt = await challengeService.startChallenge(minutes);
      setActiveAttempt(newAttempt);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start challenge session.');
    } finally {
      setIsStarting(false);
    }
  };

  // Manual early end
  const handleEndManually = async () => {
    if (!activeAttempt) return;
    isEndingRef.current = true;
    setIsEnding(true);
    try {
      const ended = await challengeService.endChallenge(activeAttempt.id, elapsedSeconds, 'manual_end');
      await refreshUser();
      setActiveAttempt(null);
      setInterruptedNotice({
        elapsedSeconds: ended.elapsed_seconds,
        isPersonalBest: !!ended.is_new_personal_best,
        reason: 'manual_end',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error ending challenge.');
    } finally {
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading focus environment..." />;
  }

  return (
    <div className="min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-4rem)] px-4 py-6 sm:p-8 flex flex-col justify-center items-center">
      {/* Interrupted / Session Logged Notice */}
      {interruptedNotice && !activeAttempt && (
        <div className="w-full max-w-md mx-auto mb-6 p-4 rounded-2xl bg-ink-900 border border-ink-700/80 space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-signal/15 border border-signal/40 text-signal flex items-center justify-center font-mono text-xs font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-white">
                  Focus Attempt Logged
                </h4>
                <p className="text-[11px] text-ink-400 font-mono">
                  {interruptedNotice.reason === 'page_hidden'
                    ? 'Attempt paused because screen or tab changed'
                    : 'Session ended manually'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setInterruptedNotice(null)}
              className="text-ink-500 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="p-3 rounded-xl bg-ink-950 flex items-center justify-between font-mono">
            <span className="text-xs text-ink-400">UNBROKEN TIME RECORDED</span>
            <span className="text-sm font-extrabold text-signal">
              {formatDurationDisplay(interruptedNotice.elapsedSeconds)} ({formatSeconds(interruptedNotice.elapsedSeconds)})
            </span>
          </div>

          {interruptedNotice.isPersonalBest && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>NEW ALL-TIME PERSONAL RECORD RECORDED!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/leaderboard')}
              icon={<ArrowRight className="w-3 h-3" />}
            >
              Check Leaderboard
            </Button>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="w-full max-w-md mx-auto mb-4">
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Main View: Active Timer vs Setup */}
      {activeAttempt && activeAttempt.status === 'active' ? (
        <FocusTimer
          remainingSeconds={remainingSeconds}
          elapsedSeconds={elapsedSeconds}
          progressPercentage={progressPercentage}
          targetSeconds={targetSeconds}
          wakeLockStatus={wakeLockStatus}
          personalBestSeconds={user?.best_score_seconds || 0}
          onEndManually={handleEndManually}
          isEnding={isEnding}
        />
      ) : (
        <DurationSelector
          onStartChallenge={handleStartChallenge}
          isStarting={isStarting}
          personalBestSeconds={user?.best_score_seconds || 0}
        />
      )}
    </div>
  );
};
