'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Backdrop,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Stack,
  Alert,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import PlaceIcon from '@mui/icons-material/Place';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventTypeSelector, { EventTypeForWizard } from './EventTypeSelector';
import { api } from '@/lib/api';
import { useBrand } from '@/app/providers/BrandProvider';

// ── Custom activity/moment types ─────────────────────────────────────
interface CustomActivity {
  tempId: string;
  name: string;
  dayLinkId: number;
}

interface PackageCreationWizardProps {
  open?: boolean;
  onClose: () => void;
  onPackageCreated: (packageId: number) => void;
  fullPage?: boolean;
}

export default function PackageCreationWizard({
  open = true,
  onClose,
  onPackageCreated,
  fullPage = false,
}: PackageCreationWizardProps) {
  const { currentBrand } = useBrand();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEventType, setSelectedEventType] = useState<EventTypeForWizard | null>(null);
  const [selectedDayIds, setSelectedDayIds] = useState<Set<number>>(new Set());
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<number>>(new Set());
  const [selectedMomentIds, setSelectedMomentIds] = useState<Set<number>>(new Set());
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());
  const [locationCount, setLocationCount] = useState(3);
  const [packageName, setPackageName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expand state for activities (step 3) and review (step 7)
  const [expandedPresets, setExpandedPresets] = useState<Set<number>>(new Set());
  const [expandedReviewPresets, setExpandedReviewPresets] = useState<Set<number>>(new Set());

  // Custom activities
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [addingActivityForDay, setAddingActivityForDay] = useState<number | null>(null);
  const [newActivityName, setNewActivityName] = useState('');

  const steps = ['Event', 'Days', 'Activities', 'Subjects', 'Locations', 'Name', 'Review'];

  // ── Helpers ────────────────────────────────────────────────────────
  const getPresetIdsForDays = (et: EventTypeForWizard, dayIds: Set<number>) => {
    const ids = new Set<number>();
    et.event_days
      .filter((ed) => dayIds.has(ed.id))
      .forEach((ed) =>
        ed.event_day_template.activity_presets.forEach((p) => ids.add(p.id)),
      );
    return ids;
  };

  const getAllMomentIdsForPresets = (et: EventTypeForWizard, presetIds: Set<number>) => {
    const ids = new Set<number>();
    et.event_days.forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => presetIds.has(p.id))
        .forEach((p) => p.moments?.forEach((m) => ids.add(m.id))),
    );
    return ids;
  };

  const getAllRoleIds = (et: EventTypeForWizard) => {
    const ids = new Set<number>();
    et.subject_types.forEach((st) =>
      st.subject_type_template.roles.forEach((r) => ids.add(r.id)),
    );
    return ids;
  };

  // ── Derived data ───────────────────────────────────────────────────
  const selectedDays = useMemo(() => {
    if (!selectedEventType) return [];
    return selectedEventType.event_days
      .filter((ed) => selectedDayIds.has(ed.id))
      .sort((a, b) => a.order_index - b.order_index);
  }, [selectedEventType, selectedDayIds]);

  const stats = useMemo(() => {
    if (!selectedEventType)
      return { days: 0, activities: 0, moments: 0, roles: 0, locations: 0 };
    const activities =
      selectedDays.reduce(
        (sum, ed) =>
          sum +
          ed.event_day_template.activity_presets.filter((p) => selectedPresetIds.has(p.id)).length,
        0,
      ) + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length;
    const moments = selectedDays.reduce(
      (sum, ed) =>
        sum +
        ed.event_day_template.activity_presets
          .filter((p) => selectedPresetIds.has(p.id))
          .reduce((ms, p) => ms + (p.moments?.filter((m) => selectedMomentIds.has(m.id)).length || 0), 0),
      0,
    );
    const roles = selectedEventType.subject_types.reduce(
      (sum, st) =>
        sum + st.subject_type_template.roles.filter((r) => selectedRoleIds.has(r.id)).length,
      0,
    );
    return { days: selectedDays.length, activities, moments, roles, locations: locationCount };
  }, [selectedEventType, selectedDays, selectedPresetIds, selectedMomentIds, selectedRoleIds, locationCount, customActivities]);

  const totalPresetsInSelectedDays = useMemo(
    () => selectedDays.reduce((s, ed) => s + ed.event_day_template.activity_presets.length, 0),
    [selectedDays],
  );

  const totalRoles = useMemo(() => {
    if (!selectedEventType) return 0;
    return selectedEventType.subject_types.reduce(
      (s, st) => s + st.subject_type_template.roles.length,
      0,
    );
  }, [selectedEventType]);

  // ── Toggle handlers ────────────────────────────────────────────────
  const toggleDay = (dayId: number) => {
    if (!selectedEventType) return;
    const dayLink = selectedEventType.event_days.find((ed) => ed.id === dayId);
    if (!dayLink) return;
    const presetIds = dayLink.event_day_template.activity_presets.map((p) => p.id);
    const momentIds = dayLink.event_day_template.activity_presets.flatMap(
      (p) => p.moments?.map((m) => m.id) || [],
    );

    if (selectedDayIds.has(dayId)) {
      // Deselecting a day — remove its presets and moments
      setSelectedDayIds((prev) => {
        const n = new Set(prev);
        n.delete(dayId);
        return n;
      });
      setSelectedPresetIds((prev) => {
        const n = new Set(prev);
        presetIds.forEach((id) => n.delete(id));
        return n;
      });
      setSelectedMomentIds((prev) => {
        const n = new Set(prev);
        momentIds.forEach((id) => n.delete(id));
        return n;
      });
    } else {
      // Selecting a day — add it but DON'T auto-select presets/moments
      setSelectedDayIds((prev) => new Set(prev).add(dayId));
    }
  };

  const togglePreset = (id: number) => {
    if (!selectedEventType) return;
    if (selectedPresetIds.has(id)) {
      // Deselecting preset — remove its moments too
      const momentIdsToRemove: number[] = [];
      selectedEventType.event_days.forEach((ed) =>
        ed.event_day_template.activity_presets
          .filter((p) => p.id === id)
          .forEach((p) => p.moments?.forEach((m) => momentIdsToRemove.push(m.id))),
      );
      setSelectedPresetIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      setSelectedMomentIds((prev) => {
        const n = new Set(prev);
        momentIdsToRemove.forEach((mid) => n.delete(mid));
        return n;
      });
    } else {
      // Selecting a preset — DON'T auto-select moments
      setSelectedPresetIds((prev) => new Set(prev).add(id));
    }
  };

  const toggleMoment = (id: number) => {
    setSelectedMomentIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllMomentsForPreset = (presetId: number) => {
    if (!selectedEventType) return;
    selectedEventType.event_days.forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => p.id === presetId)
        .forEach((p) =>
          setSelectedMomentIds((prev) => {
            const n = new Set(prev);
            p.moments?.forEach((m) => n.add(m.id));
            return n;
          }),
        ),
    );
  };

  const deselectAllMomentsForPreset = (presetId: number) => {
    if (!selectedEventType) return;
    selectedEventType.event_days.forEach((ed) =>
      ed.event_day_template.activity_presets
        .filter((p) => p.id === presetId)
        .forEach((p) =>
          setSelectedMomentIds((prev) => {
            const n = new Set(prev);
            p.moments?.forEach((m) => n.delete(m.id));
            return n;
          }),
        ),
    );
  };

  const toggleRole = (id: number) => {
    setSelectedRoleIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleExpandPreset = (id: number) => {
    setExpandedPresets((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleExpandReviewPreset = (id: number) => {
    setExpandedReviewPresets((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  // ── Custom activity handlers ───────────────────────────────────────
  const handleAddCustomActivity = (dayLinkId: number) => {
    if (!newActivityName.trim()) return;
    setCustomActivities((prev) => [
      ...prev,
      { tempId: `custom-${Date.now()}`, name: newActivityName.trim(), dayLinkId },
    ]);
    setNewActivityName('');
    setAddingActivityForDay(null);
  };

  const handleRemoveCustomActivity = (tempId: string) => {
    setCustomActivities((prev) => prev.filter((a) => a.tempId !== tempId));
  };

  // ── Navigation ─────────────────────────────────────────────────────
  const handleEventTypeSelected = (eventType: EventTypeForWizard) => {
    setSelectedEventType(eventType);
    // Start with nothing selected — user picks days first
    setSelectedDayIds(new Set());
    setSelectedPresetIds(new Set());
    setSelectedMomentIds(new Set());
    setSelectedRoleIds(new Set());
    setCustomActivities([]);
    setLocationCount(3);
    if (!packageName) setPackageName(`${eventType.name} Package`);
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    if (activeStep > 0) setActiveStep((prev) => prev - 1);
  };

  const handleCreate = async () => {
    if (!selectedEventType || !packageName.trim() || !currentBrand?.id) return;
    setIsCreating(true);
    setError(null);
    try {
      const response = await api.weddingTypes.createPackageFromTemplate(
        selectedEventType.id,
        { packageName },
        currentBrand.id,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const packageId = (response as any)?.id;
      if (packageId) {
        onPackageCreated(packageId);
        resetState();
      } else {
        setError('Failed to create package');
        setIsCreating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create package');
      setIsCreating(false);
    }
  };

  const resetState = () => {
    setActiveStep(0);
    setSelectedEventType(null);
    setSelectedDayIds(new Set());
    setSelectedPresetIds(new Set());
    setSelectedMomentIds(new Set());
    setSelectedRoleIds(new Set());
    setCustomActivities([]);
    setExpandedPresets(new Set());
    setExpandedReviewPresets(new Set());
    setLocationCount(3);
    setPackageName('');
    setIsCreating(false);
    setError(null);
  };

  const handleClose = () => {
    if (!isCreating) {
      resetState();
      onClose();
    }
  };

  const canAdvance = (() => {
    switch (activeStep) {
      case 0:
        return false;
      case 1:
        return selectedDayIds.size > 0;
      case 2:
        return selectedPresetIds.size > 0 || customActivities.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return packageName.trim().length > 0;
      default:
        return false;
    }
  })();

  const canCreate = activeStep === 6 && packageName.trim().length > 0 && !isCreating;
  const accent = selectedEventType?.color || '#f59e0b';

  // ── Shared styles ──────────────────────────────────────────────────
  const listRowSx = (selected: boolean, color = '#10b981') => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    px: 1.5,
    py: 1,
    borderRadius: 1.5,
    cursor: 'pointer',
    transition: 'all 0.15s',
    bgcolor: selected ? `${color}0A` : 'transparent',
    '&:hover': { bgcolor: selected ? `${color}10` : 'rgba(255,255,255,0.03)' },
  });

  const checkboxSx = (selected: boolean, color = '#10b981') => ({
    width: 18,
    height: 18,
    borderRadius: '4px',
    border: `2px solid ${selected ? color : 'rgba(148,163,184,0.3)'}`,
    bgcolor: selected ? color : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
    '& svg': { fontSize: '0.75rem', color: '#fff' },
  });

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
        },
      }}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(15, 20, 25, 0.97)',
          backdropFilter: 'blur(12px)',
          backgroundImage:
            'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: 2.5,
          border: '1px solid rgba(148, 163, 184, 0.15)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        },
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          pt: 2.5,
          pb: 1.5,
        }}
      >
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>
          Create a Package
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={isCreating}
          sx={{
            color: '#64748b',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Progress bar ────────────────────────────────────── */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
          <Typography sx={{ color: accent, fontSize: '0.8rem', fontWeight: 600 }}>
            {steps[activeStep]}
          </Typography>
          <Typography sx={{ color: '#475569', fontSize: '0.7rem' }}>
            Step {activeStep + 1} of {steps.length}
          </Typography>
        </Box>
        <Box sx={{ width: '100%', height: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
          <Box
            sx={{
              width: `${((activeStep + 1) / steps.length) * 100}%`,
              height: '100%',
              bgcolor: accent,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Box>

      <Box sx={{ height: '1px', bgcolor: 'rgba(148,163,184,0.1)' }} />

      {/* ── Content ─────────────────────────────────────────── */}
      <DialogContent sx={{ pt: 2.5, px: 3, pb: 2, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* ── Step 0: Event Type ──────────────────────────── */}
        {activeStep === 0 && (
          <Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2.5 }}>
              What type of event is this package for?
            </Typography>
            <EventTypeSelector
              onEventTypeSelected={handleEventTypeSelected}
              selectedEventTypeId={selectedEventType?.id}
            />
          </Box>
        )}

        {/* ── Step 1: Event Days ──────────────────────────── */}
        {activeStep === 1 && selectedEventType && (
          <Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>
              Which days does this event include? Select the days you need.
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 1.5,
              }}
            >
              {selectedEventType.event_days
                .sort((a, b) => a.order_index - b.order_index)
                .map((link) => {
                  const day = link.event_day_template;
                  const isSelected = selectedDayIds.has(link.id);
                  const activityCount = day.activity_presets?.length || 0;
                  const momentCount =
                    day.activity_presets?.reduce((s, p) => s + (p.moments?.length || 0), 0) || 0;
                  return (
                    <Box
                      key={link.id}
                      onClick={() => toggleDay(link.id)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isSelected ? accent : 'rgba(148,163,184,0.12)',
                        bgcolor: isSelected ? `${accent}0A` : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: isSelected ? accent : 'rgba(148,163,184,0.3)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.75,
                        }}
                      >
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                          {day.name}
                        </Typography>
                        {isSelected && (
                          <CheckCircleIcon sx={{ fontSize: '1.1rem', color: accent }} />
                        )}
                      </Box>
                      {day.description && (
                        <Typography
                          sx={{ color: '#64748b', fontSize: '0.75rem', mb: 0.75, lineHeight: 1.4 }}
                        >
                          {day.description}
                        </Typography>
                      )}
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                        {activityCount} activities · {momentCount} moments
                      </Typography>
                    </Box>
                  );
                })}
            </Box>
          </Box>
        )}

        {/* ── Step 2: Activities (list with expandable moments) ── */}
        {activeStep === 2 && selectedEventType && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Select activities and moments to include
                </Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>
                  Expand each activity to pick specific moments
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${selectedPresetIds.size + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length}/${totalPresetsInSelectedDays + customActivities.filter((ca) => selectedDayIds.has(ca.dayLinkId)).length}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    bgcolor: 'rgba(16,185,129,0.12)',
                    color: '#10b981',
                    border: 'none',
                  }}
                />
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Box
                    component="button"
                    onClick={() => {
                      if (!selectedEventType) return;
                      const allPresets = getPresetIdsForDays(selectedEventType, selectedDayIds);
                      setSelectedPresetIds(allPresets);
                      setSelectedMomentIds(getAllMomentIdsForPresets(selectedEventType, allPresets));
                    }}
                    sx={{
                      px: 1,
                      py: 0.25,
                      bgcolor: 'transparent',
                      border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: 0.75,
                      color: '#10b981',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'rgba(16,185,129,0.08)' },
                    }}
                  >
                    Select All
                  </Box>
                  <Box
                    component="button"
                    onClick={() => {
                      setSelectedPresetIds(new Set());
                      setSelectedMomentIds(new Set());
                    }}
                    sx={{
                      px: 1,
                      py: 0.25,
                      bgcolor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 0.75,
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                    }}
                  >
                    None
                  </Box>
                </Box>
              </Box>
            </Box>

            {selectedDays.length === 0 && (
              <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Go back and select at least one event day first.
              </Typography>
            )}

            <Stack spacing={2.5}>
              {selectedDays.map((link) => {
                const day = link.event_day_template;
                const dayCustomActivities = customActivities.filter((ca) => ca.dayLinkId === link.id);
                if (!day.activity_presets?.length && dayCustomActivities.length === 0) return null;
                return (
                  <Box key={link.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography
                        sx={{
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                        }}
                      >
                        {day.name}
                      </Typography>
                      <Box
                        component="button"
                        onClick={() => {
                          setAddingActivityForDay(addingActivityForDay === link.id ? null : link.id);
                          setNewActivityName('');
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.25,
                          bgcolor: 'transparent',
                          border: '1px solid rgba(148,163,184,0.2)',
                          borderRadius: 0.75,
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', color: '#fff' },
                        }}
                      >
                        <AddIcon sx={{ fontSize: '0.75rem' }} /> Add Activity
                      </Box>
                    </Box>

                    {/* Add activity input */}
                    <Collapse in={addingActivityForDay === link.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          mb: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(148,163,184,0.12)',
                        }}
                      >
                        <TextField
                          value={newActivityName}
                          onChange={(e) => setNewActivityName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCustomActivity(link.id);
                            if (e.key === 'Escape') setAddingActivityForDay(null);
                          }}
                          placeholder="Activity name..."
                          size="small"
                          autoFocus
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#fff',
                              fontSize: '0.8rem',
                              bgcolor: 'transparent',
                              '& fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                              '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.4)' },
                              '&.Mui-focused fieldset': { borderColor: accent },
                            },
                          }}
                        />
                        <Button
                          onClick={() => handleAddCustomActivity(link.id)}
                          disabled={!newActivityName.trim()}
                          size="small"
                          sx={{
                            color: '#10b981',
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            minWidth: 'auto',
                            px: 1.5,
                          }}
                        >
                          Add
                        </Button>
                      </Box>
                    </Collapse>

                    {/* Activity list */}
                    <Stack spacing={0.5}>
                      {day.activity_presets.map((preset) => {
                        const sel = selectedPresetIds.has(preset.id);
                        const isExpanded = expandedPresets.has(preset.id);
                        const pColor = preset.color || '#10b981';
                        const momentCount = preset.moments?.length || 0;
                        const selectedMomentCount =
                          preset.moments?.filter((m) => selectedMomentIds.has(m.id)).length || 0;

                        return (
                          <Box key={preset.id}>
                            {/* Activity row */}
                            <Box sx={listRowSx(sel, pColor)}>
                              <Box
                                onClick={() => togglePreset(preset.id)}
                                sx={checkboxSx(sel, pColor)}
                              >
                                {sel && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                              </Box>

                              <Box
                                sx={{ flex: 1, cursor: 'pointer' }}
                                onClick={() => togglePreset(preset.id)}
                              >
                                <Typography
                                  sx={{
                                    color: sel ? '#e2e8f0' : '#94a3b8',
                                    fontSize: '0.82rem',
                                    fontWeight: sel ? 600 : 400,
                                  }}
                                >
                                  {preset.name}
                                </Typography>
                              </Box>

                              {momentCount > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {sel && (
                                    <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                                      {selectedMomentCount}/{momentCount}
                                    </Typography>
                                  )}
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpandPreset(preset.id);
                                    }}
                                    sx={{
                                      p: 0.25,
                                      color: '#64748b',
                                      '&:hover': { color: '#94a3b8' },
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ExpandLessIcon sx={{ fontSize: '1rem' }} />
                                    ) : (
                                      <ExpandMoreIcon sx={{ fontSize: '1rem' }} />
                                    )}
                                  </IconButton>
                                </Box>
                              )}
                            </Box>

                            {/* Moments dropdown */}
                            <Collapse in={isExpanded && momentCount > 0}>
                              <Box
                                sx={{
                                  ml: 4.5,
                                  mt: 0.25,
                                  mb: 0.5,
                                  pl: 1.5,
                                  borderLeft: `2px solid ${sel ? `${pColor}30` : 'rgba(148,163,184,0.1)'}`,
                                }}
                              >
                                {/* Select all / none for moments */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: 0.5,
                                    mb: 0.5,
                                    py: 0.25,
                                  }}
                                >
                                  <Box
                                    component="button"
                                    onClick={() => selectAllMomentsForPreset(preset.id)}
                                    sx={{
                                      px: 0.75,
                                      py: 0.15,
                                      bgcolor: 'transparent',
                                      border: `1px solid ${pColor}30`,
                                      borderRadius: 0.5,
                                      color: pColor,
                                      cursor: 'pointer',
                                      fontSize: '0.6rem',
                                      fontWeight: 600,
                                      '&:hover': { bgcolor: `${pColor}0A` },
                                    }}
                                  >
                                    Select All
                                  </Box>
                                  <Box
                                    component="button"
                                    onClick={() => deselectAllMomentsForPreset(preset.id)}
                                    sx={{
                                      px: 0.75,
                                      py: 0.15,
                                      bgcolor: 'transparent',
                                      border: '1px solid rgba(255,255,255,0.08)',
                                      borderRadius: 0.5,
                                      color: '#64748b',
                                      cursor: 'pointer',
                                      fontSize: '0.6rem',
                                      fontWeight: 600,
                                      '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                                    }}
                                  >
                                    None
                                  </Box>
                                </Box>

                                {preset.moments?.map((moment) => {
                                  const mSel = selectedMomentIds.has(moment.id);
                                  return (
                                    <Box
                                      key={moment.id}
                                      onClick={() => toggleMoment(moment.id)}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        py: 0.4,
                                        px: 0.5,
                                        borderRadius: 0.75,
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                                      }}
                                    >
                                      <Box sx={checkboxSx(mSel, pColor)}>
                                        {mSel && <CheckCircleIcon sx={{ fontSize: '0.65rem' }} />}
                                      </Box>
                                      <Typography
                                        sx={{
                                          color: mSel ? '#cbd5e1' : '#64748b',
                                          fontSize: '0.75rem',
                                          fontWeight: mSel ? 500 : 400,
                                          flex: 1,
                                        }}
                                      >
                                        {moment.name}
                                      </Typography>
                                      {moment.is_key_moment && (
                                        <Typography sx={{ color: '#f59e0b', fontSize: '0.6rem' }}>
                                          Key
                                        </Typography>
                                      )}
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}

                      {/* Custom activities for this day */}
                      {dayCustomActivities.map((ca) => (
                        <Box key={ca.tempId} sx={listRowSx(true, '#818cf8')}>
                          <Box sx={checkboxSx(true, '#818cf8')}>
                            <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />
                          </Box>
                          <Typography
                            sx={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, flex: 1 }}
                          >
                            {ca.name}
                          </Typography>
                          <Chip
                            label="Custom"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              bgcolor: 'rgba(129,140,248,0.12)',
                              color: '#818cf8',
                              border: 'none',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveCustomActivity(ca.tempId)}
                            sx={{ p: 0.25, color: '#64748b', '&:hover': { color: '#ef4444' } }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* ── Step 3: Subject Roles (list format) ────────── */}
        {activeStep === 3 && selectedEventType && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Who will be involved in this event?
                </Typography>
                <Typography sx={{ color: '#475569', fontSize: '0.7rem', mt: 0.25 }}>
                  Select the roles that apply to your package
                </Typography>
              </Box>
              {totalRoles > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${selectedRoleIds.size}/${totalRoles}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      bgcolor: 'rgba(244,114,182,0.12)',
                      color: '#f472b6',
                      border: 'none',
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box
                      component="button"
                      onClick={() =>
                        selectedEventType && setSelectedRoleIds(getAllRoleIds(selectedEventType))
                      }
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: 'transparent',
                        border: '1px solid rgba(244,114,182,0.25)',
                        borderRadius: 0.75,
                        color: '#f472b6',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        '&:hover': { bgcolor: 'rgba(244,114,182,0.08)' },
                      }}
                    >
                      All
                    </Box>
                    <Box
                      component="button"
                      onClick={() => setSelectedRoleIds(new Set())}
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 0.75,
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                      }}
                    >
                      None
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {totalRoles === 0 && (
              <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>
                No subject types configured for this event type yet.
              </Typography>
            )}

            <Stack spacing={2}>
              {selectedEventType.subject_types
                .sort((a, b) => a.order_index - b.order_index)
                .map((link) => {
                  const st = link.subject_type_template;
                  if (!st.roles?.length) return null;
                  return (
                    <Box key={link.id}>
                      <Typography
                        sx={{
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          mb: 0.5,
                        }}
                      >
                        {st.name}
                      </Typography>
                      <Stack spacing={0.25}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {st.roles
                          .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
                          .map((role) => {
                            const sel = selectedRoleIds.has(role.id);
                            return (
                              <Box
                                key={role.id}
                                onClick={() => toggleRole(role.id)}
                                sx={listRowSx(sel, '#f472b6')}
                              >
                                <Box sx={checkboxSx(sel, '#f472b6')}>
                                  {sel && <CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                                </Box>
                                <Typography
                                  sx={{
                                    color: sel ? '#e2e8f0' : '#94a3b8',
                                    fontSize: '0.82rem',
                                    fontWeight: sel ? 600 : 400,
                                    flex: 1,
                                  }}
                                >
                                  {role.role_name}
                                </Typography>
                                {role.is_core && (
                                  <Chip
                                    label="Core"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.6rem',
                                      bgcolor: 'rgba(244,114,182,0.12)',
                                      color: '#f472b6',
                                      border: 'none',
                                    }}
                                  />
                                )}
                              </Box>
                            );
                          })}
                      </Stack>
                    </Box>
                  );
                })}
            </Stack>
          </Box>
        )}

        {/* ── Step 4: Locations ───────────────────────────── */}
        {activeStep === 4 && (
          <Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2 }}>
              How many distinct locations will this event have?
            </Typography>
            <Stack direction="row" spacing={1.5}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Box
                  key={n}
                  onClick={() => setLocationCount(n)}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.25,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    bgcolor:
                      n <= locationCount ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
                    border:
                      n === locationCount
                        ? '2px solid #22d3ee'
                        : n <= locationCount
                          ? '1px solid rgba(34,211,238,0.3)'
                          : '1px solid rgba(255,255,255,0.08)',
                    color: n <= locationCount ? '#22d3ee' : '#475569',
                    '&:hover': {
                      borderColor: '#22d3ee',
                      bgcolor: 'rgba(34,211,238,0.06)',
                    },
                  }}
                >
                  <PlaceIcon sx={{ fontSize: '1rem' }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{n}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ── Step 5: Package Name ────────────────────────── */}
        {activeStep === 5 && selectedEventType && (
          <Box sx={{ maxWidth: 520, mx: 'auto' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 3 }}>
              Give your package a name
            </Typography>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                mb: 2.5,
                borderRadius: 1,
                bgcolor: `${accent}12`,
                border: `1px solid ${accent}30`,
              }}
            >
              <Typography
                sx={{
                  color: accent,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Event Type:
              </Typography>
              <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                {selectedEventType.icon || ''} {selectedEventType.name}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  mb: 1,
                }}
              >
                Package Name
              </Typography>
              <TextField
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder={`e.g., Premium ${selectedEventType.name} Package`}
                fullWidth
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: `${accent}50`, borderWidth: 2 },
                    '&:hover fieldset': { borderColor: `${accent}80` },
                    '&.Mui-focused fieldset': { borderColor: accent },
                  },
                }}
              />
              <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mt: 1 }}>
                This name will be visible to your clients. You can change it later.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
              {[
                { label: 'Days', value: stats.days, color: '#10b981' },
                { label: 'Activities', value: stats.activities, color: '#818cf8' },
                { label: 'Moments', value: stats.moments, color: '#f472b6' },
                { label: 'Roles', value: stats.roles, color: '#f472b6' },
                { label: 'Locations', value: stats.locations, color: '#22d3ee' },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    flex: 1,
                    p: 1.25,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Typography sx={{ color: stat.color, fontWeight: 700, fontSize: '1.15rem' }}>
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{
                      color: '#64748b',
                      fontSize: '0.6rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ── Step 6: Review & Create (with expandable moments) ── */}
        {activeStep === 6 && selectedEventType && (
          <Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2.5 }}>
              Review everything before creating
            </Typography>

            {/* Package Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                p: 2,
                borderRadius: 1.5,
                bgcolor: `${accent}0A`,
                border: `1px solid ${accent}25`,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    color: '#64748b',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.25,
                  }}
                >
                  Package Name
                </Typography>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem' }}>
                  {packageName}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  sx={{
                    color: '#64748b',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.25,
                  }}
                >
                  Event Type
                </Typography>
                <Typography sx={{ color: accent, fontWeight: 600, fontSize: '0.9rem' }}>
                  {selectedEventType.icon || ''} {selectedEventType.name}
                </Typography>
              </Box>
            </Box>

            {/* Stats Row */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
              {[
                { label: 'Days', value: stats.days, color: '#10b981' },
                { label: 'Activities', value: stats.activities, color: '#818cf8' },
                { label: 'Moments', value: stats.moments, color: '#f472b6' },
                { label: 'Roles', value: stats.roles, color: '#f472b6' },
                { label: 'Locations', value: stats.locations, color: '#22d3ee' },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    flex: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ color: stat.color, fontWeight: 700, fontSize: '1rem' }}>
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{ color: '#64748b', fontSize: '0.58rem', textTransform: 'uppercase' }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Breakdown columns */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Left: Days & Activities with expandable moments */}
              <Box
                sx={{
                  flex: 3,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.12)',
                }}
              >
                <Typography
                  sx={{
                    color: '#10b981',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <CalendarMonthIcon sx={{ fontSize: '0.75rem' }} /> Days & Activities
                </Typography>
                <Stack spacing={1}>
                  {selectedDays.map((link) => {
                    const day = link.event_day_template;
                    const selectedPresets = (day.activity_presets || []).filter((p) =>
                      selectedPresetIds.has(p.id),
                    );
                    const dayCustom = customActivities.filter((ca) => ca.dayLinkId === link.id);
                    if (selectedPresets.length === 0 && dayCustom.length === 0) return null;
                    return (
                      <Box key={link.id}>
                        <Typography
                          sx={{
                            color: '#e2e8f0',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          {day.name}
                        </Typography>
                        <Stack
                          spacing={0.25}
                          sx={{ pl: 1.5, borderLeft: '2px solid rgba(16,185,129,0.15)' }}
                        >
                          {selectedPresets.map((preset) => {
                            const selMoments =
                              preset.moments?.filter((m) => selectedMomentIds.has(m.id)) || [];
                            const isExpanded = expandedReviewPresets.has(preset.id);
                            return (
                              <Box key={preset.id}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    py: 0.25,
                                    cursor: selMoments.length > 0 ? 'pointer' : 'default',
                                  }}
                                  onClick={() =>
                                    selMoments.length > 0 && toggleExpandReviewPreset(preset.id)
                                  }
                                >
                                  <Box
                                    sx={{
                                      width: 3,
                                      height: 3,
                                      borderRadius: '50%',
                                      bgcolor: preset.color || '#10b981',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    sx={{ color: '#94a3b8', fontSize: '0.75rem', flex: 1 }}
                                  >
                                    {preset.name}
                                  </Typography>
                                  <Typography
                                    sx={{ color: '#475569', fontSize: '0.65rem', flexShrink: 0 }}
                                  >
                                    {selMoments.length} moment{selMoments.length !== 1 ? 's' : ''}
                                  </Typography>
                                  {selMoments.length > 0 && (
                                    <Box sx={{ color: '#475569', display: 'flex' }}>
                                      {isExpanded ? (
                                        <ExpandLessIcon sx={{ fontSize: '0.85rem' }} />
                                      ) : (
                                        <ExpandMoreIcon sx={{ fontSize: '0.85rem' }} />
                                      )}
                                    </Box>
                                  )}
                                </Box>
                                <Collapse in={isExpanded}>
                                  <Stack spacing={0} sx={{ pl: 2, pb: 0.5 }}>
                                    {selMoments.map((moment) => (
                                      <Typography
                                        key={moment.id}
                                        sx={{
                                          color: '#64748b',
                                          fontSize: '0.7rem',
                                          py: 0.15,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.75,
                                        }}
                                      >
                                        <Box
                                          component="span"
                                          sx={{
                                            width: 2,
                                            height: 2,
                                            borderRadius: '50%',
                                            bgcolor: '#475569',
                                            display: 'inline-block',
                                          }}
                                        />
                                        {moment.name}
                                        {moment.is_key_moment && (
                                          <Box
                                            component="span"
                                            sx={{ color: '#f59e0b', fontSize: '0.55rem' }}
                                          >
                                            Key
                                          </Box>
                                        )}
                                      </Typography>
                                    ))}
                                  </Stack>
                                </Collapse>
                              </Box>
                            );
                          })}
                          {dayCustom.map((ca) => (
                            <Box
                              key={ca.tempId}
                              sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}
                            >
                              <Box
                                sx={{
                                  width: 3,
                                  height: 3,
                                  borderRadius: '50%',
                                  bgcolor: '#818cf8',
                                  flexShrink: 0,
                                }}
                              />
                              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', flex: 1 }}>
                                {ca.name}
                              </Typography>
                              <Chip
                                label="Custom"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.55rem',
                                  bgcolor: 'rgba(129,140,248,0.12)',
                                  color: '#818cf8',
                                  border: 'none',
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Right column: Roles + Locations stacked */}
              <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Subject Roles */}
                {stats.roles > 0 && (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(244,114,182,0.05)',
                      border: '1px solid rgba(244,114,182,0.12)',
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#f472b6',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <PeopleIcon sx={{ fontSize: '0.75rem' }} /> Subject Roles
                    </Typography>
                    <Stack spacing={0.75}>
                      {selectedEventType.subject_types
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((link) => {
                          const st = link.subject_type_template;
                          const selectedRoles = st.roles.filter((r) => selectedRoleIds.has(r.id));
                          if (selectedRoles.length === 0) return null;
                          return (
                            <Box key={link.id}>
                              <Typography
                                sx={{
                                  color: '#e2e8f0',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  mb: 0.25,
                                }}
                              >
                                {st.name}
                              </Typography>
                              <Stack spacing={0.15}>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {selectedRoles
                                  .sort(
                                    (a: any, b: any) =>
                                      (a.order_index ?? 0) - (b.order_index ?? 0),
                                  )
                                  .map((role) => (
                                    <Typography
                                      key={role.id}
                                      sx={{
                                        color: '#94a3b8',
                                        fontSize: '0.7rem',
                                        pl: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.75,
                                      }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          width: 3,
                                          height: 3,
                                          borderRadius: '50%',
                                          bgcolor: role.is_core ? '#f472b6' : '#475569',
                                          display: 'inline-block',
                                        }}
                                      />
                                      {role.role_name}
                                      {role.is_core && (
                                        <Box
                                          component="span"
                                          sx={{ color: '#f472b6', fontSize: '0.55rem' }}
                                        >
                                          Core
                                        </Box>
                                      )}
                                    </Typography>
                                  ))}
                              </Stack>
                            </Box>
                          );
                        })}
                    </Stack>
                  </Box>
                )}

                {/* Locations */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(34,211,238,0.05)',
                    border: '1px solid rgba(34,211,238,0.12)',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#22d3ee',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      mb: 0.75,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <PlaceIcon sx={{ fontSize: '0.75rem' }} /> Location Slots
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    {Array.from({ length: locationCount }, (_, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1,
                          py: 0.4,
                          borderRadius: 0.75,
                          bgcolor: 'rgba(34,211,238,0.1)',
                          border: '1px solid rgba(34,211,238,0.25)',
                        }}
                      >
                        <PlaceIcon sx={{ fontSize: '0.7rem', color: '#22d3ee' }} />
                        <Typography sx={{ color: '#22d3ee', fontSize: '0.7rem', fontWeight: 600 }}>
                          Loc {i + 1}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* ── Footer ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 1.5,
          borderTop: '1px solid rgba(148,163,184,0.1)',
        }}
      >
        <Box>
          {activeStep > 0 && (
            <Box
              component="button"
              onClick={handleBack}
              disabled={isCreating}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 2,
                py: 0.75,
                bgcolor: 'rgba(148,163,184,0.08)',
                border: '1px solid rgba(148,163,184,0.15)',
                borderRadius: 1,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: 'rgba(148,163,184,0.12)',
                  color: '#fff',
                  borderColor: 'rgba(148,163,184,0.25)',
                },
                '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
              }}
            >
              <ArrowBackIcon sx={{ fontSize: '1rem' }} /> Back
            </Box>
          )}
        </Box>

        <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>
          Step {activeStep + 1} of {steps.length}
        </Typography>

        <Box>
          {activeStep >= 1 && activeStep <= 5 && (
            <Box
              component="button"
              onClick={handleNext}
              disabled={!canAdvance}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 2.5,
                py: 0.75,
                bgcolor: canAdvance ? accent : '#334155',
                border: 'none',
                borderRadius: 1,
                color: canAdvance ? '#0f172a' : '#64748b',
                cursor: canAdvance ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.15s',
                '&:hover': canAdvance ? { filter: 'brightness(0.9)' } : {},
              }}
            >
              Next <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
            </Box>
          )}

          {activeStep === 6 && (
            <Button
              onClick={handleCreate}
              disabled={!canCreate}
              variant="contained"
              startIcon={
                isCreating ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />
              }
              sx={{
                bgcolor: '#10b981',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                px: 3,
                textTransform: 'none',
                '&:hover': { bgcolor: '#059669' },
                '&:disabled': { bgcolor: '#334155', color: '#64748b' },
              }}
            >
              {isCreating ? 'Creating...' : 'Create Package'}
            </Button>
          )}

          {activeStep === 0 && <Box sx={{ width: 80 }} />}
        </Box>
      </Box>
    </Dialog>
  );
}
