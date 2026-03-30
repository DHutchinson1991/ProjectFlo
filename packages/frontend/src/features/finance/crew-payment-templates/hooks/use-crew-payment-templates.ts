import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { crewPaymentTemplatesApi } from '../api';
import { crewPaymentTemplateKeys } from './queryKeys';
import type {
    CreateCrewPaymentTemplateData,
    UpdateCrewPaymentTemplateData,
} from '../types';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCrewPaymentTemplates() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId ? crewPaymentTemplateKeys.lists(brandId) : ['crewPaymentTemplates', 'unscoped'],
        queryFn: () => crewPaymentTemplatesApi.getAll(brandId!),
        enabled: !!brandId,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateCrewPaymentTemplate() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCrewPaymentTemplateData) =>
            crewPaymentTemplatesApi.create(brandId!, data),
        onSuccess: () => {
            if (brandId) queryClient.invalidateQueries({ queryKey: crewPaymentTemplateKeys.all(brandId) });
        },
    });
}

export function useUpdateCrewPaymentTemplate() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCrewPaymentTemplateData }) =>
            crewPaymentTemplatesApi.update(brandId!, id, data),
        onSuccess: () => {
            if (brandId) queryClient.invalidateQueries({ queryKey: crewPaymentTemplateKeys.all(brandId) });
        },
    });
}

export function useDeleteCrewPaymentTemplate() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => crewPaymentTemplatesApi.delete(brandId!, id),
        onSuccess: () => {
            if (brandId) queryClient.invalidateQueries({ queryKey: crewPaymentTemplateKeys.all(brandId) });
        },
    });
}
