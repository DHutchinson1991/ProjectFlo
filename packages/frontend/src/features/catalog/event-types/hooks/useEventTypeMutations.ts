import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useBrand } from '@/features/platform/brand';

import { eventTypesApi } from '../api';
import { catalogEventTypeKeys } from '../constants/query-keys';
import type { CreateEventTypeData, UpdateEventTypeData } from '../types';

function invalidateEventTypeQueries(queryClient: ReturnType<typeof useQueryClient>, brandId?: number) {
    if (!brandId) {
        return Promise.resolve();
    }

    return queryClient.invalidateQueries({ queryKey: catalogEventTypeKeys.all(brandId) });
}

export function useCreateEventType() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateEventTypeData) => eventTypesApi.create(data),
        onSuccess: () => invalidateEventTypeQueries(queryClient, brandId),
    });
}

export function useUpdateEventType() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateEventTypeData }) =>
            eventTypesApi.update(id, data),
        onSuccess: (_, { id }) => {
            if (!brandId) {
                return;
            }

            queryClient.invalidateQueries({ queryKey: catalogEventTypeKeys.detail(brandId, id) });
            return invalidateEventTypeQueries(queryClient, brandId);
        },
    });
}

export function useDeleteEventType() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => eventTypesApi.remove(id),
        onSuccess: () => invalidateEventTypeQueries(queryClient, brandId),
    });
}