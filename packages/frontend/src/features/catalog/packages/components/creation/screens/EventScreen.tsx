'use client';

import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useEventTypes } from '@/features/catalog/package-templates/hooks';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';
import type { WizardHandlers } from '../hooks/useWizardHandlers';
import type { EventTypeForWizard } from '../types/wizard.types';

interface EventScreenProps {
  state: WizardState;
  derived: WizardDerived;
  handlers: WizardHandlers;
}

function eventTypeCardSx(isSelected: boolean, color: string) {
  return {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1.25,
    aspectRatio: '1',
    p: 2,
    borderRadius: 2.5,
    cursor: 'pointer',
    border: '2px solid',
    borderColor: isSelected ? `${color}90` : 'rgba(148,163,184,0.16)',
    bgcolor: isSelected ? `${color}12` : 'rgba(255,255,255,0.025)',
    boxShadow: isSelected ? `0 0 0 1px ${color}30, 0 8px 24px rgba(0,0,0,0.25)` : 'none',
    transition: 'all 0.18s ease',
    '&:hover': {
      borderColor: `${color}70`,
      bgcolor: `${color}10`,
      transform: 'translateY(-3px)',
      boxShadow: `0 12px 32px rgba(0,0,0,0.3)`,
    },
  };
}

/**
 * Screen 1 — Event. Pick the event type; selecting one auto-advances to the
 * Day design step (handled by `handleEventTypeSelected`).
 */
export default function EventScreen({ state, derived, handlers }: EventScreenProps) {
  const { data: eventTypes = [], isLoading: loading, error } = useEventTypes();
  const { selectedEventType } = state;
  const { accent } = derived;

  return (
    <Box>
      <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.95rem', mb: 0.5, textAlign: 'center' }}>
        What type of event is this package for?
      </Typography>
      <Typography sx={{ color: '#64748b', fontSize: '0.78rem', mb: 3, lineHeight: 1.5, textAlign: 'center' }}>
        Choose one to start designing the day.
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} sx={{ color: accent }} />
        </Box>
      )}

      {!loading && error && (
        <Typography sx={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>
          Failed to load event types
        </Typography>
      )}

      {!loading && !error && eventTypes.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#fff', mb: 1 }}>No event types configured yet</Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
            Create event types in Settings &rarr; Templates first.
          </Typography>
        </Box>
      )}

      {!loading && !error && eventTypes.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
            gap: 1.5,
            maxWidth: eventTypes.length <= 2 ? 340 : 520,
            mx: 'auto',
          }}
        >
          {(eventTypes as unknown as EventTypeForWizard[]).map((et) => {
            const isSelected = selectedEventType?.id === et.id;
            const color = et.color || accent;

            return (
              <Box
                key={et.id}
                onClick={() => handlers.handleEventTypeSelected(et)}
                sx={eventTypeCardSx(isSelected, color)}
              >
                {isSelected && (
                  <CheckCircleIcon
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      fontSize: '1.1rem',
                      color,
                    }}
                  />
                )}
                <Box
                  sx={{
                    fontSize: '2.75rem',
                    lineHeight: 1,
                    filter: isSelected ? 'none' : 'grayscale(0.15)',
                    transition: 'transform 0.18s',
                  }}
                >
                  {et.icon || '\u{1F4CB}'}
                </Box>
                <Typography
                  sx={{
                    color: isSelected ? '#f8fafc' : '#cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 600,
                    textAlign: 'center',
                    lineHeight: 1.25,
                    px: 0.5,
                  }}
                >
                  {et.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
