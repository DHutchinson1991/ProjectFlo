import React, { useEffect } from 'react';
import { Box, Typography, TextField, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';

interface PackageNameStepProps {
  state: WizardState;
  derived: WizardDerived;
}

export default function PackageNameStep({ state, derived }: PackageNameStepProps) {
  const { selectedEventType, packageName } = state;
  const { accent, stats } = derived;

  // Auto-generate name if empty when step loads
  useEffect(() => {
    if (packageName || !selectedEventType) return;
    const dayCount = stats.days;
    const activityCount = stats.activities;
    const dayLabel = dayCount > 1 ? `${dayCount}-Day ` : '';
    const actLabel = activityCount > 5 ? 'Premium' : activityCount > 3 ? 'Standard' : 'Essential';
    state.setPackageName(`${actLabel} ${dayLabel}${selectedEventType.name} Package`);
  }, []);

  if (!selectedEventType) return null;

  const suggestions = [
    `${selectedEventType.name} Package`,
    `Premium ${selectedEventType.name} Package`,
    `${selectedEventType.name} Essential`,
    stats.days > 1 ? `${stats.days}-Day ${selectedEventType.name} Package` : null,
  ].filter(Boolean) as string[];

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto' }}>
      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>Name your package</Typography>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, mb: 2, borderRadius: 1, bgcolor: `${accent}12`, border: `1px solid ${accent}30` }}>
        <Typography sx={{ color: accent, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Type:</Typography>
        <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{selectedEventType.icon || ''} {selectedEventType.name}</Typography>
      </Box>
      <Box>
        <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Package Name</Typography>
        <TextField value={packageName} onChange={(e) => state.setPackageName(e.target.value)} placeholder={`e.g., Premium ${selectedEventType.name} Package`}
          fullWidth autoFocus sx={{ '& .MuiOutlinedInput-root': { color: '#fff', fontSize: '1.2rem', fontWeight: 600, bgcolor: 'rgba(255,255,255,0.03)',
            '& fieldset': { borderColor: `${accent}50`, borderWidth: 2 }, '&:hover fieldset': { borderColor: `${accent}80` }, '&.Mui-focused fieldset': { borderColor: accent } } }} />
        <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mt: 1 }}>This name will be visible to your clients. You can change it later.</Typography>
      </Box>


      {/* Quick suggestions */}
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <AutoAwesomeIcon sx={{ fontSize: '0.7rem', color: '#64748b' }} />
          <Typography sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Suggestions</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {suggestions.map((s) => (
            <Chip key={s} label={s} size="small" onClick={() => state.setPackageName(s)}
              sx={{ height: 24, fontSize: '0.7rem', cursor: 'pointer', border: '1px solid rgba(148,163,184,0.15)',
                bgcolor: packageName === s ? `${accent}15` : 'rgba(255,255,255,0.03)',
                color: packageName === s ? accent : '#94a3b8',
                '&:hover': { bgcolor: `${accent}10`, color: accent },
              }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
