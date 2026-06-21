export function normalizeCategory(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

export function buildDefaultBlueprintName(eventCategory: string | undefined): string {
  if (!eventCategory?.trim()) return 'Package Day Design';
  return `${eventCategory.trim()} Day Design`;
}

export function libraryTileSx(accent: string, disabled = false) {
  return {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0.75,
    p: 1.75,
    borderRadius: 2,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid',
    borderColor: 'rgba(148,163,184,0.14)',
    bgcolor: 'rgba(255,255,255,0.02)',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.18s',
    minHeight: 112,
    '&:hover': disabled
      ? {}
      : {
          borderColor: `${accent}55`,
          bgcolor: `${accent}08`,
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px rgba(0,0,0,0.25)`,
        },
  };
}
