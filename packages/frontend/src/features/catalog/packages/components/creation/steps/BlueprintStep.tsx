import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import { usePublishedDayBlueprintVersions } from '@/features/content/day-blueprints/hooks';
import type { WizardState } from '../hooks/useWizardState';
import type { WizardDerived } from '../hooks/useWizardDerived';

interface BlueprintStepProps {
  state: WizardState;
  derived: WizardDerived;
}

function normalizeCategory(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

export default function BlueprintStep({ state, derived }: BlueprintStepProps) {
  const { selectedEventType, sourceDayBlueprintVersionId } = state;
  const { accent } = derived;
  const { data: publishedVersions = [], isLoading: loadingBlueprints } =
    usePublishedDayBlueprintVersions();

  const filteredBlueprints = useMemo(() => {
    if (!selectedEventType) return [];
    const selectedCategory = normalizeCategory(selectedEventType.name);
    return publishedVersions.filter(
      (blueprint) => normalizeCategory(blueprint.eventCategory) === selectedCategory,
    );
  }, [publishedVersions, selectedEventType]);

  if (!selectedEventType) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
        <DesignServicesIcon sx={{ fontSize: '0.9rem', color: '#94a3b8' }} />
        <Typography sx={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.82rem' }}>
          Choose a published blueprint
        </Typography>
      </Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mb: 2 }}>
        Package creation is blueprint-first. We will scaffold this package from the selected {selectedEventType.name.toLowerCase()} blueprint.
      </Typography>

      {loadingBlueprints ? (
        <Typography sx={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
          Loading blueprints...
        </Typography>
      ) : filteredBlueprints.length === 0 ? (
        <Typography sx={{ color: '#f59e0b', fontSize: '0.8rem' }}>
          No published {selectedEventType.name} blueprints found. Publish one in Day Designer first.
        </Typography>
      ) : (
        <Box sx={{
          display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(148,163,184,0.2)', borderRadius: 2 },
        }}>
          {filteredBlueprints.map((blueprint) => {
            const isSelected = sourceDayBlueprintVersionId === blueprint.versionId;
            return (
              <Box
                key={blueprint.versionId}
                onClick={() => {
                  if (isSelected) return;
                  state.setSourceDayBlueprintVersionId(blueprint.versionId);
                  state.setSourceDayBlueprintId(blueprint.blueprintId);
                  state.setSelectedBlueprintActivityIds(new Set());
                  state.setBlueprintDayMappings({});
                }}
                sx={{
                  flex: '0 0 calc((100% - 6 * 12px) / 5)', minWidth: 140, scrollSnapAlign: 'start',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  gap: 0.6, p: 1.5, borderRadius: 2, cursor: 'pointer', border: '2px solid',
                  borderColor: isSelected ? accent : 'rgba(148,163,184,0.12)',
                  bgcolor: isSelected ? `${accent}0A` : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: isSelected ? accent : 'rgba(148,163,184,0.3)', transform: 'translateY(-1px)' },
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3 }}>
                  {blueprint.blueprintName}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                  Version {blueprint.versionNumber}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.35px' }}>
                  {blueprint.eventCategory}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
