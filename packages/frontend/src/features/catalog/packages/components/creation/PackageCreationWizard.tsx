'use client';

import React, { useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Backdrop,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LinearProgress from '@mui/material/LinearProgress';
import { useEventTypes } from '@/features/catalog/package-templates/hooks';
import { useBrand } from '@/features/platform/brand';
import { useWizardState } from './hooks/useWizardState';
import { useWizardData } from './hooks/useWizardData';
import { useWizardDerived } from './hooks/useWizardDerived';
import { useWizardHandlers } from './hooks/useWizardHandlers';
import { normalizeEventTypeForWizard, getAllRoleIds, WIZARD_STEP_INDEX } from './helpers/wizard-helpers';
import EventScreen from './screens/EventScreen';
import DayDesignScreen from './screens/DayDesignScreen';
import TeamScreen from './screens/TeamScreen';
import ReviewScreen from './screens/ReviewScreen';
interface PackageCreationWizardProps {
  open?: boolean;
  onClose: () => void;
  onPackageCreated: (packageId: number) => void;
  fullPage?: boolean;
  initialEventTypeName?: string | null;
}

export default function PackageCreationWizard({
  open = false, onClose, onPackageCreated, initialEventTypeName,
}: PackageCreationWizardProps) {
  const { currentBrand } = useBrand();
  const { eventTypes } = useEventTypes();

  const state = useWizardState();
  const data = useWizardData(state.activeStep, currentBrand?.id, open);
  const derived = useWizardDerived(state, data);
  const handlers = useWizardHandlers(state, data, derived, currentBrand?.id);
  const autoAppliedCrewPresetRef = useRef(false);

  const {
    activeStep, steps, canAdvance, canCreate,
    isCreating, error, createdPackageId,
    autoSelectAttempted, packageName,
    isDayDesignRunning,
  } = state;
  const { accent } = derived;

  // ── Auto-select event type when initialEventTypeName is provided ──
  useEffect(() => {
    if (!open || !initialEventTypeName || autoSelectAttempted) return;
    state.setAutoSelectAttempted(true);
    const match = eventTypes.find(
      (et) => et.name.toLowerCase() === initialEventTypeName.toLowerCase(),
    );
    if (!match) return;
    const normalized = normalizeEventTypeForWizard(match);
    state.setSelectedEventType(normalized);
    state.setSelectedDayIds(new Set());
    state.setSelectedPresetIds(new Set());
    state.setSelectedMomentIds(new Set());
    state.setSelectedRoleIds(getAllRoleIds(normalized));
    state.setCustomActivities([]);
    state.setPresetTimeOverrides({});
    state.setPresetDurationOverrides({});
    state.setMomentKeyOverrides({});
    state.setRoleSlots([]);
    state.setCrewAssignments([]);
    state.setCameraSlots([{ slotNumber: 1, equipmentId: null, assignedCrewId: null, assignedJobRoleId: null }]);
    state.setAudioSlots([]);
    state.setLocationCount(3);
    if (!packageName) state.setPackageName(`${normalized.name} Package`);
    // Preselected event type lands straight on the Day design path picker.
    state.setDayDesignPath(null);
    state.setDayDesignPhase('source');
    state.setActiveStep(WIZARD_STEP_INDEX.DAY_DESIGN);
  }, [open, initialEventTypeName, autoSelectAttempted, eventTypes, packageName]);

  useEffect(() => {
    if (open) return;
    autoAppliedCrewPresetRef.current = false;
  }, [open]);

  // ── Auto-populate role slots with all roles (×1 each) ─────────
  useEffect(() => {
    if (data.availableJobRoles.length > 0 && state.roleSlots.length === 0) {
      state.setRoleSlots(data.availableJobRoles.map((r) => ({ jobRoleId: r.id, quantity: 1 })));
    }
  }, [data.availableJobRoles]);

  // ── Auto-apply the default team preset (positions + crew + equipment) ──
  useEffect(() => {
    if (!open || autoAppliedCrewPresetRef.current) return;
    if (activeStep < WIZARD_STEP_INDEX.TEAM || data.loadingCrewPresets || data.crewPresets.length === 0) return;
    if (data.loadingEquipment) return;
    const defaultPreset = data.crewPresets.find((preset) => preset.is_default);
    if (!defaultPreset) return;
    handlers.applyCrewPreset(defaultPreset);
    autoAppliedCrewPresetRef.current = true;
  }, [open, activeStep, data.loadingCrewPresets, data.crewPresets, data.loadingEquipment, handlers]);

  // ── Outro: redirect immediately — package page shows AI pipeline progress ──
  useEffect(() => {
    if (!createdPackageId) return;
    const timer = setTimeout(() => {
      onPackageCreated(createdPackageId);
      state.resetState();
      state.setCreatedPackageId(null);
    }, 250);
    return () => clearTimeout(timer);
  }, [createdPackageId]);

  const handleClose = () => {
    if (!isCreating) { state.resetState(); onClose(); }
  };

  return (
    <Dialog
      open={open} onClose={handleClose} maxWidth="xl" fullWidth
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' } } }}
      PaperProps={{
        sx: {
          maxWidth: 1160,
          backgroundColor: 'rgba(15,20,25,0.97)', backdropFilter: 'blur(12px)',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: 2.5, border: '1px solid rgba(148,163,184,0.15)',
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)', overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 1.5 }}>
        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>Create a Package</Typography>
        <IconButton onClick={handleClose} disabled={isCreating} sx={{ color: '#64748b', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Progress bar */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1.5 }}>
          <Typography sx={{ color: accent, fontSize: '0.8rem', fontWeight: 600 }}>{steps[activeStep]}</Typography>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: '#475569', fontSize: '0.7rem' }}>
              Step {activeStep + 1} of {steps.length}
            </Typography>
            {state.selectedEventType && (
              <>
                <Typography sx={{ color: '#334155', fontSize: '0.7rem' }}>·</Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>
                  {state.selectedEventType.icon ? `${state.selectedEventType.icon} ` : ''}
                  {state.selectedEventType.name}
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <Box sx={{ width: '100%', height: 3, bgcolor: '#1e293b', borderRadius: 2 }}>
          <Box sx={{ width: `${((activeStep + 1) / steps.length) * 100}%`, height: '100%', bgcolor: accent, borderRadius: 2, transition: 'width 0.3s ease' }} />
        </Box>
      </Box>

      <Box sx={{ height: '1px', bgcolor: 'rgba(148,163,184,0.1)' }} />

      {/* Content */}
      <DialogContent sx={{ pt: 2.5, px: 3, pb: 2, overflow: 'auto' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => state.setError(null)}>{error}</Alert>}

        {activeStep === WIZARD_STEP_INDEX.EVENT && <EventScreen state={state} derived={derived} handlers={handlers} />}
        {activeStep === WIZARD_STEP_INDEX.DAY_DESIGN && <DayDesignScreen state={state} derived={derived} handlers={handlers} />}
        {activeStep === WIZARD_STEP_INDEX.TEAM && <TeamScreen state={state} data={data} derived={derived} handlers={handlers} />}
        {activeStep === WIZARD_STEP_INDEX.REVIEW && <ReviewScreen state={state} data={data} derived={derived} handlers={handlers} />}
      </DialogContent>

      {/* Outro overlay */}
      {createdPackageId && (
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(8px)', borderRadius: 3,
        }}>
          <AutoAwesomeIcon sx={{ fontSize: 48, color: '#a78bfa', mb: 2, animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } } }} />
          <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.2rem', mb: 0.5 }}>Package Created</Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 3 }}>Setting up AI planning&hellip;</Typography>
          <LinearProgress sx={{
            width: 200, height: 3, borderRadius: 2,
            bgcolor: 'rgba(167,139,250,0.15)',
            '& .MuiLinearProgress-bar': { bgcolor: '#a78bfa', borderRadius: 2 },
          }} />
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 1.5, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
        <Box>
          {activeStep > 0 && (
            <Box component="button" onClick={handlers.handleBack} disabled={isCreating} sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, px: 2, py: 0.75,
              bgcolor: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 1,
              color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.15s',
              '&:hover': { bgcolor: 'rgba(148,163,184,0.12)', color: '#fff', borderColor: 'rgba(148,163,184,0.25)' },
              '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
            }}>
              <ArrowBackIcon sx={{ fontSize: '1rem' }} /> Back
            </Box>
          )}
        </Box>

        <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>Step {activeStep + 1} of {steps.length}</Typography>

        <Box>
          {activeStep <= WIZARD_STEP_INDEX.TEAM && (
            <Box
              component="button"
              onClick={() => void handlers.handleNext()}
              disabled={!canAdvance || isDayDesignRunning}
              sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, px: 2.5, py: 0.75,
              bgcolor: canAdvance && !isDayDesignRunning ? accent : '#334155', border: 'none', borderRadius: 1,
              color: canAdvance && !isDayDesignRunning ? '#0f172a' : '#64748b',
              cursor: canAdvance && !isDayDesignRunning ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.15s',
              '&:hover': canAdvance && !isDayDesignRunning ? { filter: 'brightness(0.9)' } : {},
            }}>
              {isDayDesignRunning ? (
                <>
                  <CircularProgress size={14} sx={{ color: '#64748b' }} />
                  Generating&hellip;
                </>
              ) : (
                <>
                  Next
                  <ArrowForwardIcon sx={{ fontSize: '1rem' }} />
                </>
              )}
            </Box>
          )}

          {activeStep === WIZARD_STEP_INDEX.REVIEW && (
            <Button onClick={handlers.handleCreate} disabled={!canCreate} variant="contained"
              startIcon={isCreating ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}
              sx={{ bgcolor: '#10b981', color: '#fff', fontWeight: 700, fontSize: '0.85rem', px: 3, textTransform: 'none',
                '&:hover': { bgcolor: '#059669' }, '&:disabled': { bgcolor: '#334155', color: '#64748b' } }}>
              {isCreating ? 'Creating...' : 'Create Package'}
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
