import React, { useState } from 'react';
import { formatSeconds } from '../utils/formatters';
import { ProgressRing } from './ProgressRing';
import { WakeLockStatus } from './WakeLockStatus';
import { WakeLockState } from '../hooks/useScreenWakeLock';
import { Button } from './Button';
import { ShieldAlert, Sparkles, X, AlertTriangle } from 'lucide-react';

interface FocusTimerProps {
  remainingSeconds: number;
  elapsedSeconds: number;
  progressPercentage: number;
  targetSeconds: number;
  wakeLockStatus: WakeLockState;
  personalBestSeconds: number;
  onEndManually: () => Promise<void>;
  isEnding: boolean;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  remainingSeconds,
  elapsedSeconds,
  progressPercentage,
  targetSeconds,
  wakeLockStatus,
  personalBestSeconds,
  onEndManually,
  isEnding,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Check if current session has already broken user's personal best
  const isBeatingBest = elapsedSeconds > personalBestSeconds && personalBestSeconds > 0;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6">
      {/* Top Status Indicators */}
      <div className="flex items-center justify-between w-full px-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-signal/15 border border-signal/40 text-signal text-[11px] font-mono font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ping" />
            LIVE IMMERSION
          </div>
        </div>

        <WakeLockStatus status={wakeLockStatus} />
      </div>

      {/* Circular Timer Display */}
      <div className="py-2">
        <ProgressRing
          progressPercentage={progressPercentage}
          size={290}
          strokeWidth={7}
        >
          {/* Digits and Progress labels inside dial */}
          <div className="space-y-1">
            <div className="text-[11px] font-mono tracking-widest text-ink-400 uppercase">
              REMAINING
            </div>
            <div className="font-mono font-extrabold text-4xl sm:text-5xl text-white tracking-tighter timer-digits drop-shadow-md">
              {formatSeconds(remainingSeconds)}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-ink-300">
                {Math.round(progressPercentage)}% done
              </span>
              <span className="text-ink-600">•</span>
              <span className="text-[11px] font-mono text-signal">
                +{formatSeconds(elapsedSeconds)} logged
              </span>
            </div>
          </div>
        </ProgressRing>
      </div>

      {/* Personal Best Achievement Badge during session */}
      {isBeatingBest ? (
        <div className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>NEW PERSONAL BEST PACE!</span>
        </div>
      ) : personalBestSeconds > 0 ? (
        <div className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-ink-900/60 border border-ink-800/80 text-xs text-ink-400 font-mono">
          <span>ALL-TIME BEST</span>
          <span className="text-ink-200 font-bold">{formatSeconds(personalBestSeconds)}</span>
        </div>
      ) : null}

      {/* Target details and cautionary message */}
      <div className="w-full p-4 rounded-xl bg-ink-900/80 border border-ink-800 space-y-2 text-center">
        <div className="text-xs font-mono text-ink-400 uppercase tracking-wider">
          TARGET: {Math.floor(targetSeconds / 60)} MINUTES OF UNBROKEN FOCUS
        </div>
        <p className="text-xs text-ink-400 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-signal shrink-0" />
          <span>Leaving this tab or locking screen ends this attempt.</span>
        </p>
      </div>

      {/* Manual End Challenge Control */}
      <div className="w-full pt-2">
        <Button
          variant="outline"
          size="md"
          className="w-full text-xs font-mono text-ink-400 hover:text-red-400 hover:border-red-500/40"
          onClick={() => setShowConfirmModal(true)}
        >
          CONCLUDE CHALLENGE EARLY
        </Button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-ink-900 border border-ink-700/80 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-ink-400 hover:text-white hover:bg-ink-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-display font-bold text-white">
                End challenge now?
              </h3>
              <p className="text-xs text-ink-400">
                You have maintained focus for <strong className="text-white font-mono">{formatSeconds(elapsedSeconds)}</strong>. Your focused time will be permanently saved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowConfirmModal(false)}
              >
                Stay Focused
              </Button>

              <Button
                variant="danger"
                size="md"
                isLoading={isEnding}
                onClick={async () => {
                  setShowConfirmModal(false);
                  await onEndManually();
                }}
              >
                End & Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
