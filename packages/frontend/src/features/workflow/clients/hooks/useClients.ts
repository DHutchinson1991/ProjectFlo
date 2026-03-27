import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { clientsApi } from '../api';
import { clientKeys } from '../constants/query-keys';

export function useClients() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: clientKeys.lists(brandId!),
    queryFn: () => clientsApi.getAll(),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useClient(id: number) {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: clientKeys.detail(brandId!, id),
    queryFn: () => clientsApi.getById(id),
    enabled: !!brandId && !!id,
    staleTime: 1000 * 60 * 5,
  });
}
