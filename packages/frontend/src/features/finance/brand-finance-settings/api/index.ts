import { apiClient } from '@/shared/api/client';
import type { BrandFinanceSettings, UpsertBrandFinanceSettingsData } from '../types';

export const brandFinanceSettingsApi = {
    get: () =>
        apiClient.get<BrandFinanceSettings>('/api/brand-finance-settings'),

    upsert: (data: UpsertBrandFinanceSettingsData) =>
        apiClient.put<BrandFinanceSettings>('/api/brand-finance-settings', data),
};
