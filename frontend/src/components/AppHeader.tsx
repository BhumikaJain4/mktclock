import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/formatters';
import { QrCode, Trophy, Timer, User as UserIcon, LogOut } from 'lucide-react';

interface AppHeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onOpenQrModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentRoute, navigate, onOpenQrModal }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-ink-800/80 bg-ink-950/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div 
          onClick={() => navigate('/timer')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-ink-900 border border-ink-700/80 flex items-center justify-center relative overflow-hidden group-hover:border-signal/50 transition-colors">
            <div className="w-2 h-2 rounded-full bg-signal animate-pulse" />
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-wider text-ink-100 uppercase group-hover:text-white transition-colors">
              SANCTUM
            </div>
            <div className="text-[10px] tracking-widest text-ink-400 font-mono uppercase">
              AhdUni Library
            </div>
          </div>
        </div>

        {/* Center / Navigation items */}
        {isAuthenticated && (
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigate('/timer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentRoute === '/timer'
                  ? 'bg-ink-800 text-white border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-900'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timer</span>
            </button>

            <button
              onClick={() => navigate('/leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentRoute === '/leaderboard'
                  ? 'bg-ink-800 text-white border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Rankings</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentRoute === '/profile'
                  ? 'bg-ink-800 text-white border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-ink-900'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </nav>
        )}

        {/* Right action bar */}
        <div className="flex items-center gap-2">
          {/* Library QR poster trigger */}
          <button
            onClick={onOpenQrModal}
            title="View Official Library QR Code"
            className="p-2 rounded-lg text-ink-400 hover:text-white hover:bg-ink-850 border border-transparent hover:border-ink-700/50 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-ink-850 transition-colors"
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-ink-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-signal/15 border border-signal/40 text-signal font-mono text-xs font-bold flex items-center justify-center">
                    {getInitials(user?.name)}
                  </div>
                )}
                <span className="text-xs font-medium text-ink-200 hidden md:inline max-w-[100px] truncate">
                  {user?.name}
                </span>
              </div>

              <button
                onClick={() => logout()}
                title="Sign out"
                className="p-2 text-ink-400 hover:text-red-400 hover:bg-ink-850 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-signal text-white hover:bg-signal-light shadow-signal-glow transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
