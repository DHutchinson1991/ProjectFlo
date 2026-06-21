'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Box, LinearProgress, TextField, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useSimulatorAnswers } from '@/features/content/day-blueprints/components/simulator/useSimulatorAnswers';
import {
  StepEventDayDetail,
  StepEventDays,
} from '@/features/content/day-blueprints/components/simulator/simulator-steps';
import { useBlueprintDayDesignPipeline } from '../../../day-design/useBlueprintDayDesignPipeline';
import DayDesignSubstepHeader from '../components/DayDesignSubstepHeader';
import { buildDefaultBlueprintName } from '../helpers/day-design-shared';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';

interface DayDesignGenerateStepProps {
  state: WizardState;
  derived: WizardDerived;
}

export default function DayDesignGenerateStep({ state, derived }: DayDesignGenerateStepProps) {
  const {
    selectedEventType,
    setDayDesignSource,
    setManualDayPlan,
    setIsDayDesignRunning,
    setDayDesignPhase,
    setSourceDayBlueprintVersionId,
    setSourceDayBlueprintId,
    setSelectedBlueprintActivityIds,
    setBlueprintDayMappings,
  } = state;
  const { accent } = derived;

  const [aiDisplayName, setAiDisplayName] = useState('');
  const answersStore = useSimulatorAnswers(null);
  const pipeline = useBlueprintDayDesignPipeline();

  const isWeddingType =
    selectedEventType?.name?.toLowerCase().includes('wedding') ?? false;

  useEffect(() => {
    setIsDayDesignRunning(pipeline.isRunning);
  }, [pipeline.isRunning, setIsDayDesignRunning]);

  useEffect(() => {
    if (!selectedEventType) return;
    setAiDisplayName(buildDefaultBlueprintName(selectedEventType.name));
  }, [selectedEventType]);

  useEffect(() => {
    setDayDesignSource(null);
    setManualDayPlan(null);
  }, [setDayDesignSource, setManualDayPlan]);

  const applyPipelineResult = (blueprintId: number, versionId: number) => {
    setDayDesignSource('blueprint');
    setManualDayPlan(null);
    setSourceDayBlueprintVersionId(versionId);
    setSourceDayBlueprintId(blueprintId);
    setSelectedBlueprintActivityIds(new Set());
    setBlueprintDayMappings({});
    setDayDesignPhase('review');
  };

  const handleBuildAi = async () => {
    if (!selectedEventType || !aiDisplayName.trim()) return;
    try {
      const result = await pipeline.runAiBrief({
        eventCategory: selectedEventType.name,
        displayName: aiDisplayName.trim(),
        answers: answersStore.answers,
        isWeddingType,
        forPackageWizard: true,
      });
      applyPipelineResult(result.blueprintId, result.versionId);
    } catch {
      /* error surfaced via pipeline.error */
    }
  };

  const eventDayCount = Math.max(1, Math.min(3, answersStore.answers.basics.eventDays ?? 1));

  const simulatorStepProps = {
    answers: answersStore.answers,
    patchBasics: answersStore.patchBasics,
    patchPeople: answersStore.patchPeople,
    patchLocations: answersStore.patchLocations,
    day: null,
    version: null,
    completeness: null,
  };

  const progressLabel = (() => {
    switch (pipeline.status) {
      case 'creating': return 'Preparing day design…';
      case 'generating': return 'Generating moments with AI…';
      case 'publishing': return 'Publishing day design…';
      case 'published': return 'Day design ready';
      default: return '';
    }
  })();

  if (!selectedEventType) return null;

  const canGenerate = aiDisplayName.trim().length > 0 && !pipeline.isRunning;

  return (
    <Box>
      <DayDesignSubstepHeader
        accent={accent}
        title="Generate with AI"
        subtitle="Tell us about the event — we will draft a day design you can refine before moving on."
      />

      {pipeline.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => pipeline.reset()}>
          {pipeline.error}
        </Alert>
      )}

      {pipeline.isRunning ? (
        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.12)' }}>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 1 }}>{progressLabel}</Typography>
          <LinearProgress sx={{ borderRadius: 1, bgcolor: 'rgba(148,163,184,0.1)', '& .MuiLinearProgress-bar': { bgcolor: accent } }} />
        </Box>
      ) : (
        <>
          <TextField
            size="small"
            fullWidth
            label="Day design name"
            value={aiDisplayName}
            onChange={(e) => setAiDisplayName(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                color: '#e2e8f0',
                bgcolor: 'rgba(0,0,0,0.2)',
                '& fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(148,163,184,0.35)' },
                '&.Mui-focused fieldset': { borderColor: accent },
              },
              '& .MuiInputLabel-root': { color: '#64748b' },
            }}
          />

          <Typography
            sx={{
              color: '#94a3b8',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.45px',
              mb: 1.25,
            }}
          >
            Event brief
          </Typography>

          <StepEventDays {...simulatorStepProps} />
          {eventDayCount > 1 &&
            Array.from({ length: eventDayCount }, (_, index) => (
              <StepEventDayDetail
                key={index + 1}
                dayNumber={index + 1}
                {...simulatorStepProps}
              />
            ))}

          <Box
            component="button"
            type="button"
            onClick={handleBuildAi}
            disabled={!canGenerate}
            sx={{
              mt: 2.5,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 2.5,
              py: 1.1,
              borderRadius: 1.5,
              border: 'none',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              bgcolor: canGenerate ? accent : '#334155',
              color: canGenerate ? '#0f172a' : '#64748b',
              fontSize: '0.85rem',
              fontWeight: 700,
              transition: 'all 0.15s',
              '&:hover': canGenerate ? { filter: 'brightness(0.92)' } : {},
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />
            Generate day design
            <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
        </>
      )}
    </Box>
  );
}
