import { StepHandle } from './pipeline-logger';

/**
 * Base interface for all pipeline steps.
 * Each step receives typed input, logs via StepHandle, and returns typed output.
 * LLM steps must implement deterministic fallback if the LLM response is invalid.
 */
export interface PipelineStep<TInput, TOutput> {
  readonly name: string;
  readonly type: 'llm' | 'deterministic' | 'external';

  /**
   * Execute the step.
   * @param step - Optional StepHandle for structured pipeline logging.
   *   Required for steps called from SceneOrchestrationService;
   *   optional for steps called directly from ActivityPlannerService.
   */
  execute(input: TInput, step?: StepHandle): Promise<TOutput>;
}

// ── Shared types ──────────────────────────────────────────────────────

/** Narrative context gathered deterministically from the timeline */
export interface NarrativeContext {
  momentName: string;
  momentIndex: number;
  totalMoments: number;
  position: 'opening' | 'early' | 'middle' | 'late' | 'closing';
  activityName: string | null;
  previousMoment: { name: string; description?: string } | null;
  nextMoment: { name: string } | null;
  musicCue: { trackName: string; genre?: string; tempo?: string } | null;
  /** Full ordered timeline for LLM context */
  sceneTimeline: Array<{ name: string; order: number; isCurrent: boolean }>;
}

/** Subject position data after blocking */
export interface BlockedSubject {
  name: string;
  x: number;
  y: number;
  rotation: number;
  actionDescription: string;
  daySubjectId: number;
  positionId: number;
}

/** Camera position data after blocking */
export interface BlockedCamera {
  label: string;
  x: number;
  y: number;
  rotation: number;
  subjectNames: string[];
  cameraPositionId: number;
}

/** Result from the blocking pipeline (Steps 0–1) */
export interface BlockingPipelineResult {
  momentDescription: string;
  durationSeconds: number;
  subjects: BlockedSubject[];
  cameras: BlockedCamera[];
  narrativeContext: NarrativeContext;
  model: string;
}

/** Presence map from casting step — subject name (lowercase) → present boolean */
export type PresenceMap = Map<string, boolean>;

/** Result from the per-camera prep pipeline (Steps 2–3) */
export interface PrepPipelineResult {
  assignmentId: number;
  spatialFrame: import('../../content/spatial-engine/services/spatial-translator.service').SpatialFrame;
  director: {
    emotionalTone: string;
    subjects: Array<{ name: string; gazeTarget?: string; emphasis?: number; directedAction?: string }>;
  };
  compositionGuide: {
    svg: string;
    strength: number;
  } | null;
  pipelineData: Record<string, unknown>;
}

/** Result from the render pipeline (Steps 4–7) */
export interface RenderPipelineResult {
  assignmentId: number;
  prompt: string;
  negativePrompt: string;
  frameScript: Record<string, unknown>;
  imageUrl: string | null;
  comfyPromptId: string | null;
}
