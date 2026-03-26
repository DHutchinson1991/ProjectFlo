import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { CreateInvoiceData, Invoice, UpdateInvoiceData } from '../types';

export function createInvoicesApi(client: ApiClient) {
    return {
        getById: (inquiryId: number, invoiceId: number) =>
            client.get<Invoice>(`/api/inquiries/${inquiryId}/invoices/${invoiceId}`),
        getAllByInquiry: (inquiryId: number) =>
            client.get<Invoice[]>(`/api/inquiries/${inquiryId}/invoices`),
        create: (inquiryId: number, data: CreateInvoiceData) =>
            client.post<Invoice>(`/api/inquiries/${inquiryId}/invoices`, data),
        update: (inquiryId: number, invoiceId: number, data: UpdateInvoiceData) =>
            client.patch<Invoice>(`/api/inquiries/${inquiryId}/invoices/${invoiceId}`, data),
        delete: (inquiryId: number, invoiceId: number) =>
            client.delete<void>(`/api/inquiries/${inquiryId}/invoices/${invoiceId}`),
    };
}

export const invoicesApi = createInvoicesApi(apiClient);

export type InvoicesApi = ReturnType<typeof createInvoicesApi>;
