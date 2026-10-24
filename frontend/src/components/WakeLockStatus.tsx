import React from 'react';
import { Sun, SunDim, AlertCircle } from 'lucide-react';
import { WakeLockState } from '../hooks/useScreenWakeLock';

interface WakeLockStatusProps {
  status: WakeLockState;
}

export const WakeLockStatus: React.FC<WakeLockStatusProps> = ({ status }) => {
  if (status === 'active') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <Sun className="w-3 h-3 text-emerald-400" />
        <span>SCREEN AWAKE</span>
      </div>
    );
  }

  if (status === 'unsupported' || status === 'denied') {
    return (
      <div 
        title="Screen wake-lock is unavailable in this browser. Keep your screen touched to avoid sleep."
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-800/80 border border-ink-700/60 text-ink-400 text-[11px] font-mono select-none"
      >
        <SunDim className="w-3 h-3 text-ink-400" />
        <span>KEEP SCREEN ON</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-900 border border-ink-800 text-ink-500 text-[11px] font-mono select-none">
      <AlertCircle className="w-3 h-3" />
      <span>STANDBY</span>
    </div>
  );
};
