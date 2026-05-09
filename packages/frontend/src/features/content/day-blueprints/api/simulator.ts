import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

export type SimulatorStepId =
  | 'basics'
  | 'people'
  | 'locations'
  | 'timeline'
  | 'moments'
  | 'actions'
  | 'spatial';

export interface SimulatorCompletenessStep {
  step: SimulatorStepId;
  label: string;
  score: number;
  hits: number;
  total: number;
  missing: string[];
}

export interface SimulatorCompleteness {
  versionId: number;
  dayId: number;
  overall: number;
  steps: SimulatorCompletenessStep[];
  assumptions: string[];
}

export interface RefineDayInput {
  prompt?: string;
  assumptions?: string[];
  focus?: 'moments' | 'actions' | 'placements' | 'timing' | 'people' | 'locations' | 'all';
  allowed_activity_names?: string[];
  expected_activity_count?: number;
  lock_activity_set?: boolean;
}

export interface RefineDayResult {
  runId: number;
  momentsCreated: number;
  actionsCreated: number;
  placementsCreated: number;
  momentsWithCoverage: number;
}

export interface GenerateSpatialInput {
  activity_id?: number;
  moment_id?: number;
}

export interface GenerateSpatialResult {
  dayId: number;
  activitiesTouched: number;
  momentsScanned: number;
  momentsTouched: number;
  placementsCreated: number;
  placementsUpdated: number;
}

export const createDayBlueprintsSimulatorApi = (client: ApiClient) => ({
  completeness: {
    get: (versionId: number, dayId: number): Promise<SimulatorCompleteness> =>
      client.get(`/api/day-blueprints/versions/${versionId}/days/${dayId}/completeness`),
  },
  refine: {
    refineDay: (versionId: number, dayId: number, data: RefineDayInput): Promise<RefineDayResult> =>
      client.post(`/api/day-blueprints/versions/${versionId}/days/${dayId}/ai-refine`, data),
  },
  spatial: {
    generateDay: (
      versionId: number,
      dayId: number,
      data: GenerateSpatialInput,
    ): Promise<GenerateSpatialResult> =>
      client.post(`/api/day-blueprints/versions/${versionId}/days/${dayId}/spatial-generate`, data),
  },
});

export const dayBlueprintsSimulatorApi = createDayBlueprintsSimulatorApi(apiClient);
export type DayBlueprintsSimulatorApi = ReturnType<typeof createDayBlueprintsSimulatorApi>;
