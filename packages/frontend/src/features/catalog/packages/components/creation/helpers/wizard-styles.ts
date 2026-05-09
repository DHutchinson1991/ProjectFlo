export const listRowSx = (selected: boolean, color = '#10b981') => ({
  display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1,
  borderRadius: 1.5, cursor: 'pointer', transition: 'all 0.15s',
  bgcolor: selected ? `${color}0A` : 'transparent',
  '&:hover': { bgcolor: selected ? `${color}10` : 'rgba(255,255,255,0.03)' },
});

export const checkboxSx = (selected: boolean, color = '#10b981') => ({
  width: 18, height: 18, borderRadius: '4px',
  border: `2px solid ${selected ? color : 'rgba(148,163,184,0.3)'}`,
  bgcolor: selected ? color : 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, transition: 'all 0.15s',
  '& svg': { fontSize: '0.75rem', color: '#fff' },
});

export const miniInputSx = (accent: string) => ({
  '& .MuiOutlinedInput-root': {
    color: '#cbd5e1', fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.03)',
    '& fieldset': { borderColor: 'rgba(148,163,184,0.15)' },
    '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.3)' },
    '&.Mui-focused fieldset': { borderColor: accent },
  },
  '& .MuiOutlinedInput-input': { py: '3px', px: '6px' },
});

export const sectionBtnSx = (color: string) => ({
  px: 1, py: 0.25, bgcolor: 'transparent',
  border: `1px solid ${color}40`, borderRadius: 0.75, color,
  cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
  '&:hover': { bgcolor: `${color}0A` },
});
