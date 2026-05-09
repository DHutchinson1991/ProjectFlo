import { apiClient } from '@/shared/api/client';

export interface ShotPreview {
  id: number;
  camera_assignment_id: number;
  film_id: number;
  brand_id: number;
  prompt: string;
  negative_prompt: string | null;
  image_path: string;
  seed: number | null;
  model_name: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateShotPreviewPayload {
  camera_assignment_id: number;
  film_id: number;
  source_type?: 'package' | 'project';
  location_hint?: string;
}

export interface PromptPreview {
  prompt: string;
  negativePrompt: string;
  shotType: string | null;
  resolvedShotType?: string | null;
  rawSpatialShotType?: string | null;
  shotDecisionSource?: 'assignment' | 'coverage' | 'spatial' | 'fallback' | string;
  momentName: string;
  parts: {
    style: string;
    framing: string | null;
    scene: string;
    quality: string;
  };
}

export interface CritiqueResult {
  critique: string;
  improvedPrompt: string;
  confidence: number;
  regenerated: boolean;
  newPreviewId?: number;
}

export interface CompositionGuideResult {
  available: boolean;
  svg: string | null;
  strength?: number;
  reason?: string;
  subjects?: Array<{ name: string; frameX: number; scale: number; depth: string; side: string }>;
  inferredShotType?: string;
  resolvedShotType?: string;
  rawSpatialShotType?: string | null;
  shotDecisionSource?: 'assignment' | 'coverage' | 'spatial' | 'fallback' | string;
}

export interface SpatialOverlayResult {
  available: boolean;
  svg: string | null;
  reason?: string;
  subjects?: Array<{ name: string; frameX: number; scale: number; depth: string; side: string; distance: number }>;
  inferredShotType?: string;
  resolvedShotType?: string;
  rawSpatialShotType?: string | null;
  shotDecisionSource?: 'assignment' | 'coverage' | 'spatial' | 'fallback' | string;
}

/** Director output from the prep stage */
export interface DirectorNotes {
  emotionalTone: string;
  compositionNotes: string;
  source?: string;
  subjects: Array<{
    name: string;
    directedAction: string;
    gazeTarget: string;
    emphasis: number;
  }>;
}

/** Result of preparing a single camera assignment */
export interface PrepResult {
  assignmentId: number;
  prepared: boolean;
  error?: string;
  director?: DirectorNotes;
  compositionGuide?: { available: boolean; svg: string | null; strength?: number };
  spatialFrame?: { inferredShotType: string; visibleCount: number; visibleSubjectIds?: number[] } | null;
  spatialHash?: string | null;
  resolvedShotType?: string | null;
  rawSpatialShotType?: string | null;
  shotDecisionSource?: 'assignment' | 'coverage' | 'spatial' | 'fallback' | string;
}

/** Result of activity-level scene prep — all moments + cameras planned at once */
export interface PrepareSceneResult {
  filmSceneId: number;
  activityName: string;
  overallArc: string | null;
  moments: Array<{
    momentId: number;
    momentName: string;
    assignments: Array<{ assignmentId: number; prepared: boolean; error?: string }>;
  }>;
}

export const shotPreviewsApi = {
  /** Prep a single assignment: context → spatial → director → ControlNet SVG. No image. */
  prepare: (payload: GenerateShotPreviewPayload): Promise<PrepResult> =>
    apiClient.post('/api/content/shot-previews/prepare', payload),

  /** Activity-level scene prep — 3 LLM calls plan ALL moments + cameras in one shot */
  prepareScene: (filmSceneId: number, filmId: number, sourceType?: string): Promise<PrepareSceneResult> =>
    apiClient.post(`/api/content/shot-previews/prepare-scene/${filmSceneId}`, {
      filmId,
      sourceType: sourceType || 'package',
    }),

  /** Render: compositor → stylist → ComfyUI image generation */
  generate: (payload: GenerateShotPreviewPayload): Promise<ShotPreview> =>
    apiClient.post('/api/content/shot-previews/generate', payload),

  getByAssignment: (assignmentId: number): Promise<ShotPreview[]> =>
    apiClient.get(`/api/content/shot-previews/by-assignment/${assignmentId}`),

  getByFilm: (filmId: number): Promise<ShotPreview[]> =>
    apiClient.get(`/api/content/shot-previews/by-film/${filmId}`),

  previewPrompt: (payload: GenerateShotPreviewPayload): Promise<PromptPreview> =>
    apiClient.post('/api/content/shot-previews/preview-prompt', payload),

  getOne: (id: number): Promise<ShotPreview> =>
    apiClient.get(`/api/content/shot-previews/${id}`),

  remove: (id: number): Promise<void> =>
    apiClient.delete(`/api/content/shot-previews/${id}`),

  healthCheck: (): Promise<{ comfyui: boolean }> =>
    apiClient.get('/api/content/shot-previews/health'),

  /** Vision feedback loop: critique a generated image and regenerate with improved prompt */
  critiqueAndRegenerate: (previewId: number): Promise<CritiqueResult> =>
    apiClient.post(`/api/content/shot-previews/${previewId}/critique`, {}),

  /** Fetch the dynamic ControlNet composition guide SVG for a camera assignment */
  getCompositionGuide: (assignmentId: number, filmId: number, sourceType?: string): Promise<CompositionGuideResult> =>
    apiClient.get(`/api/content/shot-previews/composition-guide/${assignmentId}?filmId=${filmId}${sourceType ? `&sourceType=${sourceType}` : ''}`),

  /** Fetch the visual spatial overlay SVG (subject markers, depth, grid) for a camera assignment */
  getSpatialOverlay: (assignmentId: number, filmId: number, sourceType?: string): Promise<SpatialOverlayResult> =>
    apiClient.get(`/api/content/shot-previews/spatial-overlay/${assignmentId}?filmId=${filmId}${sourceType ? `&sourceType=${sourceType}` : ''}`),

  /**
   * Phase D: list reported conflicts for all camera assignments under a
   * scene moment. Geometry and editorial intent diverge is surfaced, not
   * force-applied.
   */
  listMomentConflicts: (sceneMomentId: number, sourceType?: string): Promise<MomentConflictsResult> =>
    apiClient.get(`/api/content/shot-previews/conflicts/${sceneMomentId}${sourceType ? `?sourceType=${sourceType}` : ''}`),
};

export type MomentConflict =
  | {
      kind: 'SHOT_TYPE_MISMATCH';
      assignmentId: number;
      trackName: string | null;
      editorial: string;
      geometric: string;
      reason?: string;
    }
  | {
      kind: 'TARGET_NOT_VISIBLE';
      assignmentId: number;
      trackName: string | null;
      targetSubjectIds: number[];
      visibleSubjectIds: number[];
    };

export interface MomentConflictsResult {
  sceneMomentId: number;
  conflicts: MomentConflict[];
}
