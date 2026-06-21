import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dayBlueprintsApi } from '../api';
import type { CreateDayBlueprintInput } from '../types';

export const dayBlueprintKeys = {
  all: ['day-blueprints'] as const,
  lists: (options?: { includeSeeded?: boolean }) => [...dayBlueprintKeys.all, 'list', options?.includeSeeded ? 'with-seeded' : 'without-seeded'] as const,
  detail: (id: number) => [...dayBlueprintKeys.all, 'detail', id] as const,
  versions: (id: number) => [...dayBlueprintKeys.all, id, 'versions'] as const,
  version: (id: number, versionId: number) =>
    [...dayBlueprintKeys.all, id, 'version', versionId] as const,
  publishedVersions: () => [...dayBlueprintKeys.all, 'published-versions'] as const,
  aiRuns: (versionId: number) =>
    [...dayBlueprintKeys.all, 'ai-runs', versionId] as const,
  aiRun: (runId: number) => [...dayBlueprintKeys.all, 'ai-run', runId] as const,
  aiProposals: (versionId: number) =>
    [...dayBlueprintKeys.all, 'ai-proposals', versionId] as const,
};

export function useDayBlueprints(options?: { includeSeeded?: boolean }) {
  return useQuery({
    queryKey: dayBlueprintKeys.lists(options),
    queryFn: () => dayBlueprintsApi.list(options),
  });
}

export function useDayBlueprint(id: number | null) {
  return useQuery({
    queryKey: id ? dayBlueprintKeys.detail(id) : dayBlueprintKeys.all,
    queryFn: () => dayBlueprintsApi.getById(id as number),
    enabled: typeof id === 'number' && id > 0,
  });
}

export function useDayBlueprintVersion(
  blueprintId: number | null,
  versionId: number | null,
) {
  return useQuery({
    queryKey:
      blueprintId && versionId
        ? dayBlueprintKeys.version(blueprintId, versionId)
        : dayBlueprintKeys.all,
    queryFn: () =>
      dayBlueprintsApi.versions.getById(blueprintId as number, versionId as number),
    enabled: Boolean(blueprintId && versionId),
  });
}

/**
 * Flat list of all published versions across every blueprint for the
 * current brand. Used by the package creation wizard to let users pick
 * a source blueprint to consume into the new package.
 */
export function usePublishedDayBlueprintVersions() {
  return useQuery({
    queryKey: dayBlueprintKeys.publishedVersions(),
    queryFn: async () => {
      const blueprints = await dayBlueprintsApi.list();
      const rows: Array<{
        blueprintId: number;
        blueprintName: string;
        eventCategory: string;
        versionId: number;
        versionNumber: number;
      }> = [];
      blueprints.forEach((bp) => {
        (bp.versions ?? [])
          .filter((v) => v.status === 'PUBLISHED')
          .forEach((v) => {
            rows.push({
              blueprintId: bp.id,
              blueprintName: bp.display_name,
              eventCategory: bp.event_category,
              versionId: v.id,
              versionNumber: v.version_number,
            });
          });
      });
      return rows;
    },
  });
}

export function useCreateDayBlueprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDayBlueprintInput) => dayBlueprintsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.lists() });
    },
  });
}

export function useDeleteDayBlueprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => dayBlueprintsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.lists() });
    },
  });
}

export function useUpdateDayBlueprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: number;
      data: Partial<Pick<CreateDayBlueprintInput, 'display_name' | 'description' | 'event_category'>>;
    }) => dayBlueprintsApi.update(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.lists() });
    },
  });
}

export function usePublishDayBlueprintVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ blueprintId, versionId }: { blueprintId: number; versionId: number }) =>
      dayBlueprintsApi.versions.publish(blueprintId, versionId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.detail(vars.blueprintId) });
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.lists() });
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.publishedVersions() });
    },
  });
}

export function useArchiveDayBlueprintVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ blueprintId, versionId }: { blueprintId: number; versionId: number }) =>
      dayBlueprintsApi.versions.archive(blueprintId, versionId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.detail(vars.blueprintId) });
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.lists() });
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.publishedVersions() });
    },
  });
}

export * from './ai';
export * from './authoring';
export * from './useBranchDayBlueprintDraft';
export * from './simulator';
