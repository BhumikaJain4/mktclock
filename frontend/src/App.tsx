import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppHeader } from './components/AppHeader';
import { EntryPage } from './pages/EntryPage';
import { LoginPage } from './pages/LoginPage';
import { TimerPage } from './pages/TimerPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ChallengeCompletePage } from './pages/ChallengeCompletePage';
import { ProfilePage } from './pages/ProfilePage';
import { LoadingState } from './components/LoadingState';

function RouterApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => window.location.pathname || '/');
  const [routeState, setRouteState] = useState<any>(null);

  // Sync with browser history back/forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string, state?: any) => {
    setRouteState(state || null);
    setCurrentRoute(route);
    window.history.pushState(state || {}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route protection
  const isProtectedRoute = ['/timer', '/profile', '/challenge/complete'].includes(currentRoute);

  let content: React.ReactNode;

  if (isLoading && isProtectedRoute) {
    content = <LoadingState message="Verifying student authorization..." />;
  } else if (!isAuthenticated && isProtectedRoute && !isLoading) {
    content = <LoginPage navigate={navigate} />;
  } else {
    switch (currentRoute) {
      case '/':
        content = <EntryPage navigate={navigate} />;
        break;
      case '/login':
        content = <LoginPage navigate={navigate} />;
        break;
      case '/timer':
        content = <TimerPage navigate={navigate} />;
        break;
      case '/leaderboard':
        content = <LeaderboardPage navigate={navigate} />;
        break;
      case '/challenge/complete':
        content = <ChallengeCompletePage attempt={routeState?.attempt} navigate={navigate} />;
        break;
      case '/profile':
        content = <ProfilePage navigate={navigate} />;
        break;
      default:
        content = <EntryPage navigate={navigate} />;
        break;
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 bg-grid-pattern text-ink-100 flex flex-col font-sans selection:bg-signal selection:text-white">
      <AppHeader
        currentRoute={currentRoute}
        navigate={navigate}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col">
        {content}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterApp />
    </AuthProvider>
  );
}
