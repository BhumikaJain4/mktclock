import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ChallengeAttempt } from '../types';
import { formatDurationDisplay, formatSeconds } from '../utils/formatters';
import { Button } from '../components/Button';
import { Trophy, Sparkles, ArrowRight, RotateCcw, Award } from 'lucide-react';

interface ChallengeCompletePageProps {
  attempt?: ChallengeAttempt | null;
  navigate: (route: string) => void;
}

export const ChallengeCompletePage: React.FC<ChallengeCompletePageProps> = ({
  attempt,
  navigate,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(6);
  const redirectTimerRef = useRef<any>(null);
  const isCancelledRef = useRef<boolean>(false);

  const durationSeconds = attempt?.target_seconds || 1800;
  const isPersonalBest = !!attempt?.is_new_personal_best;
  const userRank = attempt?.user_rank;

  // Fire celebratory restrained confetti burst
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#FF5722', '#FF9800', '#FFD54F', '#FFFFFF'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  // 6-second countdown with automatic redirection to leaderboard
  useEffect(() => {
    redirectTimerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(redirectTimerRef.current);
          if (!isCancelledRef.current) {
            navigate('/leaderboard');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (redirectTimerRef.current) {
        clearInterval(redirectTimerRef.current);
      }
    };
  }, [navigate]);

  const handleImmediateLeaderboard = () => {
    isCancelledRef.current = true;
    if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
    navigate('/leaderboard');
  };

  const handleStartAnother = () => {
    isCancelledRef.current = true;
    if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
    navigate('/timer');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-ink-900 border border-ink-700/80 p-6 sm:p-8 space-y-6 text-center shadow-2xl animate-scale-in">
        {/* Achievement Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-signal/15 border-2 border-signal flex items-center justify-center text-signal shadow-signal-glow">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
          {isPersonalBest && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-ink-950 font-mono font-bold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>NEW PB</span>
            </div>
          )}
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-signal font-bold">
            CHALLENGE ACCOMPLISHED
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Immersion Complete
          </h1>
          <p className="text-xs text-ink-400 max-w-xs mx-auto">
            You maintained unbroken focus throughout the target duration.
          </p>
        </div>

        {/* Duration Card */}
        <div className="p-4 rounded-xl bg-ink-950 border border-ink-800 space-y-2">
          <div className="text-[11px] font-mono text-ink-400 uppercase tracking-wider">
            UNBROKEN STUDY TIME
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight timer-digits">
            {formatDurationDisplay(durationSeconds)}
          </div>
          <div className="text-xs text-ink-400 font-mono">
            Exact: {formatSeconds(durationSeconds)}
          </div>
        </div>

        {/* Updated Rank info if resolved */}
        {userRank && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-ink-950/60 border border-ink-800 text-xs font-mono">
            <span className="text-ink-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              GLOBAL UNIVERSITY RANK
            </span>
            <span className="font-bold text-amber-400 text-sm">
              #{userRank}
            </span>
          </div>
        )}

        {/* Automatic navigation progress bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-ink-400">
            <span>REDIRECTING TO LEADERBOARD</span>
            <span className="text-signal font-bold">{secondsRemaining}s</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-ink-800 overflow-hidden">
            <div
              className="h-full bg-signal transition-all duration-1000 ease-linear"
              style={{ width: `${((6 - secondsRemaining) / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <Button
            variant="signal"
            size="lg"
            className="w-full text-sm font-bold"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={handleImmediateLeaderboard}
          >
            VIEW MY RANK NOW
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="w-full text-xs font-mono text-ink-400 hover:text-white"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleStartAnother}
          >
            Start Another Challenge
          </Button>
        </div>
      </div>
    </div>
  );
};
