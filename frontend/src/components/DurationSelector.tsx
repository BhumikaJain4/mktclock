import React, { useState } from 'react';
import { Clock, ShieldAlert, Sparkles, Plus, Minus } from 'lucide-react';
import { Button } from './Button';

interface DurationSelectorProps {
  onStartChallenge: (minutes: number) => Promise<void>;
  isStarting: boolean;
  personalBestSeconds: number;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  onStartChallenge,
  isStarting,
  personalBestSeconds,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState<string>('45');
  const [isCustomActive, setIsCustomActive] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const presets = [
    { minutes: 30, label: '30 MIN', sub: 'Standard Session' },
    { minutes: 60, label: '1 HOUR', sub: 'Deep Study Block' },
    { minutes: 120, label: '2 HOURS', sub: 'Immersive Marathon' },
  ];

  const handleSelectPreset = (minutes: number) => {
    setSelectedMinutes(minutes);
    setIsCustomActive(false);
    setCustomError(null);
  };

  const handleCustomChange = (valStr: string) => {
    setCustomMinutes(valStr);
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 240) {
      setCustomError('Enter between 1 and 240 minutes.');
    } else {
      setCustomError(null);
      setSelectedMinutes(parsed);
    }
  };

  const adjustCustom = (delta: number) => {
    const current = parseInt(customMinutes, 10) || 30;
    const next = Math.max(1, Math.min(240, current + delta));
    setCustomMinutes(next.toString());
    setSelectedMinutes(next);
    setIsCustomActive(true);
    setCustomError(null);
  };

  const handleStart = async () => {
    const minutesToUse = isCustomActive ? parseInt(customMinutes, 10) : selectedMinutes;
    if (isNaN(minutesToUse) || minutesToUse < 1 || minutesToUse > 240) {
      setCustomError('Please choose a duration between 1 and 240 minutes.');
      return;
    }
    await onStartChallenge(minutesToUse);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Session Duration Selector Heading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink-900 border border-ink-800 text-xs font-mono text-ink-300">
          <Clock className="w-3.5 h-3.5 text-signal" />
          <span>CHOOSE TARGET IMMERSION</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
          Commit to Unbroken Focus
        </h2>
        <p className="text-xs sm:text-sm text-ink-400 max-w-sm mx-auto">
          The timer page must stay open and visible on your screen. Any tab switch or phone lock immediately logs your attempt.
        </p>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {presets.map((preset) => {
          const isSelected = !isCustomActive && selectedMinutes === preset.minutes;
          return (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => handleSelectPreset(preset.minutes)}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer text-center select-none ${
                isSelected
                  ? 'bg-signal/10 border-signal shadow-signal-glow text-white'
                  : 'bg-ink-900/80 border-ink-800 hover:border-ink-700 text-ink-300 hover:text-white'
              }`}
            >
              <span className={`text-base sm:text-lg font-mono font-bold ${isSelected ? 'text-signal' : ''}`}>
                {preset.label}
              </span>
              <span className="text-[10px] text-ink-400 mt-0.5 line-clamp-1">
                {preset.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Duration Input */}
      <div className={`p-4 rounded-xl border transition-all ${
        isCustomActive
          ? 'bg-ink-900 border-signal/80 shadow-signal-glow'
          : 'bg-ink-900/40 border-ink-800 hover:border-ink-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-300">
              Custom Duration
            </div>
            <div className="text-[11px] text-ink-400">
              Between 1 and 240 minutes
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustCustom(-5)}
              className="w-8 h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-200 flex items-center justify-center cursor-pointer border border-ink-700"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <input
                type="number"
                min="1"
                max="240"
                value={customMinutes}
                onFocus={() => {
                  setIsCustomActive(true);
                  const p = parseInt(customMinutes, 10);
                  if (!isNaN(p)) setSelectedMinutes(p);
                }}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-16 h-8 text-center font-mono font-bold text-sm bg-ink-950 border border-ink-700 rounded-lg text-white focus:border-signal focus:outline-none"
              />
              <span className="absolute -top-4 right-0 text-[9px] font-mono text-ink-400">min</span>
            </div>

            <button
              type="button"
              onClick={() => adjustCustom(5)}
              className="w-8 h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-200 flex items-center justify-center cursor-pointer border border-ink-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {customError && (
          <div className="mt-2 text-xs text-red-400 font-mono">
            {customError}
          </div>
        )}
      </div>

      {/* Rules Notice */}
      <div className="p-3.5 rounded-xl bg-ink-900/60 border border-ink-800/80 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-200">
          <ShieldAlert className="w-4 h-4 text-signal shrink-0" />
          <span>LIBRARY CHALLENGE RULES</span>
        </div>
        <ul className="text-xs text-ink-400 space-y-1.5 list-disc list-inside">
          <li>Keep your browser open and visible on screen.</li>
          <li>Locking your phone or switching apps concludes the attempt.</li>
          <li>Your leaderboard rank reflects your <strong>highest single attempt ever</strong>.</li>
          <li>Screen wake-lock will be activated automatically.</li>
        </ul>
      </div>

      {/* Personal Best comparison callout if existing */}
      {personalBestSeconds > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-ink-900/40 border border-ink-800 text-xs">
          <span className="text-ink-400 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            CURRENT PERSONAL BEST
          </span>
          <span className="font-mono font-bold text-amber-400">
            {Math.floor(personalBestSeconds / 60)}m {personalBestSeconds % 60}s
          </span>
        </div>
      )}

      {/* Start Button */}
      <Button
        variant="signal"
        size="xl"
        className="w-full text-base"
        isLoading={isStarting}
        disabled={isStarting || !!customError}
        onClick={handleStart}
      >
        START CHALLENGE
      </Button>
    </div>
  );
};
