/**
 * Format total seconds into HH:MM:SS or MM:SS
 */
export function formatSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format seconds into human readable duration, e.g. "1h 45m" or "30m" or "45s"
 */
export function formatDurationDisplay(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Sanitize and format display name to ensure full university email addresses
 * are never exposed in UI or leaderboards.
 */
export function formatDisplayName(name?: string | null): string {
  if (!name || !name.trim()) return 'Student';
  let cleaned = name.trim();
  // Strip email domain if present
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[0];
  }
  // If dot-separated e.g. "bhumika.j", format nicely as "Bhumika J"
  if (cleaned.includes('.') || cleaned.includes('_')) {
    const tokens = cleaned.replace(/[._]/g, ' ').split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      return tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
    }
  }
  return cleaned;
}

/**
 * Extract 2-character uppercase initials from name
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'AU';
  let cleaned = name.trim();
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[0];
  }
  const parts = cleaned.replace(/[._]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

/**
 * Format date timestamp to short readable format
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
