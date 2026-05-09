import type { SxProps, Theme } from '@mui/material';

/** Shared padding for every tab panel inside the package detail right-panel. */
export const tabPanelPadding: SxProps<Theme> = { px: 2.5, pb: 3, pt: 1.5 };

/** Glass-morphism card surface used by detail cards (Subjects, Locations, Crew, Equipment, Content). */
export const detailGlassCardSx = {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 2,
    boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
    px: 2, pt: 2, pb: 1.5,
} as const;

/** Header cell styling for compact mini-tables inside detail cards. */
export const detailHeaderCellSx = {
    py: 1,
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
} as const;

/** Body cell styling for compact mini-tables inside detail cards. */
export const detailBodyCellSx = {
    py: 0.75,
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    fontSize: '0.72rem',
} as const;
