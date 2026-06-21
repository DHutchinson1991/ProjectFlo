export type SandboxSpaceKind = 'ceremony' | 'reception' | 'prep' | 'portraits' | 'cocktail' | 'generic';

export function resolveSandboxSpaceKind(parts: {
  slotKey?: string | null;
  slotLabel?: string | null;
  activityName?: string | null;
  activityDescription?: string | null;
  label?: string | null;
}): SandboxSpaceKind {
  const text = [
    parts.slotKey,
    parts.slotLabel,
    parts.label,
    parts.activityName,
    parts.activityDescription,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/portrait|photoshoot|first look|family group|bridal party/.test(text)) return 'portraits';
  if (/prep|preparation|makeup|hair|dressing|getting ready/.test(text)) return 'prep';
  if (/reception|dinner|toast|dance|first dance|head table|banquet/.test(text)) return 'reception';
  if (/ceremony|vow|altar|aisle|church|chapel|catholic|processional|ring ceremony/.test(text)) return 'ceremony';
  if (/cocktail|line|queue|hour|welcome/.test(text)) return 'cocktail';
  return 'generic';
}
