import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { paymentMethodsApi } from '../api';
import { paymentMethodKeys } from './queryKeys';
import type { CreatePaymentMethodData, UpdatePaymentMethodData } from '../types';

export function usePaymentMethods() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: brandId ? paymentMethodKeys.list(brandId) : ['paymentMethods', 'unscoped'],
    queryFn: () => paymentMethodsApi.getAll(),
    enabled: !!brandId,
  });
}

export function useCreatePaymentMethod() {
  const { currentBrand } = useBrand();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentMethodData) => paymentMethodsApi.create(data),
    onSuccess: () => {
      if (currentBrand?.id) qc.invalidateQueries({ queryKey: paymentMethodKeys.all(currentBrand.id) });
    },
  });
}

export function useUpdatePaymentMethod() {
  const { currentBrand } = useBrand();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentMethodData }) =>
      paymentMethodsApi.update(id, data),
    onSuccess: () => {
      if (currentBrand?.id) qc.invalidateQueries({ queryKey: paymentMethodKeys.all(currentBrand.id) });
    },
  });
}

export function useDeletePaymentMethod() {
  const { currentBrand } = useBrand();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => paymentMethodsApi.delete(id),
    onSuccess: () => {
      if (currentBrand?.id) qc.invalidateQueries({ queryKey: paymentMethodKeys.all(currentBrand.id) });
    },
  });
}

export function useReorderPaymentMethods() {
  const { currentBrand } = useBrand();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => paymentMethodsApi.reorder(ids),
    onSuccess: () => {
      if (currentBrand?.id) qc.invalidateQueries({ queryKey: paymentMethodKeys.all(currentBrand.id) });
    },
  });
}
