import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import { getEventTypeDays } from '../helpers/wizard-helpers';

interface EventDaysStepProps {
  state: WizardState;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

export default function EventDaysStep({ state, derived, handlers }: EventDaysStepProps) {
  const { selectedEventType, selectedDayIds } = state;
  const { accent } = derived;

  if (!selectedEventType) return null;

  const days = [...getEventTypeDays(selectedEventType)].sort((a, b) => a.order_index - b.order_index);

  return (
    <Box>
      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>Which days does this event include?</Typography>
      <Box sx={{
        display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1,
        scrollSnapType: 'x mandatory',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(148,163,184,0.2)', borderRadius: 2 },
      }}>
        {days.map((link) => {
          const day = link.event_day_template;
          const isSelected = selectedDayIds.has(link.id);
          const activityCount = day.activity_presets?.length || 0;
          return (
            <Box key={link.id} onClick={() => handlers.toggleDay(link.id)} sx={{
              flex: '0 0 calc((100% - 6 * 12px) / 5)', minWidth: 120, scrollSnapAlign: 'start',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 1, p: 2, borderRadius: 2, cursor: 'pointer', border: '2px solid',
              borderColor: isSelected ? accent : 'rgba(148,163,184,0.12)',
              bgcolor: isSelected ? `${accent}0A` : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s',
              '&:hover': { borderColor: isSelected ? accent : 'rgba(148,163,184,0.3)', transform: 'translateY(-1px)' },
            }}>
              {isSelected && <CheckCircleIcon sx={{ fontSize: '1.2rem', color: accent }} />}
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.3 }}>{day.name}</Typography>
              {day.description && (
                <Typography sx={{ color: '#64748b', fontSize: '0.65rem', textAlign: 'center', lineHeight: 1.3,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {day.description}
                </Typography>
              )}
              <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>{activityCount} activities</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
