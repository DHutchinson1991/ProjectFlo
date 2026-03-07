'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import PlaceIcon from '@mui/icons-material/Place';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';

export interface WeddingType {
  id: number;
  name: string;
  description: string;
  total_duration_hours: number;
  event_start_time: string;
  typical_guest_count?: number;
  locations: Array<{
    id: number;
    name: string;
    location_type?: string;
    order_index: number;
    is_primary: boolean;
  }>;
  subjects: Array<{
    id: number;
    name: string;
    subject_type?: string;
    typical_count?: number;
    order_index: number;
    is_primary: boolean;
  }>;
  activities: Array<{
    id: number;
    name: string;
    duration_minutes: number;
    start_time_offset_minutes: number;
    icon?: string;
    color?: string;
    moments: Array<{
      id: number;
      name: string;
      duration_seconds: number;
      is_key_moment: boolean;
    }>;
    activity_locations?: Array<{
      id: number;
      wedding_type_location_id: number;
      location_sequence_index: number;
      wedding_type_location: {
        id: number;
        name: string;
        location_type?: string;
      };
    }>;
    activity_subjects?: Array<{
      id: number;
      wedding_type_subject_id: number;
      presence_percentage?: number;
      is_primary_focus: boolean;
      wedding_type_subject: {
        id: number;
        name: string;
        subject_type?: string;
      };
    }>;
  }>;
}

interface WeddingTypeSelectorProps {
  onWeddingTypeSelected: (weddingType: WeddingType) => void;
  selectedWeddingTypeId?: number | null;
}

// ─── Shared Styles ──────────────────────────────────────────────────
const sectionLabel = {
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  fontSize: '0.65rem',
  letterSpacing: '0.8px',
  mb: 0.75,
  display: 'block',
};

const chipSx = {
  height: 22,
  fontSize: '0.7rem',
  fontWeight: 500,
};

