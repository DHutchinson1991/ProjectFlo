import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { settingsApi } from '../api';
import { settingsKeys } from '../constants/query-keys';

export function useSettings(category?: string) {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: category
      ? settingsKeys.listByCategory(brandId!, category)
      : settingsKeys.lists(brandId!),
    queryFn: () => settingsApi.getAll(brandId!, category),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetting(key: string) {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: settingsKeys.detail(brandId!, key),
    queryFn: () => settingsApi.getByKey(brandId!, key),
    enabled: !!brandId && !!key,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMeetingSettings() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: settingsKeys.meeting(brandId!),
    queryFn: () => settingsApi.getMeetingSettings(brandId!),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWelcomeSettings() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: settingsKeys.welcome(brandId!),
    queryFn: () => settingsApi.getWelcomeSettings(brandId!),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}
