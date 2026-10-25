import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Timer, User as UserIcon, LogOut } from 'lucide-react';

interface AppHeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

/**
 * Returns the first name from a full name or email-derived name.
 * e.g. "Bhumika J" -> "Bhumika", "akkshat.s" -> "Akkshat"
 */
function getFirstName(name?: string | null): string {
  if (!name || !name.trim()) return 'You';
  let cleaned = name.trim();
  // Strip email domain if present
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[0];
  }
  // Handle dot/underscore separated names like "bhumika.j" or "akkshat_s"
  const parts = cleaned.replace(/[._]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length > 0) {
    const first = parts[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return cleaned;
}

/** Returns just the first letter of the first name for the avatar circle */
function getAvatarLetter(name?: string | null): string {
  const first = getFirstName(name);
  return first.charAt(0).toUpperCase();
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentRoute, navigate }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const firstName = getFirstName(user?.name);
  const avatarLetter = getAvatarLetter(user?.name);

  // Track whether the Google profile picture failed to load
  const [imgError, setImgError] = useState(false);

  // Reset error state when user changes
  const showPicture = !imgError && !!user?.picture;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-ink-800/80 bg-ink-950/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 min-h-14 sm:h-16 flex flex-wrap items-center justify-between gap-x-2">
        {/* Logo / Brand */}
        <div
          onClick={() => navigate('/timer')}
          className="order-1 flex h-14 sm:h-16 items-center gap-2 cursor-pointer group select-none shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-ink-900 border border-ink-700/80 flex items-center justify-center relative overflow-hidden group-hover:border-signal/50 transition-colors">
            <div className="w-2 h-2 rounded-full bg-signal animate-pulse" />
          </div>
          <div>
            <div className="font-display font-bold text-xs sm:text-sm tracking-wider text-ink-100 uppercase group-hover:text-white transition-colors">
              SANCTUM
            </div>
            <div className="text-[9px] sm:text-[10px] tracking-widest text-ink-400 font-mono uppercase hidden sm:block">
              AhdUni Library
            </div>
          </div>
        </div>

        {/* Center / Navigation items */}
        {isAuthenticated && (
          <nav aria-label="Main navigation" className="order-3 flex w-full items-center justify-around border-t border-ink-800/80 sm:order-2 sm:w-auto sm:justify-center sm:gap-1 sm:border-t-0">
            <button
              onClick={() => navigate('/timer')}
              aria-label="Timer"
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors sm:flex-initial sm:flex-row sm:gap-1.5 sm:rounded-lg sm:px-3 sm:text-xs ${currentRoute === '/timer'
                  ? 'bg-ink-800 text-white border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-900'
                }`}
            >
              <Timer className="w-4 h-4 shrink-0" />
              <span>Timer</span>
            </button>

            <button
              onClick={() => navigate('/leaderboard')}
              aria-label="Rankings"
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors sm:flex-initial sm:flex-row sm:gap-1.5 sm:rounded-lg sm:px-3 sm:text-xs ${currentRoute === '/leaderboard'
                  ? 'bg-ink-800 text-white border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-900'
                }`}
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Rankings</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              aria-label="Profile"
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors sm:flex-initial sm:flex-row sm:gap-1.5 sm:rounded-lg sm:px-3 sm:text-xs ${currentRoute === '/profile'
                  ? 'bg-ink-800 text-white border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-900'
                }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>Profile</span>
            </button>
          </nav>
        )}

        {/* Right action bar */}
        <div className="order-2 ml-auto flex h-14 shrink-0 items-center gap-1 sm:order-3 sm:ml-0 sm:h-16 sm:gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer p-1 rounded-lg hover:bg-ink-850 transition-colors"
              >
                {/* Avatar: show Google picture if loaded successfully, else show first letter */}
                {showPicture ? (
                  <img
                    src={user!.picture!}
                    alt={user?.name ?? ''}
                    className="w-8 h-8 rounded-full border border-ink-700 object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-signal/15 border border-signal/40 text-signal font-mono text-sm font-bold flex items-center justify-center">
                    {avatarLetter}
                  </div>
                )}
                <span className="text-xs font-medium text-ink-200 hidden lg:inline max-w-[100px] truncate">
                  {firstName}
                </span>
              </div>

              <button
                onClick={() => logout()}
                title="Sign out"
                aria-label="Sign out"
                className="p-2 text-ink-400 hover:text-red-400 hover:bg-ink-850 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg bg-signal text-white hover:bg-signal-light shadow-signal-glow transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
