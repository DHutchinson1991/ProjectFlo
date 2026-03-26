import { apiClient, getBrandId } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
    ApplyScheduleToEstimateData,
    ApplyScheduleToQuoteData,
    CreatePaymentScheduleTemplateData,
    EstimatePaymentMilestone,
    PaymentScheduleTemplate,
    QuotePaymentMilestone,
    UpdatePaymentScheduleTemplateData,
} from '../types';

function requireCurrentBrandId(): number {
    const brandId = getBrandId();
    if (!brandId) {
        throw new Error('Brand context is required');
    }
    return Number(brandId);
}

export function createPaymentSchedulesApi(client: ApiClient) {
    return {
        getAll: () =>
            client.get<PaymentScheduleTemplate[]>(`/api/brands/${requireCurrentBrandId()}/payment-schedules`),
        getDefault: () =>
            client.get<PaymentScheduleTemplate | null>(`/api/brands/${requireCurrentBrandId()}/payment-schedules/default`),
        getById: (templateId: number) =>
            client.get<PaymentScheduleTemplate>(`/api/brands/${requireCurrentBrandId()}/payment-schedules/${templateId}`),
        create: (data: CreatePaymentScheduleTemplateData) =>
            client.post<PaymentScheduleTemplate>(`/api/brands/${requireCurrentBrandId()}/payment-schedules`, data),
        update: (templateId: number, data: UpdatePaymentScheduleTemplateData) =>
            client.put<PaymentScheduleTemplate>(`/api/brands/${requireCurrentBrandId()}/payment-schedules/${templateId}`, data),
        delete: (templateId: number) =>
            client.delete<{ success: boolean }>(`/api/brands/${requireCurrentBrandId()}/payment-schedules/${templateId}`),
        getMilestones: (estimateId: number) =>
            client.get<EstimatePaymentMilestone[]>(`/api/estimates/${estimateId}/milestones`),
        applyToEstimate: (estimateId: number, data: ApplyScheduleToEstimateData) =>
            client.post<EstimatePaymentMilestone[]>(`/api/estimates/${estimateId}/apply-schedule`, data),
        updateMilestoneStatus: (milestoneId: number, status: string) =>
            client.patch<EstimatePaymentMilestone>(`/api/estimates/milestones/${milestoneId}/status`, { status }),
        getQuoteMilestones: (quoteId: number) =>
            client.get<QuotePaymentMilestone[]>(`/api/quotes/${quoteId}/milestones`),
        applyToQuote: (quoteId: number, data: ApplyScheduleToQuoteData) =>
            client.post<QuotePaymentMilestone[]>(`/api/quotes/${quoteId}/apply-schedule`, data),
        updateQuoteMilestoneStatus: (milestoneId: number, status: string) =>
            client.patch<QuotePaymentMilestone>(`/api/quotes/milestones/${milestoneId}/status`, { status }),
    };
}

export const paymentSchedulesApi = createPaymentSchedulesApi(apiClient);

export type PaymentSchedulesApi = ReturnType<typeof createPaymentSchedulesApi>;
