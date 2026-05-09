import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useEventTypes } from '@/features/catalog/package-templates/hooks';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import type { EventTypeForWizard } from '../types/wizard.types';

interface EventTypeStepProps {
  state: WizardState;
  handlers: WizardHandlers;
}

export default function EventTypeStep({ state, handlers }: EventTypeStepProps) {
  const { data: eventTypes = [], isLoading: loading, error } = useEventTypes();

  return (
    <Box>
      <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2.5 }}>What type of event is this package for?</Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: '#f59e0b' }} />
        </Box>
      )}

      {!loading && error && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#ef4444', fontSize: '0.85rem' }}>Failed to load event types</Typography>
        </Box>
      )}

      {!loading && !error && eventTypes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ color: '#fff', mb: 1 }}>No event types configured yet</Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
            Create event types in Settings → Templates first.
          </Typography>
        </Box>
      )}

      {!loading && !error && eventTypes.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          {(eventTypes as unknown as EventTypeForWizard[]).map((et) => {
            const isSelected = state.selectedEventType?.id === et.id;
            const color = et.color || '#f59e0b';

            return (
              <Box
                key={et.id}
                onClick={() => handlers.handleEventTypeSelected(et)}
                sx={{
                  borderRadius: 2.5, cursor: 'pointer', overflow: 'hidden',
                  border: '1px solid',
                  borderColor: isSelected ? `${color}60` : 'rgba(52, 58, 68, 0.3)',
                  bgcolor: isSelected ? 'rgba(16, 18, 22, 0.95)' : 'rgba(16, 18, 22, 0.85)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: `${color}50`, bgcolor: 'rgba(16, 18, 22, 0.95)',
                    transform: 'translateY(-1px)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  },
                }}
              >
                <Box sx={{ height: 2, background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: 1.5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: `${color}15`, border: `1px solid ${color}25`,
                      fontSize: '1.3rem', flexShrink: 0,
                    }}>
                      {et.icon || '📋'}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
                        {et.name}
                      </Typography>
                      {et.description && (
                        <Typography sx={{
                          color: '#64748b', fontSize: '0.72rem', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {et.description}
                        </Typography>
                      )}
                    </Box>
                    {isSelected && <CheckCircleIcon sx={{ fontSize: '1.2rem', color, flexShrink: 0 }} />}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <CalendarMonthIcon sx={{ fontSize: 12, color }} />
                      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                        {et.event_days.length} day{et.event_days.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
