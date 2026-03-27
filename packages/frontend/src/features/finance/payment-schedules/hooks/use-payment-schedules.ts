import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { paymentSchedulesApi } from '../api';
import { paymentScheduleKeys } from './queryKeys';
import type {
    CreatePaymentScheduleTemplateData,
    UpdatePaymentScheduleTemplateData,
    ApplyScheduleData,
} from '../types';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePaymentScheduleTemplates() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId ? paymentScheduleKeys.lists(brandId) : ['paymentSchedules', 'unscoped'],
        queryFn: () => paymentSchedulesApi.getAll(),
        enabled: !!brandId,
    });
}

export function usePaymentScheduleDefault() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId ? paymentScheduleKeys.default(brandId) : ['paymentSchedules', 'default', 'unscoped'],
        queryFn: () => paymentSchedulesApi.getDefault(),
        enabled: !!brandId,
    });
}

export function usePaymentScheduleTemplate(templateId: number) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId ? paymentScheduleKeys.detail(brandId, templateId) : ['paymentSchedules', 'detail', 'unscoped'],
        queryFn: () => paymentSchedulesApi.getById(templateId),
        enabled: !!brandId && !!templateId,
    });
}

export function useEstimateMilestones(estimateId: number) {
    return useQuery({
        queryKey: paymentScheduleKeys.estimateMilestones(estimateId),
        queryFn: () => paymentSchedulesApi.getMilestones(estimateId),
        enabled: !!estimateId,
    });
}

export function useQuoteMilestones(quoteId: number) {
    return useQuery({
        queryKey: paymentScheduleKeys.quoteMilestones(quoteId),
        queryFn: () => paymentSchedulesApi.getQuoteMilestones(quoteId),
        enabled: !!quoteId,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePaymentScheduleTemplate() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePaymentScheduleTemplateData) =>
            paymentSchedulesApi.create(data),
        onSuccess: () => {
            if (brandId) queryClient.invalidateQueries({ queryKey: paymentScheduleKeys.all(brandId) });
        },
    });
}

export function useUpdatePaymentScheduleTemplate() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePaymentScheduleTemplateData }) =>
            paymentSchedulesApi.update(id, data),
        onSuccess: () => {
            if (brandId) queryClient.invalidateQueries({ queryKey: paymentScheduleKeys.all(brandId) });
        },
    });
}

export function useDeletePaymentScheduleTemplate() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => paymentSchedulesApi.delete(id),
        onSuccess: () => {
            if (brandId) queryClient.invalidateQueries({ queryKey: paymentScheduleKeys.all(brandId) });
        },
    });
}

export function useApplyScheduleToEstimate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ estimateId, data }: { estimateId: number; data: ApplyScheduleData }) =>
            paymentSchedulesApi.applyToEstimate(estimateId, data),
        onSuccess: (_result, { estimateId }) => {
            queryClient.invalidateQueries({ queryKey: paymentScheduleKeys.estimateMilestones(estimateId) });
        },
    });
}

export function useApplyScheduleToQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ quoteId, data }: { quoteId: number; data: ApplyScheduleData }) =>
            paymentSchedulesApi.applyToQuote(quoteId, data),
        onSuccess: (_result, { quoteId }) => {
            queryClient.invalidateQueries({ queryKey: paymentScheduleKeys.quoteMilestones(quoteId) });
        },
    });
}

export function useUpdateMilestoneStatus() {
    return useMutation({
        mutationFn: ({ milestoneId, status }: { milestoneId: number; status: string }) =>
            paymentSchedulesApi.updateMilestoneStatus(milestoneId, status),
    });
}

export function useUpdateQuoteMilestoneStatus() {
    return useMutation({
        mutationFn: ({ milestoneId, status }: { milestoneId: number; status: string }) =>
            paymentSchedulesApi.updateQuoteMilestoneStatus(milestoneId, status),
    });
}
