import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { crewApi, crewMembersApi } from '../api';
import { crewKeys } from '../constants/query-keys';
import type { SetCrewStatusData, UpdateCrewProfileData, NewCrewMemberData, UpdateCrewMemberDto } from '../types';

export function useSetCrewStatus() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SetCrewStatusData }) =>
      crewApi.setCrewStatus(id, data),
    onSuccess: (_, { id }) => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.detail(brandId, id) });
        queryClient.invalidateQueries({ queryKey: crewKeys.lists(brandId) });
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}

export function useUpdateCrewProfile() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCrewProfileData }) =>
      crewApi.updateProfile(id, data),
    onSuccess: (_, { id }) => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.detail(brandId, id) });
        queryClient.invalidateQueries({ queryKey: crewKeys.lists(brandId) });
      }
    },
  });
}

export function useCreateContributor() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewCrewMemberData) => crewMembersApi.create(data),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}

export function useUpdateContributor() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCrewMemberDto }) =>
      crewMembersApi.update(id, data),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}

export function useDeleteContributor() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => crewMembersApi.delete(id),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}

export function useUpdateCrewMemberJobRoles() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      jobRoleIds,
      currentJobRoleIds,
      primaryJobRoleId,
    }: {
      id: number;
      jobRoleIds: number[];
      currentJobRoleIds: number[];
      primaryJobRoleId?: number | null;
    }) => {
      const currentIds = new Set(currentJobRoleIds);
      const nextIds = new Set(jobRoleIds);

      for (const jobRoleId of currentIds) {
        if (!nextIds.has(jobRoleId)) {
          await crewMembersApi.removeJobRole(id, jobRoleId);
        }
      }

      for (const jobRoleId of nextIds) {
        if (!currentIds.has(jobRoleId)) {
          await crewMembersApi.addJobRole(id, jobRoleId);
        }
      }

      if (primaryJobRoleId && nextIds.has(primaryJobRoleId)) {
        await crewMembersApi.setPrimaryJobRole(id, primaryJobRoleId);
      }
    },
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}
