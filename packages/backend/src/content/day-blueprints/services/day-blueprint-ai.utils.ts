export function normalizeRoleName(value: string): string {
  return value.trim().toLowerCase().replace(/honou?r/g, 'honor').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function stableKey(value: string): string {
  return normalizeRoleName(value).replace(/ /g, '_');
}

export function clampInt(value: number | undefined, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, Math.round(value)));
}
