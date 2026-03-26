import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { CreateEstimateData, Estimate, UpdateEstimateData } from '../types';

export function createEstimatesApi(client: ApiClient) {
    return {
        getById: (inquiryId: number, estimateId: number) =>
            client.get<Estimate>(`/api/inquiries/${inquiryId}/estimates/${estimateId}`),
        getAllByInquiry: (inquiryId: number) =>
            client.get<Estimate[]>(`/api/inquiries/${inquiryId}/estimates`),
        create: (inquiryId: number, data: CreateEstimateData) =>
            client.post<Estimate>(`/api/inquiries/${inquiryId}/estimates`, data),
        update: (inquiryId: number, estimateId: number, data: UpdateEstimateData) =>
            client.patch<Estimate>(`/api/inquiries/${inquiryId}/estimates/${estimateId}`, data),
        delete: (inquiryId: number, estimateId: number) =>
            client.delete<void>(`/api/inquiries/${inquiryId}/estimates/${estimateId}`),
        send: (inquiryId: number, estimateId: number) =>
            client.post<Estimate>(`/api/inquiries/${inquiryId}/estimates/${estimateId}/send`, {}),
        refresh: (inquiryId: number, estimateId: number) =>
            client.post<Estimate>(`/api/inquiries/${inquiryId}/estimates/${estimateId}/refresh`, {}),
        revise: (inquiryId: number, estimateId: number) =>
            client.post<Estimate>(`/api/inquiries/${inquiryId}/estimates/${estimateId}/revise`, {}),
        getSnapshots: (inquiryId: number, estimateId: number) =>
            client.get<unknown[]>(`/api/inquiries/${inquiryId}/estimates/${estimateId}/snapshots`),
    };
}

export const estimatesApi = createEstimatesApi(apiClient);

export type EstimatesApi = ReturnType<typeof createEstimatesApi>;
