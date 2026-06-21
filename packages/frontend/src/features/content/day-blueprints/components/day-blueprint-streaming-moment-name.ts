/**
 * Some streaming models append a trailing "(Generating...)" (or similar) to
 * moment titles. Strip that for rail display so we can use shimmer instead.
 */
export function sanitizeStreamingMomentDisplayName(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\s*\(Generating[^)]*\)\s*$/i, '').trim();
}
