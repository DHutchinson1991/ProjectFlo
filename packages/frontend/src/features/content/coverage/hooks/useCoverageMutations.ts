import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { coverageApi } from '../api';
import { coverageKeys } from '../constants/query-keys';
import type { CreateCoverageDto, UpdateCoverageDto } from '../types';

export function useCreateCoverage() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCoverageDto) => coverageApi.create(data),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: coverageKeys.lists(brandId) });
      }
    },
  });
}

export function useUpdateCoverage() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCoverageDto }) =>
      coverageApi.update(id, data),
    onSuccess: (_, { id }) => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: coverageKeys.detail(brandId, id) });
        queryClient.invalidateQueries({ queryKey: coverageKeys.lists(brandId) });
      }
    },
  });
}

export function useDeleteCoverage() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => coverageApi.delete(id),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: coverageKeys.lists(brandId) });
      }
    },
  });
}
