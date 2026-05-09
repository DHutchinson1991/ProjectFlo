import React from 'react';
import { Box, Typography, TextField, MenuItem, Chip } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';
import { getEventTypeGuestRole, STANDARD_GUEST_OPTIONS } from '../helpers/wizard-helpers';

interface StandardGuestsStepProps {
  state: WizardState;
  derived: WizardDerived;
}

export default function StandardGuestsStep({ state, derived }: StandardGuestsStepProps) {
  const { selectedEventType, selectedRoleIds, standardGuestCount } = state;
  const { accent } = derived;

  if (!selectedEventType) return null;

  const guestRole = getEventTypeGuestRole(selectedEventType);
  const showStandardGuests = !!guestRole && selectedRoleIds.has(guestRole.id);

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto' }}>
      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>
        Set the standard guest count for this package
      </Typography>

      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, mb: 2.5, borderRadius: 1, bgcolor: `${accent}12`, border: `1px solid ${accent}30` }}>
        <GroupsIcon sx={{ fontSize: '0.9rem', color: accent }} />
        <Typography sx={{ color: accent, fontSize: '0.75rem', fontWeight: 600 }}>
          Standard Guests
        </Typography>
      </Box>

      {showStandardGuests ? (
        <>
          <TextField
            select
            fullWidth
            value={String(standardGuestCount)}
            onChange={(event) => state.setStandardGuestCount(Number(event.target.value))}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                bgcolor: 'rgba(255,255,255,0.03)',
                '& fieldset': { borderColor: `${accent}50`, borderWidth: 2 },
                '&:hover fieldset': { borderColor: `${accent}80` },
                '&.Mui-focused fieldset': { borderColor: accent },
              },
            }}
          >
            {STANDARD_GUEST_OPTIONS.map((option) => (
              <MenuItem key={option} value={String(option)}>{option}</MenuItem>
            ))}
          </TextField>

          <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mt: 1 }}>
            This seeds the Guests group count so the package People tab opens with the right headcount.
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 2 }}>
            {STANDARD_GUEST_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={`${option} guests`}
                size="small"
                onClick={() => state.setStandardGuestCount(option)}
                sx={{
                  height: 26,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(148,163,184,0.15)',
                  bgcolor: standardGuestCount === option ? `${accent}15` : 'rgba(255,255,255,0.03)',
                  color: standardGuestCount === option ? accent : '#94a3b8',
                  '&:hover': { bgcolor: `${accent}10`, color: accent },
                }}
              />
            ))}
          </Box>
        </>
      ) : (
        <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.12)' }}>
          <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>
            Guests are not enabled for this event template
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
            You can still continue and adjust people later from the package editor if needed.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
