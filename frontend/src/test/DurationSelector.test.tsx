import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DurationSelector } from '../components/DurationSelector';

describe('DurationSelector component', () => {
  it('renders presets: 30 MIN, 1 HOUR, 2 HOURS', () => {
    const handleStart = vi.fn();
    render(
      <DurationSelector
        onStartChallenge={handleStart}
        isStarting={false}
        personalBestSeconds={0}
      />
    );

    expect(screen.getByText('30 MIN')).toBeInTheDocument();
    expect(screen.getByText('1 HOUR')).toBeInTheDocument();
    expect(screen.getByText('2 HOURS')).toBeInTheDocument();
    expect(screen.getByText('START CHALLENGE')).toBeInTheDocument();
  });

  it('selects preset and triggers onStartChallenge with selected minutes', async () => {
    const handleStart = vi.fn();
    render(
      <DurationSelector
        onStartChallenge={handleStart}
        isStarting={false}
        personalBestSeconds={0}
      />
    );

    const oneHourBtn = screen.getByText('1 HOUR');
    fireEvent.click(oneHourBtn);

    const startBtn = screen.getByText('START CHALLENGE');
    fireEvent.click(startBtn);

    expect(handleStart).toHaveBeenCalledWith(60);
  });

  it('displays personal best callout when student has existing record', () => {
    const handleStart = vi.fn();
    render(
      <DurationSelector
        onStartChallenge={handleStart}
        isStarting={false}
        personalBestSeconds={2700} // 45 mins
      />
    );

    expect(screen.getByText('CURRENT PERSONAL BEST')).toBeInTheDocument();
    expect(screen.getByText('45m 0s')).toBeInTheDocument();
  });
});
