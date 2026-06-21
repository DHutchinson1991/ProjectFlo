'use client';

import { useCallback, useRef, useState } from 'react';
import { dayBlueprintsApi } from '@/features/content/day-blueprints/api';
import { dayBlueprintsAiApi } from '@/features/content/day-blueprints/api/ai';
import { dayBlueprintsAuthoringApi } from '@/features/content/day-blueprints/api/authoring';
import type { CreateDayBlueprintInput } from '@/features/content/day-blueprints/types';
import { servicePackagesApi } from '../api';
import { buildAiBriefCreateInput } from './build-ai-brief-payload';
import type { SimulatorAnswers } from '@/features/content/day-blueprints/components/simulator/useSimulatorAnswers';

export type DayDesignPipelineStatus =
  | 'idle'
  | 'creating'
  | 'generating'
  | 'publishing'
  | 'resyncing'
  | 'published'
  | 'error';

export interface DayDesignPipelineResult {
  blueprintId: number;
  versionId: number;
}

interface RunTemplateParams {
  templateBlueprintId: number;
  displayName: string;
  enhanceWithAi?: boolean;
  /** Package wizard: leave as DRAFT (not listed in published library). */
  forPackageWizard?: boolean;
}

interface RunAiBriefParams {
  eventCategory: string;
  displayName: string;
  description?: string;
  answers: SimulatorAnswers;
  isWeddingType: boolean;
  forPackageWizard?: boolean;
}

interface RegenerateFromPackageParams {
  packageId: number;
  blueprintId: number;
  sourceVersionId: number;
  sourceVersionStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  dayIds?: number[];
}

function resolveDraftVersionId(
  blueprintId: number,
  versions: Awaited<ReturnType<typeof dayBlueprintsApi.versions.list>>,
): number | null {
  const draft = versions.find((v) => v.status === 'DRAFT');
  return draft?.id ?? versions[0]?.id ?? null;
}

async function generateAllDays(versionId: number, dayIds: number[]): Promise<void> {
  for (const dayId of dayIds) {
    await dayBlueprintsAiApi.generator.generateDay(versionId, dayId, { mode: 'AI' });
  }
}

async function markWizardEphemeralBlueprint(blueprintId: number): Promise<void> {
  await dayBlueprintsApi.update(blueprintId, {
    is_active: false,
    variant_tags: { package_wizard_ephemeral: true },
  });
}

function finalizeWizardBlueprintRun(
  blueprintId: number,
  draftVersionId: number,
  forPackageWizard: boolean,
  publishDraft: (blueprintId: number, versionId: number) => Promise<{ id: number }>,
): Promise<{ blueprintId: number; versionId: number }> {
  if (forPackageWizard) {
    return markWizardEphemeralBlueprint(blueprintId).then(() => ({
      blueprintId,
      versionId: draftVersionId,
    }));
  }
  return publishDraft(blueprintId, draftVersionId).then((published) => ({
    blueprintId,
    versionId: published.id,
  }));
}

