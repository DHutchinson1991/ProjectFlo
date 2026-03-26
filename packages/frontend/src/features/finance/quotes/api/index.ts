import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { CreateQuoteData, Quote, UpdateQuoteData } from '../types';

export function createQuotesApi(client: ApiClient) {
    return {
        getById: (inquiryId: number, quoteId: number) =>
            client.get<Quote>(`/api/inquiries/${inquiryId}/quotes/${quoteId}`),
        getAllByInquiry: (inquiryId: number) =>
            client.get<Quote[]>(`/api/inquiries/${inquiryId}/quotes`),
        create: (inquiryId: number, data: CreateQuoteData) =>
            client.post<Quote>(`/api/inquiries/${inquiryId}/quotes`, data),
        update: (inquiryId: number, quoteId: number, data: UpdateQuoteData) =>
            client.patch<Quote>(`/api/inquiries/${inquiryId}/quotes/${quoteId}`, data),
        delete: (inquiryId: number, quoteId: number) =>
            client.delete<void>(`/api/inquiries/${inquiryId}/quotes/${quoteId}`),
    };
}

export const quotesApi = createQuotesApi(apiClient);

export type QuotesApi = ReturnType<typeof createQuotesApi>;
