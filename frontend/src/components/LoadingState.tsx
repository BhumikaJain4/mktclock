import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Synchronizing focus session...' }) => {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-ink-800 border-t-signal animate-spin" />
      </div>
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-widest text-ink-400">
          SANCTUM ACTIVE SYSTEM
        </div>
        <p className="text-sm font-medium text-ink-300">
          {message}
        </p>
      </div>
    </div>
  );
};
