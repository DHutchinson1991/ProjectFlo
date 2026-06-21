/**
 * Detect activities that share ceremony space geometry but should not use the
 * full ceremony timeline union (all moments + regex-expanded roles) on the floor plan.
 */
export function normalizeActivityNameForPreCeremonyCheck(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/honou?r/g, 'honor')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isPreCeremonyFloorActivity(activity: { name?: string | null } | null | undefined): boolean {
  const raw = activity?.name?.trim() ?? '';
  if (!raw) return false;
  if (/^\s*pre[-\s]?ceremony\b/i.test(raw)) return true;
  const normalized = normalizeActivityNameForPreCeremonyCheck(raw);
  return normalized.startsWith('pre ceremony');
}
