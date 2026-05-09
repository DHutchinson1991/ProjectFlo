/**
 * Shared pure helpers used by both the workflow/scheduling (Package) adapters
 * and the content/day-blueprints (Blueprint) adapters when mapping domain data
 * into PackageTimeline / PackageActivityTable props.
 */

export const ACTIVITY_COLORS = [
  '#f59e0b', '#10b981', '#648CFF', '#ec4899',
  '#a855f7', '#0ea5e9', '#ef4444', '#f97316',
  '#14b8a6', '#8b5cf6', '#06b6d4', '#d946ef',
];

export function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/** Format a minute count as a human-readable duration string, e.g. "1h 30m". */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

/** Format a second count as a human-readable duration string, e.g. "2m 30s". */
export function formatSeconds(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (remainder === 0) return `${minutes}m`;
  return `${minutes}m ${remainder}s`;
}
