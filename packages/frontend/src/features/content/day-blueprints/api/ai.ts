import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  ApplyDayBlueprintAiProposalInput,
  CreateDayBlueprintAiProposalInput,
  DayBlueprintAiPreview,
  DayBlueprintAiProposal,
  DayBlueprintAiRun,
  DayBlueprintDiff,
  StartDayBlueprintAiRunInput,
} from '../types';

export const createDayBlueprintsAiApi = (client: ApiClient) => ({
  runs: {
    list: (versionId: number): Promise<DayBlueprintAiRun[]> =>
      client.get(`/api/day-blueprints/versions/${versionId}/ai-runs`),

    getById: (runId: number): Promise<DayBlueprintAiRun> =>
      client.get(`/api/day-blueprints/ai-runs/${runId}`),

    start: (versionId: number, data: StartDayBlueprintAiRunInput): Promise<DayBlueprintAiRun> =>
      client.post(`/api/day-blueprints/versions/${versionId}/ai-runs`, data),

    finish: (runId: number, data: { error?: string }): Promise<DayBlueprintAiRun> =>
      client.patch(`/api/day-blueprints/ai-runs/${runId}/finish`, data),

    cancel: (runId: number): Promise<{ runId: number; status: 'CANCEL_REQUESTED' | 'NOT_RUNNING' }> =>
      client.post(`/api/day-blueprints/ai-runs/${runId}/cancel`, {}),

    report: (runId: number): Promise<unknown> =>
      client.get(`/api/day-blueprints/ai-runs/${runId}/report`),
  },

  proposals: {
    listForVersion: (versionId: number): Promise<DayBlueprintAiProposal[]> =>
      client.get(`/api/day-blueprints/versions/${versionId}/ai-proposals`),

    create: (data: CreateDayBlueprintAiProposalInput): Promise<DayBlueprintAiProposal> =>
      client.post('/api/day-blueprints/ai-proposals', data),

    preview: (versionId: number, diff: DayBlueprintDiff): Promise<DayBlueprintAiPreview> =>
      client.post(`/api/day-blueprints/versions/${versionId}/ai-preview`, { diff_json: diff }),

    apply: (
      proposalId: number,
      data: ApplyDayBlueprintAiProposalInput,
    ): Promise<DayBlueprintAiProposal> =>
      client.post(`/api/day-blueprints/ai-proposals/${proposalId}/apply`, data),

    reject: (proposalId: number): Promise<DayBlueprintAiProposal> =>
      client.post(`/api/day-blueprints/ai-proposals/${proposalId}/reject`, {}),
  },

  generator: {
    /** One-shot AI generation of a Day's activities + moments. */
    generateDay: (
      versionId: number,
      dayId: number,
      data: {
        prompt?: string;
        activity_id?: number;
      },
    ): Promise<{
      runId: number;
      momentsCreated: number;
      actionsCreated: number;
      placementsCreated: number;
      momentsWithCoverage: number;
    }> =>
      client.post(
        `/api/day-blueprints/versions/${versionId}/days/${dayId}/ai-generate`,
        data,
      ),
  },
});

export const dayBlueprintsAiApi = createDayBlueprintsAiApi(apiClient);
export type DayBlueprintsAiApi = ReturnType<typeof createDayBlueprintsAiApi>;
