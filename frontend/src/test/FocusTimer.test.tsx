import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusTimer } from '../components/FocusTimer';

describe('FocusTimer component', () => {
  it('renders remaining countdown digits and logged seconds', () => {
    const handleEnd = vi.fn();
    render(
      <FocusTimer
        remainingSeconds={1200}
        elapsedSeconds={600}
        progressPercentage={33.33}
        targetSeconds={1800}
        wakeLockStatus="active"
        personalBestSeconds={1800}
        onEndManually={handleEnd}
        isEnding={false}
      />
    );

    // 1200 seconds is 20:00
    expect(screen.getByText('20:00')).toBeInTheDocument();
    expect(screen.getByText('+10:00 logged')).toBeInTheDocument();
    expect(screen.getByText('SCREEN AWAKE')).toBeInTheDocument();
    expect(screen.getByText('CONCLUDE CHALLENGE EARLY')).toBeInTheDocument();
  });

  it('opens confirmation modal before early conclusion', () => {
    const handleEnd = vi.fn();
    render(
      <FocusTimer
        remainingSeconds={1200}
        elapsedSeconds={600}
        progressPercentage={33.33}
        targetSeconds={1800}
        wakeLockStatus="active"
        personalBestSeconds={1800}
        onEndManually={handleEnd}
        isEnding={false}
      />
    );

    const endBtn = screen.getByText('CONCLUDE CHALLENGE EARLY');
    fireEvent.click(endBtn);

    expect(screen.getByText('End challenge now?')).toBeInTheDocument();
    expect(screen.getByText('Stay Focused')).toBeInTheDocument();
    expect(screen.getByText('End & Save')).toBeInTheDocument();
  });
});
