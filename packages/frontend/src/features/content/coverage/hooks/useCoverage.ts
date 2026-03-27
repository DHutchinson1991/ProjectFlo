import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { coverageApi } from '../api';
import { coverageKeys } from '../constants/query-keys';
import type { CoverageType } from '../types';

export function useCoverageList() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: coverageKeys.lists(brandId!),
    queryFn: () => coverageApi.getAll(),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCoverageByType(type: CoverageType) {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: coverageKeys.listByType(brandId!, type),
    queryFn: () => coverageApi.getByType(type),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCoverage(id: number) {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: coverageKeys.detail(brandId!, id),
    queryFn: () => coverageApi.getById(id),
    enabled: !!brandId && !!id,
    staleTime: 1000 * 60 * 5,
  });
}
