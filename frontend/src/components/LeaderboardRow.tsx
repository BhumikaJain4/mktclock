import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import { formatDate, formatDisplayName } from '../utils/formatters';
import { Award } from 'lucide-react';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

export const LeaderboardRow = React.forwardRef<HTMLDivElement, LeaderboardRowProps>(
  ({ entry, isCurrentUser }, ref) => {
    const isTopThree = entry.rank <= 3;
    const displayName = formatDisplayName(entry.display_name);
    const [imgError, setImgError] = useState(false);
    const showPicture = !imgError && !!entry.picture;

    return (
      <div
        ref={ref}
        id={`student-row-${entry.student_id}`}
        className={`scroll-mt-24 w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${
          isCurrentUser
            ? 'bg-signal/15 border-2 border-signal shadow-signal-glow ring-2 ring-signal/30'
            : 'bg-ink-900/60 hover:bg-ink-850/80 border border-ink-800/90 hover:border-ink-700'
        }`}
      >
        {/* Rank and Student Info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className={`w-8 sm:w-10 text-center font-mono font-black text-sm sm:text-base shrink-0 ${
              entry.rank === 1
                ? 'text-amber-400'
                : entry.rank === 2
                ? 'text-slate-300'
                : entry.rank === 3
                ? 'text-amber-600'
                : isCurrentUser
                ? 'text-signal'
                : 'text-ink-500'
            }`}
          >
            #{entry.rank}
          </div>

          {/* Avatar */}
          <div className="shrink-0 relative">
            {showPicture ? (
              <img
                src={entry.picture!}
                alt=""
                className={`w-10 h-10 rounded-xl object-cover border ${
                  isCurrentUser ? 'border-signal shadow-signal-glow' : 'border-ink-700'
                }`}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                  isCurrentUser
                    ? 'bg-signal text-white shadow-signal-glow'
                    : 'bg-ink-800 border border-ink-700 text-ink-300'
                }`}
              >
                {/* Show the first letter of the display name */}
                {(entry.avatar_initials || displayName || 'U')[0].toUpperCase()}
              </div>
            )}
            {isTopThree && (
              <div className="absolute -top-1 -right-1">
                <Award
                  className={`w-3.5 h-3.5 ${
                    entry.rank === 1
                      ? 'text-amber-400'
                      : entry.rank === 2
                      ? 'text-slate-300'
                      : 'text-amber-600'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Name and achievement info */}
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span
                className={`font-display font-semibold text-xs sm:text-sm truncate ${
                  isCurrentUser ? 'text-white font-bold' : 'text-ink-200'
                }`}
                title={displayName}
              >
                {displayName}
              </span>
              {isCurrentUser && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-signal text-white uppercase tracking-wider shadow">
                  YOU
                </span>
              )}
            </div>
            <div className="text-[10px] text-ink-500 font-mono truncate">
              Best achieved {formatDate(entry.best_achieved_at)}
            </div>
          </div>
        </div>

        {/* Best Score Duration */}
        <div className="text-right shrink-0 pl-2">
          <div
            className={`font-mono font-black text-sm sm:text-base ${
              isCurrentUser ? 'text-signal drop-shadow-[0_0_6px_rgba(255,87,34,0.35)]' : 'text-white'
            }`}
          >
            {entry.formatted_duration}
          </div>
          <div className="text-[10px] text-ink-400 font-mono tracking-wide">
            Longest Unbroken
          </div>
        </div>
      </div>
    );
  }
);

LeaderboardRow.displayName = 'LeaderboardRow';
