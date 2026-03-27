import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { settingsApi } from '../api';
import { settingsKeys } from '../constants/query-keys';
import type { MeetingSettings, WelcomeSettings } from '@/features/platform/brand/types';

export function useCreateSetting() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      key: string;
      value: string;
      data_type?: string;
      category?: string;
      description?: string;
    }) => settingsApi.create(brandId!, data),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: settingsKeys.lists(brandId) });
      }
    },
  });
}

export function useUpdateSetting() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, data }: {
      key: string;
      data: { value?: string; description?: string; is_active?: boolean };
    }) => settingsApi.update(brandId!, key, data),
    onSuccess: (_, { key }) => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: settingsKeys.detail(brandId, key) });
        queryClient.invalidateQueries({ queryKey: settingsKeys.lists(brandId) });
      }
    },
  });
}

export function useDeleteSetting() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => settingsApi.delete(brandId!, key),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: settingsKeys.lists(brandId) });
      }
    },
  });
}

export function useSaveMeetingSettings() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<MeetingSettings>) =>
      settingsApi.saveMeetingSettings(brandId!, data),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: settingsKeys.meeting(brandId) });
      }
    },
  });
}

export function useSaveWelcomeSettings() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<WelcomeSettings>) =>
      settingsApi.saveWelcomeSettings(brandId!, data),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: settingsKeys.welcome(brandId) });
      }
    },
  });
}
