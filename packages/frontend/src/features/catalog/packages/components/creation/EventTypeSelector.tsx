'use client';

import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useEventTypes } from '@/features/catalog/event-types/hooks';

// ── Types matching backend deep include ──────────────────────────────

interface PresetMoment {
  id: number;
  name: string;
  duration_seconds: number;
  is_key_moment: boolean;
}

interface ActivityPreset {
  id: number;
  name: string;
  color?: string;
  default_duration_minutes?: number;
  default_start_time?: string;
  moments: PresetMoment[];
}

interface EventDay {
  id: number;
  name: string;
  description?: string;
  activity_presets: ActivityPreset[];
}

interface SubjectRole {
  id: number;
  role_name: string;
  is_core: boolean;
  is_group: boolean;
  never_group: boolean;
}

interface SubjectType {
  id: number;
  name: string;
  description?: string;
  roles: SubjectRole[];
}

interface EventTypeDay {
  id: number;
  order_index: number;
  is_default: boolean;
  event_day_template: EventDay;
}

interface EventTypeSubject {
  id: number;
  order_index: number;
  is_default: boolean;
  subject_type_template: SubjectType;
}

export interface EventTypeForWizard {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  default_duration_hours?: number;
  default_start_time?: string;
  typical_guest_count?: number;
  event_days: EventTypeDay[];
  subject_types: EventTypeSubject[];
}

interface EventTypeSelectorProps {
  onEventTypeSelected: (eventType: EventTypeForWizard) => void;
  selectedEventTypeId?: number;
}

export default function EventTypeSelector({
  onEventTypeSelected,
  selectedEventTypeId,
}: EventTypeSelectorProps) {
  const { data: eventTypes = [], isLoading: loading, error } = useEventTypes();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} sx={{ color: '#f59e0b' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography sx={{ color: '#ef4444', fontSize: '0.85rem' }}>Failed to load event types</Typography>
      </Box>
    );
  }

  if (eventTypes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography sx={{ color: '#fff', mb: 1 }}>No event types configured yet</Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
          Create event types in Settings → Templates first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
      {(eventTypes as unknown as EventTypeForWizard[]).map((et) => {
        const isSelected = selectedEventTypeId === et.id;
        const color = et.color || '#f59e0b';

        return (
          <Box
            key={et.id}
            onClick={() => onEventTypeSelected(et)}
            sx={{
              borderRadius: 2.5,
              cursor: 'pointer',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: isSelected
                ? `${color}60`
                : 'rgba(52, 58, 68, 0.3)',
              bgcolor: isSelected
                ? 'rgba(16, 18, 22, 0.95)'
                : 'rgba(16, 18, 22, 0.85)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: `${color}50`,
                bgcolor: 'rgba(16, 18, 22, 0.95)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              },
            }}
          >
            {/* Top accent bar */}
            <Box
              sx={{
                height: 2,
                background: `linear-gradient(90deg, ${color}, ${color}80)`,
              }}
            />

            <Box sx={{ px: 2, py: 1.5 }}>
              {/* Icon + Name + Description */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${color}15`,
                    border: `1px solid ${color}25`,
                    fontSize: '1.3rem',
                    flexShrink: 0,
                  }}
                >
                  {et.icon || '📋'}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: '#f1f5f9',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {et.name}
                  </Typography>
                  {et.description && (
                    <Typography
                      sx={{
                        color: '#64748b',
                        fontSize: '0.72rem',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {et.description}
                    </Typography>
                  )}
                </Box>
                {isSelected && (
                  <CheckCircleIcon sx={{ fontSize: '1.2rem', color, flexShrink: 0 }} />
                )}
              </Box>

              {/* Compact stats */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <CalendarMonthIcon sx={{ fontSize: 12, color }} />
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      color: '#94a3b8',
                      fontWeight: 600,
                    }}
                  >
                    {et.event_days.length} day{et.event_days.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
