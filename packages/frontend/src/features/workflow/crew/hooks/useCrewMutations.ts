import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { crewApi, userAccountsApi, jobRolesApi } from '../api';
import { crewKeys } from '../constants/query-keys';
import type { SetCrewStatusData, UpdateCrewProfileData } from '../types';
import type { NewCrewData, UpdateCrewDto } from '@/shared/types/users';

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

export function useCreateUserAccount() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewCrewData) => userAccountsApi.create(data),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}

export function useUpdateUserAccount() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCrewDto }) =>
      userAccountsApi.update(id, data),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}

export function useDeleteUserAccount() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userAccountsApi.delete(id),
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}

export function useUpdateCrewJobRoles() {
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
          await jobRolesApi.removeJobRoleFromMember(id, jobRoleId);
        }
      }

      for (const jobRoleId of nextIds) {
        if (!currentIds.has(jobRoleId)) {
          await jobRolesApi.addJobRoleToMember(id, jobRoleId);
        }
      }

      if (primaryJobRoleId && nextIds.has(primaryJobRoleId)) {
        await jobRolesApi.setPrimaryJobRole(id, primaryJobRoleId);
      }
    },
    onSuccess: () => {
      if (brandId) {
        queryClient.invalidateQueries({ queryKey: crewKeys.all(brandId) });
      }
    },
  });
}
