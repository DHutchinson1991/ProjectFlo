'use client';

import React, { useCallback } from 'react';
import { DayBlueprintAiRunsPanel } from '@/features/content/day-blueprints/components/DayBlueprintAiRunsPanel';
import type { DayBlueprintVersionStatus } from '@/features/content/day-blueprints/types';
import { useBlueprintDayDesignPipeline } from '../../day-design/useBlueprintDayDesignPipeline';

interface PackageDayDesignAiPanelProps {
  packageId: number | null;
  blueprintId: number | null;
  sourceVersionId: number | null;
  sourceVersionStatus?: DayBlueprintVersionStatus | null;
  blueprintDisplayName?: string | null;
  versionNumber?: number | null;
  visible: boolean;
  onRegenerated?: () => void;
}

export function PackageDayDesignAiPanel({
  packageId,
  blueprintId,
  sourceVersionId,
  sourceVersionStatus,
  blueprintDisplayName,
  versionNumber,
  visible,
  onRegenerated,
}: PackageDayDesignAiPanelProps) {
  const pipeline = useBlueprintDayDesignPipeline();

  const handleRegenerate = useCallback(async () => {
    if (!packageId || !blueprintId || !sourceVersionId) return;
    const confirmed = window.confirm(
      'Regenerate the day structure with AI and update this package from the new published design? Crew, equipment, and timing overrides remain on the package where possible.',
    );
    if (!confirmed) return;

    try {
      await pipeline.regenerateFromPackage({
        packageId,
        blueprintId,
        sourceVersionId,
        sourceVersionStatus: sourceVersionStatus ?? 'PUBLISHED',
      });
      onRegenerated?.();
    } catch {
      // pipeline.error surfaced in panel via isRunning state
    }
  }, [
    blueprintId,
    onRegenerated,
    packageId,
    pipeline,
    sourceVersionId,
    sourceVersionStatus,
  ]);

  if (!visible || !blueprintId || !sourceVersionId) {
    return null;
  }

  const versionIdForPanel = pipeline.activeVersionId ?? sourceVersionId;
  const versionLabel = blueprintDisplayName
    ? `${blueprintDisplayName}${versionNumber != null ? ` · v${versionNumber}` : ''}`
    : 'Package day design';

  return (
    <DayBlueprintAiRunsPanel
      blueprintId={blueprintId}
      versionId={versionIdForPanel}
      versionLabel={versionLabel}
      activeDay={null}
      readOnly={false}
      onGenerate={() => void handleRegenerate()}
      generateLabel={pipeline.isRunning ? 'Regenerating…' : 'Regenerate day structure'}
      generateTooltip="AI regenerates moments and actions, publishes, then resyncs this package"
      generatePending={pipeline.isRunning}
      generateDisabled={pipeline.isRunning}
    />
  );
}
