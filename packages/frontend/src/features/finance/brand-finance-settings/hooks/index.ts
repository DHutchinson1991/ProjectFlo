import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandFinanceSettingsApi } from '../api';
import type { UpsertBrandFinanceSettingsData } from '../types';

export const BRAND_FINANCE_SETTINGS_KEY = ['brand-finance-settings'] as const;

export function useBrandFinanceSettings() {
    return useQuery({
        queryKey: BRAND_FINANCE_SETTINGS_KEY,
        queryFn: () => brandFinanceSettingsApi.get(),
    });
}

export function useUpsertBrandFinanceSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpsertBrandFinanceSettingsData) => brandFinanceSettingsApi.upsert(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BRAND_FINANCE_SETTINGS_KEY });
        },
    });
}
