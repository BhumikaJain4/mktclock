import { describe, it, expect } from 'vitest';
import { formatSeconds, formatDurationDisplay, getInitials } from '../utils/formatters';

describe('formatters utility functions', () => {
  it('formats seconds into MM:SS correctly', () => {
    expect(formatSeconds(0)).toBe('00:00');
    expect(formatSeconds(45)).toBe('00:45');
    expect(formatSeconds(65)).toBe('01:05');
    expect(formatSeconds(1799)).toBe('29:59');
  });

  it('formats hours into HH:MM:SS when duration exceeds 3600 seconds', () => {
    expect(formatSeconds(3600)).toBe('01:00:00');
    expect(formatSeconds(3665)).toBe('01:01:05');
    expect(formatSeconds(7200)).toBe('02:00:00');
  });

  it('formats human duration display accurately', () => {
    expect(formatDurationDisplay(1800)).toBe('30m');
    expect(formatDurationDisplay(3600)).toBe('1h');
    expect(formatDurationDisplay(5400)).toBe('1h 30m');
    expect(formatDurationDisplay(45)).toBe('45s');
  });

  it('extracts two uppercase initials from student name', () => {
    expect(getInitials('Aarav Patel')).toBe('AP');
    expect(getInitials('Diya Shah')).toBe('DS');
    expect(getInitials('Rohan')).toBe('RO');
    expect(getInitials('')).toBe('AU');
    expect(getInitials(null)).toBe('AU');
  });
});
