export const SANDBOX_LOCATION_ROLE_KEY = 'sandbox';
export const SANDBOX_LOCATION_ROLE_LABEL = 'Sandbox';
export const SANDBOX_LOCATION_ROLE_DESCRIPTION =
  'Generic sandbox location for drafting placements before real venue mappings are added.';

export function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/honou?r/g, 'honor')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeLabel(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim().replace(/\s+/g, ' ');
  return trimmed.length > 0 ? trimmed : null;
}

export function toStableKey(value: string): string {
  return normalizeName(value).replace(/ /g, '_');
}

export const WEDDING_PRIMARY_ROLES = new Set(['bride', 'groom']);
export const WEDDING_TYPICAL_COUNTS = new Map<string, number>([
  ['bridesmaids', 4],
  ['groomsmen', 4],
  ['guests', 50],
]);
