import { type GemmaService } from '../../../ai/gemma/gemma.service';

export interface GeneratedMoment {
  name: string;
  description?: string;
  duration_seconds?: number;
  is_key_moment?: boolean;
  subject_actions?: GeneratedSubjectAction[];
}

export interface GeneratedSubjectAction {
  subject_role: string;
  action_text: string;
  emphasis?: string;
  notes?: string;
}

export interface GeneratedActivity {
  name: string;
  description?: string;
  default_start_time?: string;
  default_duration_minutes?: number;
  moments?: GeneratedMoment[];
}

export interface SkeletonSlot {
  activityId: number;
  name: string;
  normalizedName: string;
  targetDurationSeconds: number;
  momentCount: number;
  description?: string;
}

export interface OutlineMoment {
  name: string;
  duration_seconds: number;
}

export interface OutlineActivity {
  name: string;
  moments: OutlineMoment[];
}

export interface OutlinePlan {
  activities: OutlineActivity[];
}

export interface ExpandedMoment {
  description?: string;
  subject_actions: GeneratedSubjectAction[];
}

export interface ExpandedActivity {
  moments: ExpandedMoment[];
}

export interface PhaseTimings {
  outlineMs: number;
  expansionMs: number;
  expansionParallelism: number;
}

export interface DayBlueprintGemmaRequest {
  chat: Parameters<GemmaService['chat']>[0];
  userMessage: string;
}

export interface SkeletonActivityInput {
  id: number;
  name: string;
  default_duration_minutes: number | null;
  target_moment_count?: number | null;
  description?: string | null;
}