export function useBlueprintDayDesignPipeline() {
  const [status, setStatus] = useState<DayDesignPipelineStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const [result, setResult] = useState<DayDesignPipelineResult | null>(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = false;
    setStatus('idle');
    setError(null);
    setActiveVersionId(null);
    setResult(null);
  }, []);

  const publishDraft = useCallback(async (blueprintId: number, versionId: number) => {
    setStatus('publishing');
    const published = await dayBlueprintsApi.versions.publish(blueprintId, versionId);
    setResult({ blueprintId, versionId: published.id });
    setStatus('published');
    return published;
  }, []);

  const runTemplate = useCallback(async (params: RunTemplateParams): Promise<DayDesignPipelineResult> => {
    abortRef.current = false;
    setError(null);
    setResult(null);
    setStatus('creating');

    try {
      const cloned = await dayBlueprintsApi.clone(params.templateBlueprintId, {
        display_name: params.displayName.slice(0, 160),
      });
      const versions =
        cloned.versions && cloned.versions.length > 0
          ? cloned.versions
          : await dayBlueprintsApi.versions.list(cloned.id);
      const draftVersionId = resolveDraftVersionId(cloned.id, versions);
      if (!draftVersionId) {
        throw new Error('Could not find a draft version for the cloned template.');
      }

      setActiveVersionId(draftVersionId);

      if (params.enhanceWithAi) {
        const version = await dayBlueprintsApi.versions.getById(cloned.id, draftVersionId);
        const dayIds = (version.days ?? []).map((day) => day.id);
        setStatus('generating');
        await generateAllDays(draftVersionId, dayIds);
      }

      const finalized = await finalizeWizardBlueprintRun(
        cloned.id,
        draftVersionId,
        Boolean(params.forPackageWizard),
        publishDraft,
      );
      setResult(finalized);
      setStatus('published');
      return finalized;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Day design failed';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, [publishDraft]);

  const runAiBrief = useCallback(async (params: RunAiBriefParams): Promise<DayDesignPipelineResult> => {
    abortRef.current = false;
    setError(null);
    setResult(null);
    setStatus('creating');

    try {
      const createInput: CreateDayBlueprintInput = buildAiBriefCreateInput(params);
      const created = await dayBlueprintsApi.create(createInput);
      const versions =
        created.versions && created.versions.length > 0
          ? created.versions
          : await dayBlueprintsApi.versions.list(created.id);
      const draftVersionId = resolveDraftVersionId(created.id, versions);
      if (!draftVersionId) {
        throw new Error('Could not find a draft version for the new day design.');
      }

      setActiveVersionId(draftVersionId);
      const version = await dayBlueprintsApi.versions.getById(created.id, draftVersionId);
      const dayIds = (version.days ?? []).map((day) => day.id);

      setStatus('generating');
      await generateAllDays(draftVersionId, dayIds);

      const forPackageWizard = Boolean(params.forPackageWizard);
      const finalized = await finalizeWizardBlueprintRun(
        created.id,
        draftVersionId,
        forPackageWizard,
        publishDraft,
      );
      setResult(finalized);
      setStatus('published');
      return finalized;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI day design failed';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, [publishDraft]);

  const regenerateFromPackage = useCallback(async (
    params: RegenerateFromPackageParams,
  ): Promise<DayDesignPipelineResult> => {
    abortRef.current = false;
    setError(null);
    setResult(null);

    try {
      let blueprintId = params.blueprintId;
      let draftVersionId = params.sourceVersionId;

      if (params.sourceVersionStatus === 'PUBLISHED') {
        setStatus('creating');
        const draft = await dayBlueprintsAuthoringApi.versions.createDraft(blueprintId, {
          source_version_id: params.sourceVersionId,
          change_summary: 'Regenerate day design from package',
          replace_existing_draft: true,
        });
        draftVersionId = draft.id;
      }

      setActiveVersionId(draftVersionId);
      const version = await dayBlueprintsApi.versions.getById(blueprintId, draftVersionId);
      const allDayIds = (version.days ?? []).map((day) => day.id);
      const dayIds = params.dayIds && params.dayIds.length > 0 ? params.dayIds : allDayIds;

      setStatus('generating');
      await generateAllDays(draftVersionId, dayIds);

      const published = await publishDraft(blueprintId, draftVersionId);

      setStatus('resyncing');
      await servicePackagesApi.resyncBlueprint(params.packageId);

      setStatus('published');
      return { blueprintId, versionId: published.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Regenerate failed';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, [publishDraft]);

  const isRunning =
    status === 'creating' ||
    status === 'generating' ||
    status === 'publishing' ||
    status === 'resyncing';

  return {
    status,
    error,
    result,
    activeVersionId,
    isRunning,
    reset,
    runTemplate,
    runAiBrief,
    regenerateFromPackage,
  };
}
