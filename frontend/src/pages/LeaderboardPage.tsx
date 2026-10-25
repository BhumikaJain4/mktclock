import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaderboardService } from '../services/leaderboard';
import { LeaderboardResponse } from '../types';
import { Podium } from '../components/Podium';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Button } from '../components/Button';
import {
  Trophy,
  Award,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

interface LeaderboardPageProps {
  navigate: (route: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRulesExplainer, setShowRulesExplainer] = useState<boolean>(false);

  // Ref for the current user's row in the full leaderboard
  const myRowRef = useRef<HTMLDivElement | null>(null);
  // Ref to track if auto-scroll has occurred for the current dataset to prevent loops
  const hasScrolledRef = useRef<boolean>(false);

  const fetchLeaderboard = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      setErrorMsg(null);
      try {
        // Fetch complete leaderboard so all eligible students are present in one view
        const res = await leaderboardService.getLeaderboard(1, 1000);
        setData(res);
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
        setErrorMsg(err.message || 'Unable to retrieve leaderboard rankings.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    hasScrolledRef.current = false;
    await fetchLeaderboard(true);
  };

  // Automatically scroll main page to current user's row
  useEffect(() => {
    if (isLoading || !data?.entries || !user || hasScrolledRef.current) {
      return;
    }

    // Match strictly by authenticated student ID, not display name
    const userEntry = data.entries.find((e) => e.student_id === user.id);

    // If user has no record in the leaderboard yet, mark handled and do not scroll
    if (!userEntry) {
      hasScrolledRef.current = true;
      return;
    }

    // If user is in the top three (rank 1, 2, or 3), keep podium visible at top of page
    // Avoid awkward downward scrolling or unnecessary jumping
    if (userEntry.rank <= 3) {
      hasScrolledRef.current = true;
      return;
    }

    // User is ranked #4 or lower; reliably scroll to their row once rendered in DOM
    const timer = setTimeout(() => {
      const el = myRowRef.current || document.getElementById(`student-row-${user.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolledRef.current = true;
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isLoading, data, user]);

  if (isLoading && !data) {
    return <LoadingState message="Calculating deterministic library rankings..." />;
  }

  if (errorMsg && !data) {
    return <ErrorState message={errorMsg} onRetry={() => fetchLeaderboard()} />;
  }

  const entries = data?.entries || [];
  const topThree = entries.slice(0, 3);
  const isCurrentUserInList = Boolean(user && entries.some((e) => e.student_id === user.id));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-900 border border-ink-800 text-xs font-mono text-ink-300">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>AHMEDABAD UNIVERSITY RANKINGS</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight uppercase">
            Library Focus Leaders
          </h1>
          <button
            onClick={handleManualRefresh}
            title="Refresh leaderboard"
            className="p-1.5 rounded-lg bg-ink-900 border border-ink-800 text-ink-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-signal' : ''}`} />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-ink-400 max-w-sm mx-auto">
          Rankings are based strictly on each student's <strong>single highest unbroken focus attempt</strong>.
        </p>
      </div>

      {/* Rules Explainer Accordion */}
      <div className="rounded-2xl bg-ink-900/60 border border-ink-800/80 overflow-hidden text-xs">
        <button
          onClick={() => setShowRulesExplainer(!showRulesExplainer)}
          className="w-full p-3.5 flex items-center justify-between text-ink-300 hover:text-white hover:bg-ink-850/50 transition-colors text-left cursor-pointer"
        >
          <span className="flex items-center gap-2 font-mono font-medium">
            <Info className="w-4 h-4 text-signal shrink-0" />
            <span>How the Single Best Attempt leaderboard works</span>
          </span>
          {showRulesExplainer ? (
            <ChevronUp className="w-4 h-4 text-ink-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ink-400" />
          )}
        </button>

        {showRulesExplainer && (
          <div className="p-4 pt-2 border-t border-ink-800/80 space-y-3 bg-ink-950/40 text-ink-300">
            <ul className="space-y-1.5 list-disc list-inside font-sans text-xs">
              <li>
                <strong>Single Best Attempt Only:</strong> Your score is your single longest uninterrupted study session ever attempted or completed. Separate sessions are never added together or averaged.
              </li>
              <li>
                <strong>Interrupted Sessions Count:</strong> If you leave the timer after 22 minutes of an hour challenge, those 22 minutes count toward your score.
              </li>
              <li>
                <strong>Previous Bests are Preserved:</strong> If you already have a 45-minute record and later get interrupted at 20 minutes, your record remains 45 minutes.
              </li>
              <li>
                <strong>Consistent Tie-Breaking:</strong> If two students achieve the same duration, the student who achieved it first ranks higher.
              </li>
            </ul>

            {/* Example Table */}
            <div className="pt-2">
              <div className="text-[11px] font-mono font-bold text-ink-400 uppercase tracking-wider mb-1.5">
                Example Scoring Breakdown:
              </div>
              <div className="overflow-x-auto rounded-xl border border-ink-800">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-ink-900 text-ink-400 border-b border-ink-800">
                    <tr>
                      <th className="p-2">Student</th>
                      <th className="p-2">Attempts</th>
                      <th className="p-2">Best Session</th>
                      <th className="p-2 text-right">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-850/80 text-ink-300">
                    <tr>
                      <td className="p-2 font-sans font-semibold text-white">Student D</td>
                      <td className="p-2">1h, 30m, 2h</td>
                      <td className="p-2 text-amber-400 font-bold">120 min</td>
                      <td className="p-2 text-right font-bold text-amber-400">#1</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-sans font-semibold text-white">Student A</td>
                      <td className="p-2">30m, 20m, 1h</td>
                      <td className="p-2 text-slate-300 font-bold">60 min</td>
                      <td className="p-2 text-right font-bold text-slate-300">#2</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-sans font-semibold text-white">Student B</td>
                      <td className="p-2">45m, 25m, 35m</td>
                      <td className="p-2 text-amber-600 font-bold">45 min</td>
                      <td className="p-2 text-right font-bold text-amber-600">#3</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-sans font-semibold text-white">Student C</td>
                      <td className="p-2">20m, 28m, 15m</td>
                      <td className="p-2 text-ink-200 font-bold">28 min</td>
                      <td className="p-2 text-right font-bold text-ink-400">#4</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 Podium (Always visible at top of page) */}
      {topThree.length > 0 && (
        <Podium entries={topThree} currentStudentId={user?.id} />
      )}

      {/* Notice if logged-in student has not recorded any attempt yet */}
      {user && !isCurrentUserInList && entries.length > 0 && (
        <div className="p-3.5 rounded-xl bg-ink-900/60 border border-ink-800 text-xs font-mono text-ink-400 flex items-center justify-between">
          <span>You haven't recorded a completed focus attempt yet.</span>
          <button
            onClick={() => navigate('/timer')}
            className="text-signal hover:underline font-bold shrink-0 ml-3 cursor-pointer"
          >
            Start Challenge →
          </button>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 ? (
        <div className="p-8 rounded-2xl bg-ink-900/40 border border-ink-800 text-center space-y-3">
          <Award className="w-10 h-10 text-ink-600 mx-auto" />
          <h3 className="font-display font-bold text-white text-base">
            No focus challenges completed yet
          </h3>
          <p className="text-xs text-ink-400 max-w-xs mx-auto">
            Be the first student to claim the #1 spot on Ahmedabad University's library leaderboard.
          </p>
          <div className="pt-2">
            <Button variant="signal" size="sm" onClick={() => navigate('/timer')}>
              Start First Challenge
            </Button>
          </div>
        </div>
      ) : (
        /* Complete Leaderboard below Podium */
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 pt-2 pb-1 text-xs font-mono font-semibold text-ink-400 uppercase tracking-wider">
            <span>Complete Rankings ({entries.length})</span>
            <span>Longest Session</span>
          </div>
          {entries.map((entry) => (
            <LeaderboardRow
              key={entry.student_id}
              ref={user?.id === entry.student_id ? myRowRef : undefined}
              entry={entry}
              isCurrentUser={user?.id === entry.student_id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
