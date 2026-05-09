import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dayBlueprintsSimulatorApi } from '../api/simulator';
import type { RefineDayInput } from '../api/simulator';
import { dayBlueprintKeys } from './index';

const completenessKey = (versionId: number, dayId: number) =>
  [...dayBlueprintKeys.all, 'simulator', 'completeness', versionId, dayId] as const;

/** Read-only simulation completeness rollup. */
export function useSimulationCompleteness(
  versionId: number | null,
  dayId: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: versionId && dayId
      ? completenessKey(versionId, dayId)
      : ['day-blueprint-simulator-completeness', 'none'],
    queryFn: () => dayBlueprintsSimulatorApi.completeness.get(versionId as number, dayId as number),
    enabled: Boolean(versionId && dayId) && (options?.enabled ?? true),
    staleTime: 2_000,
  });
}

/**
 * Refine the current day with simulator-collected assumptions and a
 * focused brief. Server-side this delegates to the same generator
 * pipeline as `useGenerateDayBlueprintDay`, so progress events stream
 * through the existing SSE channel.
 */
export function useRefineDayBlueprintDay(
  blueprintId: number | null,
  versionId: number | null,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, ...input }: { dayId: number } & RefineDayInput) =>
      dayBlueprintsSimulatorApi.refine.refineDay(versionId as number, dayId, input),
    onSuccess: (_data, vars) => {
      if (versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.aiRuns(versionId) });
      }
      if (blueprintId && versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.version(blueprintId, versionId) });
      }
      if (versionId && vars.dayId) {
        qc.invalidateQueries({ queryKey: completenessKey(versionId, vars.dayId) });
      }
    },
  });
}

export function useGenerateDayBlueprintSpatial(
  blueprintId: number | null,
  versionId: number | null,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      dayId,
      activityId,
      momentId,
    }: {
      dayId: number;
      activityId?: number;
      momentId?: number;
    }) =>
      dayBlueprintsSimulatorApi.spatial.generateDay(versionId as number, dayId, {
        activity_id: activityId,
        moment_id: momentId,
      }),
    onSuccess: (_data, vars) => {
      if (blueprintId && versionId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.version(blueprintId, versionId) });
      }
      if (versionId && vars.dayId) {
        qc.invalidateQueries({ queryKey: completenessKey(versionId, vars.dayId) });
      }
    },
  });
}

export { completenessKey as simulatorCompletenessKey };
