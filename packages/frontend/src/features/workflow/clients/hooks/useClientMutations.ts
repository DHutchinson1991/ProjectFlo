import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { clientsApi } from '../api';
import { clientKeys } from '../constants/query-keys';
import type { CreateClientData, UpdateClientData } from '../types';

export function useCreateClient() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientData) => clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists(brandId!) });
    },
  });
}

export function useUpdateClient() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientData }) =>
      clientsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(brandId!, id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists(brandId!) });
    },
  });
}

export function useDeleteClient() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists(brandId!) });
    },
  });
}
