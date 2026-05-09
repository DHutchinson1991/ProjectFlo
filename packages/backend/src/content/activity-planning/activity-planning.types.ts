import { PlanningStatus } from '@prisma/client';
import { PlanningEventData, PlanningStepEvent } from './services/planning-events.service';

export type PlannerSummaryStatus = PlanningStepEvent['status'] | 'skipped';

export interface PlannerSubject {
  id: number;
  name: string;
  role: string | null;
  isGroup: boolean;
}

export interface PlannerActivityRecord {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  package_id: number;
  package_event_day_id: number | null;
}

export interface PlannerMomentRecord {
  id: number;
  name: string;
  description: string | null;
  order_index: number;
  duration_seconds: number;
}

export interface ActivityPlanState {
  activity: PlannerActivityRecord | null;
  fullMoments: PlannerMomentRecord[];
  momentSource: 'existing' | 'knowledge-base' | 'ai-generated' | 'none';
  templateUsed: string | null;
  subjects: PlannerSubject[];
}

export interface SingleActivityPlanResult {
  momentCount: number;
  planned: boolean;
}

export interface PlannerSummaryEntry {
  step: string;
  label: string;
  status: PlannerSummaryStatus;
  stepIndex: number;
  activityName?: string;
  error?: string;
  data?: PlanningEventData;
}

export interface PackagePlanningSummary {
  packageId: number;
  startedAt: string;
  completedAt?: string;
  finalStatus: PlanningStatus | 'RUNNING';
  eventType: string;
  locationContext?: string;
  totalActivities: number;
  totalSubjects: number;
  steps: PlannerSummaryEntry[];
  errors: string[];
}

export interface PackagePlanningRunOptions {
  deferCompletion?: boolean;
  additionalSteps?: number;
}

export interface PackagePlanningRunResult {
  packageId: number;
  totalSteps: number;
  summary: PackagePlanningSummary;
  succeeded: boolean;
  deferredCompletion: boolean;
}

export interface PackagePlanningContext {
  packageId: number;
  activities: PlannerActivityRecord[];
  allSubjects: PlannerSubject[];
  eventType: string;
  locationContext?: string;
}