export default function WeddingTypeSelector({
  onWeddingTypeSelected,
  selectedWeddingTypeId: externalSelectedId,
}: WeddingTypeSelectorProps) {
  const { currentBrand } = useBrand();
  const [weddingTypes, setWeddingTypes] = useState<WeddingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<number | null>(null);

  const selectedId = externalSelectedId ?? internalSelectedId;

  useEffect(() => {
    loadWeddingTypes();
  }, [currentBrand?.id]);

  const loadWeddingTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentBrand?.id) { setError('Brand context not available'); setLoading(false); return; }
      const response = await api.weddingTypes.getAll(currentBrand.id);
      setWeddingTypes(response);
      // Auto-select first if nothing selected
      if (response.length > 0 && !selectedId) {
        setInternalSelectedId(response[0].id);
        onWeddingTypeSelected(response[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wedding types');
    } finally {
      setLoading(false);
    }
  };

  const selectedWeddingType = useMemo(
    () => weddingTypes.find((wt) => wt.id === selectedId),
    [weddingTypes, selectedId],
  );

  const totalMoments = useMemo(
    () => selectedWeddingType?.activities.reduce((sum, a) => sum + a.moments.length, 0) ?? 0,
    [selectedWeddingType],
  );

  const handleSelect = (wt: WeddingType) => {
    setInternalSelectedId(wt.id);
    onWeddingTypeSelected(wt);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2}>
        {/* ── LEFT: Type List ───────────────────────────────── */}
        <Grid item xs={3.5}>
          <Stack spacing={0.75}>
            {weddingTypes.map((wt) => {
              const isSelected = selectedId === wt.id;
              return (
                <Box
                  key={wt.id}
                  onClick={() => handleSelect(wt)}
                  sx={{
                    cursor: 'pointer',
                    p: 1.25,
                    borderRadius: 1,
                    border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                    bgcolor: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(245,158,11,0.5)' },
                  }}
                >
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>
                    {wt.name}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', mt: 0.25, lineHeight: 1.3 }}>
                    {wt.description}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }}>
                    <Chip icon={<AccessTimeIcon />} label={`${wt.total_duration_hours}h`} size="small" variant="outlined"
                      sx={{ ...chipSx, borderColor: 'rgba(255,255,255,0.15)', color: '#cbd5e1', '& .MuiChip-icon': { fontSize: '0.8rem' } }} />
                    <Chip icon={<GroupIcon />} label={`~${wt.typical_guest_count ?? 0}`} size="small" variant="outlined"
                      sx={{ ...chipSx, borderColor: 'rgba(255,255,255,0.15)', color: '#cbd5e1', '& .MuiChip-icon': { fontSize: '0.8rem' } }} />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Grid>

        {/* ── MIDDLE: Activities & Moments ──────────────────── */}
        <Grid item xs={4.5}>
          {selectedWeddingType ? (
            <Box>
              <Typography sx={{ ...sectionLabel, color: '#10b981' }}>
                ⏱ Activities ({selectedWeddingType.activities.length}) · {totalMoments} moments
              </Typography>
              <Stack spacing={0.5}>
                {selectedWeddingType.activities.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      p: 1,
                      borderRadius: 0.75,
                      bgcolor: 'rgba(15, 23, 42, 0.5)',
                      borderLeft: `3px solid ${activity.color || '#10b981'}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>
                        {activity.icon ? `${activity.icon} ` : ''}{activity.name}
                      </Typography>
                      <Typography sx={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0, ml: 1 }}>
                        {activity.duration_minutes}m
                      </Typography>
                    </Box>
                    {/* Inline moments as compact chips */}
                    <Stack direction="row" spacing={0.25} flexWrap="wrap" gap={0.25}>
                      {activity.moments.map((m) => (
                        <Chip
                          key={m.id}
                          label={m.name}
                          size="small"
                          sx={{
                            ...chipSx,
                            height: 20,
                            fontSize: '0.62rem',
                            bgcolor: m.is_key_moment ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)',
                            color: m.is_key_moment ? '#f59e0b' : '#94a3b8',
                            border: m.is_key_moment ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>Select a type to see activities</Typography>
            </Box>
          )}
        </Grid>

        {/* ── RIGHT: Locations, Subjects, Stats ─────────────── */}
        <Grid item xs={4}>
          {selectedWeddingType ? (
            <Stack spacing={1.5}>
              {/* Quick Stats Row */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box sx={{ flex: 1, p: 1, borderRadius: 0.75, bgcolor: 'rgba(245,158,11,0.08)', textAlign: 'center' }}>
                  <Typography sx={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>
                    {selectedWeddingType.total_duration_hours}h
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.6rem', textTransform: 'uppercase' }}>Duration</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 1, borderRadius: 0.75, bgcolor: 'rgba(16,185,129,0.08)', textAlign: 'center' }}>
                  <Typography sx={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>
                    {selectedWeddingType.activities.length}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.6rem', textTransform: 'uppercase' }}>Activities</Typography>
                </Box>
                <Box sx={{ flex: 1, p: 1, borderRadius: 0.75, bgcolor: 'rgba(99,102,241,0.08)', textAlign: 'center' }}>
                  <Typography sx={{ color: '#818cf8', fontWeight: 700, fontSize: '1.1rem' }}>
                    {totalMoments}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.6rem', textTransform: 'uppercase' }}>Moments</Typography>
                </Box>
              </Box>

              {/* Locations */}
              {selectedWeddingType.locations.length > 0 && (
                <Box>
                  <Typography sx={{ ...sectionLabel, color: '#10b981' }}>
                    <PlaceIcon sx={{ fontSize: '0.75rem', verticalAlign: 'middle', mr: 0.5 }} />
                    Locations ({selectedWeddingType.locations.length})
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {selectedWeddingType.locations.map((loc) => (
                      <Chip key={loc.id} label={loc.name} size="small"
                        sx={{
                          ...chipSx,
                          bgcolor: loc.is_primary ? 'rgba(16,185,129,0.2)' : 'transparent',
                          border: '1px solid rgba(16,185,129,0.3)',
                          color: loc.is_primary ? '#10b981' : '#94a3b8',
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Subjects */}
              {selectedWeddingType.subjects.length > 0 && (
                <Box>
                  <Typography sx={{ ...sectionLabel, color: '#f59e0b' }}>
                    👥 People ({selectedWeddingType.subjects.length})
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {selectedWeddingType.subjects.map((subj) => (
                      <Chip
                        key={subj.id}
                        label={subj.typical_count && subj.typical_count > 1 ? `${subj.name} (${subj.typical_count})` : subj.name}
                        size="small"
                        sx={{
                          ...chipSx,
                          bgcolor: subj.is_primary ? 'rgba(245,158,11,0.15)' : 'transparent',
                          border: `1px solid ${subj.is_primary ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          color: subj.is_primary ? '#f59e0b' : '#94a3b8',
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>Select a type to see details</Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
