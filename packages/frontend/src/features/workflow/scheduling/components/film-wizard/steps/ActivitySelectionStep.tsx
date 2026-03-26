'use client';

import React from 'react';
import {
  Typography,
  Box,
  Button,
  Checkbox,
  Stack,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { FilmType } from '@/lib/types/domains/film';
import type { PackageActivityRecord } from '../FilmCreationWizard';

interface ActivitySelectionStepProps {
  activities: PackageActivityRecord[];
  selectedActivityIds: Set<number>;
  filmType: FilmType;
  onToggleActivity: (id: number) => void;
  onToggleAll: () => void;
  disabled: boolean;
}

export function ActivitySelectionStep({
  activities,
  selectedActivityIds,
  filmType,
  onToggleActivity,
  onToggleAll,
  disabled,
}: ActivitySelectionStepProps) {
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.package_event_day_id !== b.package_event_day_id) return a.package_event_day_id - b.package_event_day_id;
    if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
    return a.name.localeCompare(b.name);
  });

  const allSelected = selectedActivityIds.size === activities.length && activities.length > 0;
  const isSingleSelect = filmType === FilmType.ACTIVITY;

  const totalMoments = activities
    .filter(a => selectedActivityIds.has(a.id))
    .reduce((sum, a) => sum + (a.moments?.length || 0), 0);

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}
          >
            {isSingleSelect ? 'Select Activity' : 'Select Activities'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.68rem', display: 'block', mt: 0.25 }}>
            {filmType === FilmType.ACTIVITY && 'Pick 1 activity — it becomes the single scene in your film.'}
            {filmType === FilmType.FEATURE && 'Pick activities in order — each becomes a scene with its moments.'}
            {filmType === FilmType.MONTAGE && 'Pick activities to source footage from — you\'ll assign them to scenes next.'}
          </Typography>
        </Box>
        {!isSingleSelect && (
          <Button
            size="small"
            onClick={onToggleAll}
            disabled={disabled || activities.length === 0}
            sx={{ color: '#648CFF', textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, minWidth: 0, px: 1 }}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </Box>

      {activities.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px dashed rgba(52, 58, 68, 0.4)' }}>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>
            No activities found. Add activities to the schedule first.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.5} sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
          {sortedActivities.map((activity) => {
            const isSelected = selectedActivityIds.has(activity.id);
            const momentCount = activity.moments?.length || 0;
            return (
              <Box
                key={activity.id}
                onClick={() => !disabled && onToggleActivity(activity.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1.5,
                  cursor: disabled ? 'default' : 'pointer',
                  bgcolor: isSelected ? 'rgba(100, 140, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(100, 140, 255, 0.25)' : 'rgba(52, 58, 68, 0.2)'}`,
                  transition: 'all 0.15s ease',
                  opacity: disabled ? 0.6 : 1,
                  '&:hover': !disabled ? {
                    bgcolor: isSelected ? 'rgba(100, 140, 255, 0.12)' : 'rgba(255,255,255,0.04)',
                  } : undefined,
                }}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={disabled}
                  size="small"
                  sx={{
                    p: 0.25,
                    color: 'rgba(100, 116, 139, 0.5)',
                    '&.Mui-checked': { color: '#648CFF' },
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: '0.82rem', color: isSelected ? '#f1f5f9' : '#94a3b8', lineHeight: 1.3 }}
                  >
                    {activity.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                    {activity.start_time && (
                      <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <AccessTimeIcon sx={{ fontSize: 10 }} />
                        {activity.start_time}{activity.end_time ? `–${activity.end_time}` : ''}
                      </Typography>
                    )}
                    {momentCount > 0 && (
                      <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.68rem' }}>
                        {momentCount} moment{momentCount !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Summary */}
      {selectedActivityIds.size > 0 && (
        <Box sx={{
          p: 1.5, borderRadius: 2,
          bgcolor: 'rgba(100, 140, 255, 0.06)',
          border: '1px solid rgba(100, 140, 255, 0.15)',
        }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
            <strong style={{ color: '#f1f5f9' }}>{selectedActivityIds.size}</strong> activit{selectedActivityIds.size !== 1 ? 'ies' : 'y'} selected
            {totalMoments > 0 && (
              <> with <strong style={{ color: '#f1f5f9' }}>{totalMoments}</strong> moment{totalMoments !== 1 ? 's' : ''}</>
            )}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
