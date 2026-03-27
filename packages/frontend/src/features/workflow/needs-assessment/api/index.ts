import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
    NeedsAssessmentTemplate,
    NeedsAssessmentSubmission,
    NeedsAssessmentSubmissionPayload,
    NaDateConflictResult,
    NaCrewConflictResult,
} from '@/features/workflow/inquiries/types/needs-assessment';

// ─── Needs Assessment Templates ───────────────────────────────────────────────

export function createNeedsAssessmentTemplatesApi(client: ApiClient) {
    return {
        getActive: (): Promise<NeedsAssessmentTemplate> =>
            client.get('/api/needs-assessments/templates/active'),
        getAll: (): Promise<NeedsAssessmentTemplate[]> =>
            client.get('/api/needs-assessments/templates'),
        getById: (id: number): Promise<NeedsAssessmentTemplate> =>
            client.get(`/api/needs-assessments/templates/${id}`),
        create: (data: Omit<NeedsAssessmentTemplate, 'id' | 'brand_id' | 'created_at' | 'updated_at'>): Promise<NeedsAssessmentTemplate> =>
            client.post('/api/needs-assessments/templates', data),
        update: (id: number, data: Partial<NeedsAssessmentTemplate>): Promise<NeedsAssessmentTemplate> =>
            client.put(`/api/needs-assessments/templates/${id}`, data),
    };
}

// ─── Needs Assessment Submissions ─────────────────────────────────────────────

export function createNeedsAssessmentSubmissionsApi(client: ApiClient) {
    return {
        getAll: (): Promise<NeedsAssessmentSubmission[]> =>
            client.get('/api/needs-assessments/submissions'),
        getByInquiryId: (inquiryId: number): Promise<NeedsAssessmentSubmission[]> =>
            client.get(`/api/needs-assessments/submissions?inquiryId=${inquiryId}`),
        getById: (id: number): Promise<NeedsAssessmentSubmission> =>
            client.get(`/api/needs-assessments/submissions/${id}`),
        create: (data: NeedsAssessmentSubmissionPayload): Promise<NeedsAssessmentSubmission> =>
            client.post('/api/needs-assessments/submissions', data),
        convert: (id: number): Promise<NeedsAssessmentSubmission> =>
            client.post(`/api/needs-assessments/submissions/${id}/convert`),
        checkDateConflicts: (id: number): Promise<NaDateConflictResult> =>
            client.get(`/api/needs-assessments/submissions/${id}/conflict-check`),
        checkCrewConflicts: (id: number): Promise<NaCrewConflictResult> =>
            client.get(`/api/needs-assessments/submissions/${id}/crew-conflict-check`),
        review: (id: number, data: { review_notes?: string; review_checklist_state?: Record<string, boolean> }): Promise<NeedsAssessmentSubmission> =>
            client.patch(`/api/needs-assessments/submissions/${id}/review`, data),
    };
}

// ─── Public Needs Assessment (unauthenticated) ────────────────────────────────

export function createPublicNeedsAssessmentApi(client: ApiClient) {
    return {
        getByShareToken: (token: string): Promise<NeedsAssessmentTemplate & { questions: unknown[] }> =>
            client.get(`/api/needs-assessments/share/${encodeURIComponent(token)}`, { skipBrandContext: true, skipAuth: true }),
        submit: (token: string, data: Record<string, unknown>): Promise<NeedsAssessmentSubmission> =>
            client.post(`/api/needs-assessments/share/${encodeURIComponent(token)}/submit`, data, { skipBrandContext: true, skipAuth: true }),
        updateSubmission: (submissionId: number, responses: Record<string, unknown>): Promise<NeedsAssessmentSubmission> =>
            client.patch(`/api/needs-assessments/share/submission/${submissionId}/responses`, { responses }, { skipBrandContext: true, skipAuth: true }),
        generateShareToken: (templateId: number): Promise<{ share_token: string }> =>
            client.post(`/api/needs-assessments/templates/${templateId}/share-token`),
    };
}

// ─── Instances ────────────────────────────────────────────────────────────────

export const needsAssessmentTemplatesApi = createNeedsAssessmentTemplatesApi(apiClient);
export const needsAssessmentSubmissionsApi = createNeedsAssessmentSubmissionsApi(apiClient);
export const publicNeedsAssessmentApi = createPublicNeedsAssessmentApi(apiClient);

export type NeedsAssessmentTemplatesApi = ReturnType<typeof createNeedsAssessmentTemplatesApi>;
export type NeedsAssessmentSubmissionsApi = ReturnType<typeof createNeedsAssessmentSubmissionsApi>;
export type PublicNeedsAssessmentApi = ReturnType<typeof createPublicNeedsAssessmentApi>;
