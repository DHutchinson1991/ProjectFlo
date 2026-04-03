import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../api';
import type { UpdateInvoiceData, RecordPaymentData } from '../types';

const invoiceKeys = {
    all: ['invoices'] as const,
    byInquiry: (inquiryId: number) => [...invoiceKeys.all, 'inquiry', inquiryId] as const,
    detail: (inquiryId: number, invoiceId: number) => [...invoiceKeys.byInquiry(inquiryId), invoiceId] as const,
};

export function useInquiryInvoices(inquiryId: number) {
    const { data: invoices = [], ...rest } = useQuery({
        queryKey: invoiceKeys.byInquiry(inquiryId),
        queryFn: () => invoicesApi.getAllByInquiry(inquiryId),
        enabled: !!inquiryId,
    });
    return { invoices, ...rest };
}

export function useInvoice(inquiryId: number, invoiceId: number) {
    return useQuery({
        queryKey: invoiceKeys.detail(inquiryId, invoiceId),
        queryFn: () => invoicesApi.getById(inquiryId, invoiceId),
        enabled: !!inquiryId && !!invoiceId,
    });
}

export function useInvoiceMutations(inquiryId: number) {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: invoiceKeys.byInquiry(inquiryId) });

    const updateInvoice = useMutation({
        mutationFn: ({ invoiceId, data }: { invoiceId: number; data: UpdateInvoiceData }) =>
            invoicesApi.update(inquiryId, invoiceId, data),
        onSuccess: invalidate,
    });

    const deleteInvoice = useMutation({
        mutationFn: (invoiceId: number) => invoicesApi.delete(inquiryId, invoiceId),
        onSuccess: invalidate,
    });

    const regenerateInvoices = useMutation({
        mutationFn: () => invoicesApi.regenerate(inquiryId),
        onSuccess: invalidate,
    });

    const recordPayment = useMutation({
        mutationFn: ({ invoiceId, data }: { invoiceId: number; data: RecordPaymentData }) =>
            invoicesApi.recordPayment(inquiryId, invoiceId, data),
        onSuccess: invalidate,
    });

    return { updateInvoice, deleteInvoice, regenerateInvoices, recordPayment };
}
