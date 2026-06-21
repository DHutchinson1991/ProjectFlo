'use client';

import React, { useEffect, useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useDayBlueprints } from '@/features/content/day-blueprints/hooks';
import DayDesignSubstepHeader from '../components/DayDesignSubstepHeader';
import { libraryTileSx } from '../helpers/day-design-shared';
import {
  buildLibraryDayDesignOptions,
  type LibraryDayDesignOption,
} from '../helpers/library-day-design-options';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';

interface DayDesignLibraryStepProps {
  state: WizardState;
  derived: WizardDerived;
}

function optionKindLabel(kind: LibraryDayDesignOption['kind']): string {
  return kind === 'template' ? 'Template' : 'Saved';
}

function optionKindChipSx(kind: LibraryDayDesignOption['kind']) {
  return kind === 'template'
    ? { bgcolor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
    : { bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981' };
}

export default function DayDesignLibraryStep({ state, derived }: DayDesignLibraryStepProps) {
  const {
    selectedEventType,
    setDayDesignSource,
    setManualDayPlan,
    setDayDesignPhase,
    setSourceDayBlueprintVersionId,
    setSourceDayBlueprintId,
    setSelectedBlueprintActivityIds,
    setBlueprintDayMappings,
  } = state;
  const { accent } = derived;

  const { data: blueprints = [], isLoading } = useDayBlueprints({ includeSeeded: true });

  const libraryOptions = useMemo(
    () => (selectedEventType
      ? buildLibraryDayDesignOptions(blueprints, selectedEventType.name)
      : []),
    [blueprints, selectedEventType],
  );

  const templateOptions = useMemo(
    () => libraryOptions.filter((option) => option.kind === 'template'),
    [libraryOptions],
  );
  const savedOptions = useMemo(
    () => libraryOptions.filter((option) => option.kind === 'saved'),
    [libraryOptions],
  );

  useEffect(() => {
    setDayDesignSource(null);
    setManualDayPlan(null);
  }, [setDayDesignSource, setManualDayPlan]);

  const handleSelectDesign = (option: LibraryDayDesignOption) => {
    setDayDesignSource('blueprint');
    setManualDayPlan(null);
    setSourceDayBlueprintVersionId(option.versionId);
    setSourceDayBlueprintId(option.blueprintId);
    setSelectedBlueprintActivityIds(new Set());
    setBlueprintDayMappings({});
    setDayDesignPhase('review');
  };

  const renderOptionGrid = (options: LibraryDayDesignOption[]) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1.25 }}>
      {options.map((option) => (
        <Box
          key={`${option.kind}-${option.blueprintId}-${option.versionId}`}
          onClick={() => handleSelectDesign(option)}
          sx={libraryTileSx(accent)}
        >
          <Chip
            label={optionKindLabel(option.kind)}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              height: 18,
              fontSize: '0.6rem',
              border: 'none',
              ...optionKindChipSx(option.kind),
            }}
          />
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.3 }}>
            {option.name}
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>
            {option.dayCount} day{option.dayCount === 1 ? '' : 's'} · {option.activityCount} activit{option.activityCount === 1 ? 'y' : 'ies'}
            {option.versionStatus === 'PUBLISHED' ? ` · v${option.versionNumber}` : ''}
          </Typography>
          {option.description ? (
            <Typography sx={{ color: '#64748b', fontSize: '0.68rem', lineHeight: 1.4, flex: 1 }}>
              {option.description}
            </Typography>
          ) : null}
        </Box>
      ))}
    </Box>
  );

  if (!selectedEventType) return null;

  const isEmpty = !isLoading && libraryOptions.length === 0;

  return (
    <Box>
      <DayDesignSubstepHeader
        accent={accent}
        title="Choose a day design"
        subtitle={`Pick a starter template or a saved ${selectedEventType.name.toLowerCase()} design. Adjust activities and locations on the next screen.`}
      />

      {isLoading ? (
        <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
          Loading designs…
        </Typography>
      ) : isEmpty ? (
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px dashed rgba(148,163,184,0.2)',
            bgcolor: 'rgba(245,158,11,0.04)',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>
            No saved designs yet
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
            Use Back to try Create or Generate instead.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {templateOptions.length > 0 && (
            <Box>
              <Typography
                sx={{
                  color: '#94a3b8',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  mb: 1.25,
                }}
              >
                Starter templates
              </Typography>
              {renderOptionGrid(templateOptions)}
            </Box>
          )}

          {savedOptions.length > 0 && (
            <Box>
              <Typography
                sx={{
                  color: '#94a3b8',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  mb: 1.25,
                }}
              >
                Saved designs
              </Typography>
              {renderOptionGrid(savedOptions)}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
