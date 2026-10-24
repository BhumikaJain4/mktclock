import React from 'react';
import { LeaderboardEntry } from '../types';
import { formatDisplayName } from '../utils/formatters';
import { Trophy, Crown, Medal, Sparkles } from 'lucide-react';

interface PodiumProps {
  entries: LeaderboardEntry[];
  currentStudentId?: string | null;
}

export const Podium: React.FC<PodiumProps> = ({ entries, currentStudentId }) => {
  if (entries.length < 1) return null;

  const first = entries[0];
  const second = entries[1] || null;
  const third = entries[2] || null;

  return (
    <div className="w-full max-w-xl mx-auto pt-4 pb-2">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end justify-center">
        {/* Second Place (Left) */}
        {second ? (
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="relative">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center font-mono font-bold text-lg sm:text-xl transition-all duration-300 ${
                  second.student_id === currentStudentId
                    ? 'border-signal bg-signal/20 text-signal shadow-signal-glow ring-2 ring-signal/40'
                    : 'border-slate-300/50 bg-gradient-to-b from-slate-800 to-ink-900 text-slate-200 shadow-md group-hover:border-slate-300'
                }`}
              >
                {second.picture ? (
                  <img src={second.picture} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  second.avatar_initials
                )}
              </div>
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-ink-950 font-bold text-xs flex items-center justify-center shadow-md border border-white/50">
                2
              </div>
              {second.student_id === currentStudentId && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-signal text-white rounded text-[9px] font-mono font-bold uppercase shadow">
                  YOU
                </div>
              )}
            </div>

            <div className="space-y-0.5 max-w-full px-1">
              <div className="font-display font-semibold text-xs sm:text-sm text-ink-200 truncate" title={formatDisplayName(second.display_name)}>
                {formatDisplayName(second.display_name)}
              </div>
              <div className="font-mono text-xs font-bold text-slate-300">
                {second.formatted_duration}
              </div>
            </div>

            <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-b from-slate-800/80 via-ink-900 to-ink-950 border-t-2 border-x border-slate-400/40 flex flex-col items-center justify-center shadow-fine-card transition-all group-hover:border-slate-300/70">
              <Medal className="w-5 h-5 text-slate-300 mb-1" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">2nd Place</span>
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* First Place (Center - Highest) */}
        {first && (
          <div className="flex flex-col items-center text-center space-y-2 group relative z-10">
            <div className="flex items-center gap-1 text-amber-400 animate-pulse">
              <Crown className="w-6 h-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            </div>

            <div className="relative">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex items-center justify-center font-mono font-bold text-xl sm:text-2xl transition-all duration-300 ${
                  first.student_id === currentStudentId
                    ? 'border-signal bg-signal/25 text-signal shadow-signal-glow ring-4 ring-signal/40'
                    : 'border-amber-400 bg-gradient-to-b from-amber-500/20 via-ink-900 to-ink-950 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)] group-hover:border-amber-300'
                }`}
              >
                {first.picture ? (
                  <img src={first.picture} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  first.avatar_initials
                )}
              </div>
              <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-ink-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-ink-950">
                1
              </div>
              {first.student_id === currentStudentId && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-signal text-white rounded text-[10px] font-mono font-extrabold uppercase shadow-signal-glow">
                  YOU
                </div>
              )}
            </div>

            <div className="space-y-0.5 max-w-full px-1">
              <div className="font-display font-bold text-sm sm:text-base text-white truncate flex items-center justify-center gap-1" title={formatDisplayName(first.display_name)}>
                <span>{formatDisplayName(first.display_name)}</span>
              </div>
              <div className="font-mono text-sm sm:text-base font-black text-amber-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{first.formatted_duration}</span>
              </div>
            </div>

            <div className="w-full h-28 sm:h-34 rounded-t-2xl bg-gradient-to-b from-amber-500/25 via-ink-850 to-ink-950 border-t-2 border-x border-amber-400/60 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.15)] transition-all group-hover:border-amber-300">
              <Trophy className="w-7 h-7 text-amber-400 mb-1 drop-shadow" />
              <span className="text-[11px] font-mono font-extrabold text-amber-400 uppercase tracking-widest">Champion</span>
            </div>
          </div>
        )}

        {/* Third Place (Right) */}
        {third ? (
          <div className="flex flex-col items-center text-center space-y-2 group">
            <div className="relative">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center font-mono font-bold text-lg sm:text-xl transition-all duration-300 ${
                  third.student_id === currentStudentId
                    ? 'border-signal bg-signal/20 text-signal shadow-signal-glow ring-2 ring-signal/40'
                    : 'border-amber-700/50 bg-gradient-to-b from-amber-950/60 to-ink-900 text-amber-500 shadow-md group-hover:border-amber-600'
                }`}
              >
                {third.picture ? (
                  <img src={third.picture} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  third.avatar_initials
                )}
              </div>
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center shadow-md border border-amber-500/50">
                3
              </div>
              {third.student_id === currentStudentId && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-signal text-white rounded text-[9px] font-mono font-bold uppercase shadow">
                  YOU
                </div>
              )}
            </div>

            <div className="space-y-0.5 max-w-full px-1">
              <div className="font-display font-semibold text-xs sm:text-sm text-ink-200 truncate" title={formatDisplayName(third.display_name)}>
                {formatDisplayName(third.display_name)}
              </div>
              <div className="font-mono text-xs font-bold text-amber-500">
                {third.formatted_duration}
              </div>
            </div>

            <div className="w-full h-16 sm:h-20 rounded-t-2xl bg-gradient-to-b from-amber-950/40 via-ink-900 to-ink-950 border-t-2 border-x border-amber-700/40 flex flex-col items-center justify-center shadow-fine-card transition-all group-hover:border-amber-600/70">
              <Medal className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider">3rd Place</span>
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
