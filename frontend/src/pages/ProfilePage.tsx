import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { request } from '../services/api';
import { ChallengeAttempt } from '../types';
import { formatDurationDisplay, formatSeconds, formatDate } from '../utils/formatters';
import { LoadingState } from '../components/LoadingState';
import { Button } from '../components/Button';
import { CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface ProfilePageProps {
  navigate: (route: string) => void;
}

/**
 * Returns the first letter of the first name, capitalised.
 * e.g. "akkshat.s" -> "A", "Bhumika J" -> "B"
 */
function getFirstLetter(name?: string | null): string {
  if (!name || !name.trim()) return 'U';
  let cleaned = name.trim();
  if (cleaned.includes('@')) cleaned = cleaned.split('@')[0];
  const parts = cleaned.replace(/[._]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length > 0) return parts[0][0].toUpperCase();
  return cleaned[0].toUpperCase();
}

/**
 * Returns the display name (first name only, properly capitalised).
 * e.g. "akkshat.s" -> "Akkshat S"
 */
function formatName(name?: string | null): string {
  if (!name || !name.trim()) return 'Student';
  let cleaned = name.trim();
  if (cleaned.includes('@')) cleaned = cleaned.split('@')[0];
  const parts = cleaned.replace(/[._]/g, ' ').split(/\s+/).filter(Boolean);
  return parts.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ');
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<ChallengeAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await request<{ attempts: ChallengeAttempt[] }>('/api/students/me/attempts');
        setAttempts(res.attempts || []);
      } catch (err) {
        console.warn('Failed to load student history:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading your focus record..." />;
  }

  const firstLetter = getFirstLetter(user?.name);
  const displayName = formatName(user?.name);
  const showPicture = !imgError && !!user?.picture;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Student Profile Card */}
      <div className="p-6 rounded-2xl bg-ink-900 border border-ink-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-4">
          {/* Avatar: first letter fallback if picture fails */}
          {showPicture ? (
            <img
              src={user!.picture!}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover border-2 border-ink-700"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-signal/15 border-2 border-signal/40 text-signal font-mono font-black text-2xl flex items-center justify-center select-none">
              {firstLetter}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
              {displayName}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-mono text-ink-400">
              <ShieldCheck className="w-3.5 h-3.5 text-signal" />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-ink-950 border border-ink-800 space-y-1">
            <div className="text-[10px] font-mono text-ink-400 uppercase">
              SINGLE BEST ATTEMPT
            </div>
            <div className="text-lg font-mono font-black text-amber-400">
              {user?.best_score_seconds ? formatDurationDisplay(user.best_score_seconds) : '0s'}
            </div>
            <div className="text-[10px] font-mono text-ink-500">
              {user?.best_score_seconds ? formatSeconds(user.best_score_seconds) : '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-ink-950 border border-ink-800 space-y-1">
            <div className="text-[10px] font-mono text-ink-400 uppercase">
              COMPLETED SESSIONS
            </div>
            <div className="text-lg font-mono font-black text-emerald-400">
              {user?.completed_challenges_count || 0}
            </div>
            <div className="text-[10px] font-mono text-ink-500">
              Full duration reached
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-ink-950 border border-ink-800 space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-mono text-ink-400 uppercase">
              TOTAL ATTEMPTS
            </div>
            <div className="text-lg font-mono font-black text-white">
              {attempts.length}
            </div>
            <div className="text-[10px] font-mono text-ink-500">
              Logged in library
            </div>
          </div>
        </div>
      </div>

      {/* Attempt History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-white">
            Personal Challenge History
          </h2>
          <Button
            variant="signal"
            size="sm"
            onClick={() => navigate('/timer')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Start New
          </Button>
        </div>

        {attempts.length === 0 ? (
          <div className="p-6 rounded-xl bg-ink-900/40 border border-ink-800 text-center text-xs text-ink-400">
            No focus attempts logged yet. Start a challenge to establish your personal best.
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((att) => {
              const isCompleted = att.status === 'completed';
              return (
                <div
                  key={att.id}
                  className="p-3.5 rounded-xl bg-ink-900/60 border border-ink-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-ink-800 text-ink-400 border border-ink-700'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">
                          {formatDurationDisplay(att.elapsed_seconds)} logged
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-ink-800 text-ink-400'
                        }`}>
                          {att.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-500 font-mono">
                        Target: {Math.floor(att.target_seconds / 60)}m • {formatDate(att.started_at)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs text-ink-400">
                    {formatSeconds(att.elapsed_seconds)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
