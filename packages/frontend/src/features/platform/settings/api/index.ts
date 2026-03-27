import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { BrandSetting, MeetingSettings, WelcomeSettings } from '@/features/platform/brand/types';
import type { Role } from '@/shared/types/users';

export function createSettingsApi(client: ApiClient) {
  return {
    getAll: (brandId: number, category?: string) =>
      client.get<BrandSetting[]>(
      `/api/brands/${brandId}/settings${category ? `?category=${category}` : ''}`,
      { skipBrandContext: true },
    ),

    getByKey: (brandId: number, key: string) =>
      client.get<BrandSetting>(
      `/api/brands/${brandId}/settings/${key}`,
      { skipBrandContext: true },
    ),

    create: (brandId: number, data: {
      key: string;
      value: string;
      data_type?: string;
      category?: string;
      description?: string;
    }) =>
      client.post<BrandSetting>(
      `/api/brands/${brandId}/settings`,
      data,
      { skipBrandContext: true },
    ),

    update: (brandId: number, key: string, data: {
      value?: string;
      description?: string;
      is_active?: boolean;
    }) =>
      client.patch<BrandSetting>(
      `/api/brands/${brandId}/settings/${key}`,
      data,
      { skipBrandContext: true },
    ),

    delete: (brandId: number, key: string) =>
      client.delete<void>(
      `/api/brands/${brandId}/settings/${key}`,
      { skipBrandContext: true },
    ),

    getMeetingSettings: (brandId: number) =>
      client.get<MeetingSettings>(
      `/api/brands/${brandId}/meeting-settings`,
      { skipBrandContext: true },
    ),

    saveMeetingSettings: (brandId: number, data: Partial<MeetingSettings>) =>
      client.put<MeetingSettings>(
      `/api/brands/${brandId}/meeting-settings`,
      data,
      { skipBrandContext: true },
    ),

    getWelcomeSettings: (brandId: number) =>
      client.get<WelcomeSettings>(
      `/api/brands/${brandId}/welcome-settings`,
      { skipBrandContext: true },
    ),

    saveWelcomeSettings: (brandId: number, data: Partial<WelcomeSettings>) =>
      client.put<WelcomeSettings>(
      `/api/brands/${brandId}/welcome-settings`,
      data,
      { skipBrandContext: true },
    ),
  };
}

export function createPlatformRolesApi(client: ApiClient) {
  return {
    getAll: () =>
      client.get<Role[]>('/api/roles', { skipBrandContext: true }),

    getById: (id: number) =>
      client.get<Role>(`/api/roles/${id}`, { skipBrandContext: true }),

    create: (data: { name: string; description?: string }) =>
      client.post<Role>('/api/roles', data, { skipBrandContext: true }),

    update: (id: number, data: { name?: string; description?: string }) =>
      client.patch<Role>(`/api/roles/${id}`, data, { skipBrandContext: true }),

    delete: (id: number) =>
      client.delete<void>(`/api/roles/${id}`, { skipBrandContext: true }),
  };
}

export const settingsApi = createSettingsApi(apiClient);
export const rolesApi = createPlatformRolesApi(apiClient);
export type SettingsApi = ReturnType<typeof createSettingsApi>;
export type PlatformRolesApi = ReturnType<typeof createPlatformRolesApi>;
