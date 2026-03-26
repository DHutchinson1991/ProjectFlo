import { apiClient, getCurrentBrandId } from '@/lib/api';
import type { ApiClient, PublicApiClient } from '@/lib/api/api-client.types';
import type {
    InquiryWizardTemplate,
    InquiryWizardSubmission,
    InquiryWizardSubmissionPayload,
    IwDateConflictResult,
    IwCrewConflictResult,
} from '../types';
import type { PaymentScheduleTemplate, ServicePackage } from '@/lib/types';
import type { PackageSet } from '@/features/catalog/packages/types/package-set.types';
import type { EventType } from '@/features/catalog/event-types/types';
import type { Contributor } from '@/lib/types/domains/users';
import type { BrandSetting, WelcomeSettings } from '@/lib/types/brand';
import type { PriceEstimate } from '../types';

function requireCurrentBrandId(): number {
    const brandId = getCurrentBrandId();
    if (!brandId) {
        throw new Error('Brand context is required');
    }
    return brandId;
}

export function createInquiryWizardTemplatesApi(client: ApiClient) {
    return {
        getActive: () =>
            client.get<InquiryWizardTemplate>('/api/inquiry-wizard/templates/active'),
        getAll: () =>
            client.get<InquiryWizardTemplate[]>('/api/inquiry-wizard/templates'),
        getById: (id: number) =>
            client.get<InquiryWizardTemplate>(`/api/inquiry-wizard/templates/${id}`),
        create: (data: Omit<InquiryWizardTemplate, 'id' | 'brand_id' | 'created_at' | 'updated_at'>) =>
            client.post<InquiryWizardTemplate>('/api/inquiry-wizard/templates', data),
        update: (id: number, data: Partial<InquiryWizardTemplate>) =>
            client.put<InquiryWizardTemplate>(`/api/inquiry-wizard/templates/${id}`, data),
    };
}

export function createInquiryWizardSubmissionsApi(client: ApiClient) {
    return {
        getAll: () =>
            client.get<InquiryWizardSubmission[]>('/api/inquiry-wizard/submissions'),
        getByInquiryId: (inquiryId: number) =>
            client.get<InquiryWizardSubmission[]>(`/api/inquiry-wizard/submissions?inquiryId=${inquiryId}`),
        getById: (id: number) =>
            client.get<InquiryWizardSubmission>(`/api/inquiry-wizard/submissions/${id}`),
        create: (data: InquiryWizardSubmissionPayload) =>
            client.post<InquiryWizardSubmission>('/api/inquiry-wizard/submissions', data),
        convert: (id: number) =>
            client.post<InquiryWizardSubmission>(`/api/inquiry-wizard/submissions/${id}/convert`),
        checkDateConflicts: (id: number) =>
            client.get<IwDateConflictResult>(`/api/inquiry-wizard/submissions/${id}/conflict-check`),
        checkCrewConflicts: (id: number) =>
            client.get<IwCrewConflictResult>(`/api/inquiry-wizard/submissions/${id}/crew-conflict-check`),
        review: (id: number, data: { review_notes?: string; review_checklist_state?: Record<string, boolean> }) =>
            client.patch<InquiryWizardSubmission>(`/api/inquiry-wizard/submissions/${id}/review`, data),
        generatePortalToken: (inquiryId: number) =>
            client.post<{ portal_token: string }>(`/api/inquiries/${inquiryId}/portal-token`),
    };
}

export function createPublicInquiryWizardApi(client: PublicApiClient) {
    return {
        getByShareToken: (token: string): Promise<InquiryWizardTemplate> =>
            client.publicGet<InquiryWizardTemplate>(`/api/inquiry-wizard/share/${encodeURIComponent(token)}`),
        submit: (token: string, data: Record<string, unknown>): Promise<InquiryWizardSubmission> =>
            client.publicPost<InquiryWizardSubmission>(`/api/inquiry-wizard/share/${encodeURIComponent(token)}/submit`, data),
        updateSubmission: (submissionId: number, responses: Record<string, unknown>): Promise<InquiryWizardSubmission> =>
            client.publicPatch<InquiryWizardSubmission>(`/api/inquiry-wizard/share/submission/${submissionId}/responses`, { responses }),
    };
}

export function createInquiryWizardShareApi(client: ApiClient) {
    return {
        generateShareToken: (templateId: number) =>
            client.post<{ share_token: string }>(`/api/inquiry-wizard/templates/${templateId}/share-token`),
    };
}

export function createWizardPaymentSchedulesApi(client: ApiClient) {
    return {
        getAll: () => {
            const brandId = requireCurrentBrandId();
            return client.get<PaymentScheduleTemplate[]>(`/api/brands/${brandId}/payment-schedules`);
        },
    };
}

export function createWizardStudioDataApi(client: ApiClient) {
    return {
        getServicePackages: () =>
            client.get<ServicePackage[]>('/api/service-packages'),
        getPackageSets: () =>
            client.get<PackageSet[]>('/api/package-sets'),
        getEventTypes: () =>
            client.get<EventType[]>('/api/event-types'),
        getCrew: () => {
            const brandId = requireCurrentBrandId();
            return client.get<Contributor[]>(`/crew/brand/${brandId}`);
        },
        getBrandSetting: (key: string) => {
            const brandId = requireCurrentBrandId();
            return client.get<BrandSetting>(`/brands/${brandId}/settings/${key}`, { skipBrandContext: true });
        },
        getWelcomeSettings: () => {
            const brandId = requireCurrentBrandId();
            return client.get<WelcomeSettings>(`/brands/${brandId}/welcome-settings`, { skipBrandContext: true });
        },
        getDiscoveryCallSlots: (date: string) => {
            const brandId = requireCurrentBrandId();
            return client.get<{ date: string; duration_minutes?: number; slots: { time: string; available: boolean }[] }>(
                `/calendar/discovery-call-slots?brandId=${brandId}&date=${date}`
            );
        },
        createPackageFromBuilder: (data: {
            eventTypeId: number;
            selectedActivityPresetIds: number[];
            operatorCount: number;
            cameraCount?: number;
            filmPreferences: Array<{ type: string; activityPresetId?: number; activityName?: string }>;
            inquiryId?: number;
            clientName?: string;
        }) => client.post<ServicePackage>('/api/service-packages/from-builder', data),
        estimatePackagePrice: (packageId: number) => {
            const brandId = requireCurrentBrandId();
            return client.get<PriceEstimate>(`/api/pricing/${brandId}/package/${packageId}`);
        },
    };
}

export const inquiryWizardTemplatesApi = createInquiryWizardTemplatesApi(apiClient);
export const inquiryWizardSubmissionsApi = createInquiryWizardSubmissionsApi(apiClient);
export const inquiryWizardShareApi = createInquiryWizardShareApi(apiClient);
export const wizardPaymentSchedulesApi = createWizardPaymentSchedulesApi(apiClient);
export const wizardStudioDataApi = createWizardStudioDataApi(apiClient);
export const publicInquiryWizardApi = createPublicInquiryWizardApi(apiClient);

export type InquiryWizardTemplatesApi = ReturnType<typeof createInquiryWizardTemplatesApi>;
export type InquiryWizardSubmissionsApi = ReturnType<typeof createInquiryWizardSubmissionsApi>;
export type PublicInquiryWizardApi = ReturnType<typeof createPublicInquiryWizardApi>;
export type InquiryWizardShareApi = ReturnType<typeof createInquiryWizardShareApi>;
export type WizardPaymentSchedulesApi = ReturnType<typeof createWizardPaymentSchedulesApi>;
export type WizardStudioDataApi = ReturnType<typeof createWizardStudioDataApi>;
