import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { crewApi, crewMembersApi } from '../api';
import { crewKeys } from '../constants/query-keys';

export function useCrewList() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: crewKeys.lists(brandId!),
    queryFn: () => crewApi.getByBrand(brandId!),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrewByRole(jobRoleId: number) {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: crewKeys.byRole(brandId!, jobRoleId),
    queryFn: () => crewApi.getByJobRole(brandId!, jobRoleId),
    enabled: !!brandId && !!jobRoleId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrewWorkload() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: crewKeys.workload(brandId!),
    queryFn: () => crewApi.getWorkload(brandId!),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCrewMember(id: number) {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: crewKeys.detail(brandId!, id),
    queryFn: () => crewApi.getById(id),
    enabled: !!brandId && !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrewMembers() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  return useQuery({
    queryKey: crewKeys.contributors(brandId!),
    queryFn: () => crewApi.getAllContributors(brandId!),
    enabled: !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}
