import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shotPreviewsApi, type GenerateShotPreviewPayload, type PromptPreview, type CompositionGuideResult, type SpatialOverlayResult, type PrepResult, type PrepareSceneResult, type MomentConflictsResult } from '../api/shot-previews.api';

export const shotPreviewKeys = {
  byAssignment: (assignmentId: number) => ['shot-previews', 'assignment', assignmentId] as const,
  byFilm: (filmId: number) => ['shot-previews', 'film', filmId] as const,
  promptPreview: (assignmentId: number, filmId: number) => ['shot-previews', 'prompt-preview', assignmentId, filmId] as const,
  compositionGuide: (assignmentId: number, filmId: number) => ['shot-previews', 'composition-guide', assignmentId, filmId] as const,
  spatialOverlay: (assignmentId: number, filmId: number) => ['shot-previews', 'spatial-overlay', assignmentId, filmId] as const,
  prep: (assignmentId: number) => ['shot-previews', 'prep', assignmentId] as const,
  momentConflicts: (sceneMomentId: number) => ['shot-previews', 'moment-conflicts', sceneMomentId] as const,
};

export const useMomentConflicts = (sceneMomentId?: number, sourceType?: string) => {
  return useQuery<MomentConflictsResult>({
    queryKey: shotPreviewKeys.momentConflicts(sceneMomentId ?? 0),
    queryFn: () => shotPreviewsApi.listMomentConflicts(sceneMomentId!, sourceType),
    enabled: !!sceneMomentId,
    staleTime: 30_000,
  });
};

export const useShotPreview = (assignmentId?: number) => {
  return useQuery({
    queryKey: shotPreviewKeys.byAssignment(assignmentId!),
    queryFn: () => shotPreviewsApi.getByAssignment(assignmentId!),
    enabled: !!assignmentId,
    select: (data) => data[0] ?? null, // Latest completed preview
  });
};

export const useShotPreviewsByFilm = (filmId?: number) => {
  return useQuery({
    queryKey: shotPreviewKeys.byFilm(filmId!),
    queryFn: () => shotPreviewsApi.getByFilm(filmId!),
    enabled: !!filmId,
  });
};

export const usePromptPreview = (payload?: GenerateShotPreviewPayload) => {
  return useQuery<PromptPreview>({ 
    queryKey: shotPreviewKeys.promptPreview(payload?.camera_assignment_id ?? 0, payload?.film_id ?? 0),
    queryFn: () => shotPreviewsApi.previewPrompt(payload!),
    enabled: !!(payload?.camera_assignment_id && payload?.film_id),
    staleTime: 30_000,
  });
};

export const useGenerateShotPreview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateShotPreviewPayload) =>
      shotPreviewsApi.generate(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: shotPreviewKeys.byAssignment(data.camera_assignment_id),
      });
      queryClient.invalidateQueries({
        queryKey: shotPreviewKeys.byFilm(data.film_id),
      });
    },
  });
};

/**
 * Vision feedback loop: critique a generated preview with Gemma and
 * optionally regenerate with the improved prompt.
 */
export const useCritiquePreview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (previewId: number) => shotPreviewsApi.critiqueAndRegenerate(previewId),
    onSuccess: (data) => {
      if (data.newPreviewId) {
        // Invalidate all preview queries so the new image appears
        queryClient.invalidateQueries({ queryKey: ['shot-previews'] });
      }
    },
  });
};

export const useCompositionGuide = (assignmentId?: number, filmId?: number, enabled = false) => {
  return useQuery<CompositionGuideResult>({
    queryKey: shotPreviewKeys.compositionGuide(assignmentId!, filmId!),
    queryFn: () => shotPreviewsApi.getCompositionGuide(assignmentId!, filmId!),
    enabled: enabled && !!assignmentId && !!filmId,
    staleTime: 60_000,
  });
};

export const useSpatialOverlay = (assignmentId?: number, filmId?: number, enabled = false) => {
  return useQuery<SpatialOverlayResult>({
    queryKey: shotPreviewKeys.spatialOverlay(assignmentId!, filmId!),
    queryFn: () => shotPreviewsApi.getSpatialOverlay(assignmentId!, filmId!),
    enabled: enabled && !!assignmentId && !!filmId,
    staleTime: 5_000,
  });
};

/**
 * Prep a single camera assignment: context → spatial → director → ControlNet SVG.
 * No image generation — saves pipeline_data for later render.
 */
export const usePrepareShotPreview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateShotPreviewPayload) =>
      shotPreviewsApi.prepare(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(shotPreviewKeys.prep(data.assignmentId), data);
      // Invalidate composition guide so it re-fetches with new SVG
      if (data.compositionGuide?.available) {
        queryClient.invalidateQueries({
          queryKey: ['shot-previews', 'composition-guide'],
        });
      }
    },
  });
};

/**
 * Activity-level scene prep — 3 LLM calls plan ALL moments + cameras in one shot.
 * Replaces per-moment Shot Director with a holistic activity planner.
 */
export const usePrepareScene = () => {
  const queryClient = useQueryClient();

  return useMutation<PrepareSceneResult, Error, { filmSceneId: number; filmId: number; sourceType?: string }>({
    mutationFn: ({ filmSceneId, filmId, sourceType }) =>
      shotPreviewsApi.prepareScene(filmSceneId, filmId, sourceType),
    onSuccess: (data) => {
      for (const m of data.moments) {
        for (const r of m.assignments) {
          if (r.prepared) {
            queryClient.invalidateQueries({ queryKey: shotPreviewKeys.prep(r.assignmentId) });
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['shot-previews', 'composition-guide'] });
    },
  });
};
