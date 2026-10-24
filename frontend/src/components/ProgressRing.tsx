import React from 'react';

interface ProgressRingProps {
  progressPercentage: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progressPercentage,
  size = 320,
  strokeWidth = 8,
  children,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth - 14;
  const circumference = 2 * Math.PI * radius;

  // Clamped percentage
  const clampedProgress = Math.max(0, Math.min(100, progressPercentage));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Calculate tip indicator position
  const angle = (clampedProgress / 100) * 360 - 90;
  const angleRad = (angle * Math.PI) / 180;
  const tipX = center + radius * Math.cos(angleRad);
  const tipY = center + radius * Math.sin(angleRad);

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 origin-center drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
      >
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#171A1E"
          strokeWidth={strokeWidth}
        />

        {/* Subtle sub-ticks / radial divisions */}
        <circle
          cx={center}
          cy={center}
          r={radius + strokeWidth + 4}
          fill="none"
          stroke="#21252B"
          strokeWidth={1}
          strokeDasharray="2 12"
          opacity={0.6}
        />

        {/* Dynamic Progress Stroke */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#FF5722"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-linear"
        />

        {/* Playhead indicator beacon */}
        {clampedProgress > 0 && clampedProgress < 100 && (
          <circle
            cx={tipX}
            cy={tipY}
            r={5}
            fill="#FFFFFF"
            className="drop-shadow-[0_0_8px_#FF5722]"
          />
        )}
      </svg>

      {/* Central content slot */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        {children}
      </div>
    </div>
  );
};
