import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { settingsApi } from '@/features/platform/settings/api';
import {
  usePaymentBrackets,
  usePaymentBracketsByRole,
  paymentBracketKeys,
} from '@/features/finance/payment-brackets';
import { paymentBracketsApi } from '@/features/finance/payment-brackets';
import type {
  AssignBracketData,
  CreatePaymentBracketData,
  UpdatePaymentBracketData,
} from '@/features/finance/payment-brackets';
import type { BrandSetting } from '@/features/platform/brand/types';
import type { UpdateCrewDto } from '@/shared/types/users';
import type { UpdateCrewProfileData } from '../types';
import {
  userAccountsApi,
  crewApi,
  jobRolesApi,
  skillRoleMappingsApi,
} from '../api';

const crewManagementKeys = {
  userAccounts: (brandId: number) => ['userAccounts', brandId] as const,
  jobRoles: () => ['jobRoles'] as const,
  overtimeSetting: (brandId: number) => ['brandSetting', 'overtime_multiplier', brandId] as const,
  skillRoleMappings: (brandId: number) => ['skillRoleMappings', brandId] as const,
  availableSkills: (brandId: number) => ['availableSkills', brandId] as const,
};

export function useCrewManagementData() {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;

  const crewQuery = useQuery({
    queryKey: brandId ? crewManagementKeys.userAccounts(brandId) : ['userAccounts', 'unscoped'],
    queryFn: () => userAccountsApi.getAll(),
    enabled: !!brandId,
  });

  const jobRolesQuery = useQuery({
    queryKey: crewManagementKeys.jobRoles(),
    queryFn: () => jobRolesApi.getAll(),
  });

  const paymentBracketsQuery = usePaymentBrackets(true);

  const paymentBracketsByRoleQuery = usePaymentBracketsByRole(brandId);

  const overtimeSettingQuery = useQuery<BrandSetting | null>({
    queryKey: brandId ? crewManagementKeys.overtimeSetting(brandId) : ['brandSetting', 'overtime_multiplier', 'unscoped'],
    queryFn: async () => {
      if (!brandId) return null;
      try {
        return await settingsApi.getByKey(brandId, 'overtime_multiplier');
      } catch {
        return null;
      }
    },
    enabled: !!brandId,
  });

  const skillRoleMappingsQuery = useQuery({
    queryKey: brandId ? crewManagementKeys.skillRoleMappings(brandId) : ['skillRoleMappings', 'unscoped'],
    queryFn: () => skillRoleMappingsApi.getAll(),
    enabled: !!brandId,
  });

  const availableSkillsQuery = useQuery({
    queryKey: brandId ? crewManagementKeys.availableSkills(brandId) : ['availableSkills', 'unscoped'],
    queryFn: () => skillRoleMappingsApi.getAvailableSkills(),
    enabled: !!brandId,
  });

  return {
    crewQuery,
    jobRolesQuery,
    paymentBracketsQuery,
    paymentBracketsByRoleQuery,
    overtimeSettingQuery,
    skillRoleMappingsQuery,
    availableSkillsQuery,
  };
}

export function useCrewManagementMutations(options: {
  onInvalidateAll?: () => void;
  onInvalidateSkills?: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  closeBracketDialog?: () => void;
  closeAssignDialog?: () => void;
  closeAddCrewDialog?: () => void;
  afterCreateRole?: (role: { id: number }) => void;
  afterUpdateRole?: () => void;
  afterDeleteRole?: () => void;
}) {
  const { currentBrand } = useBrand();
  const brandId = currentBrand?.id;
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    options.onInvalidateAll?.();
    queryClient.invalidateQueries({ queryKey: paymentBracketKeys.all() });
    if (brandId) {
      queryClient.invalidateQueries({ queryKey: crewManagementKeys.userAccounts(brandId) });
    }
    queryClient.invalidateQueries({ queryKey: ['jobRoles'] });
  };

  const invalidateSkills = () => {
    options.onInvalidateSkills?.();
    if (brandId) {
      queryClient.invalidateQueries({ queryKey: crewManagementKeys.skillRoleMappings(brandId) });
      queryClient.invalidateQueries({ queryKey: crewManagementKeys.availableSkills(brandId) });
    }
  };

  const addSkillMutation = useMutation({
    mutationFn: (data: { skill_name: string; job_role_id: number; payment_bracket_id: number; priority?: number }) =>
      skillRoleMappingsApi.create(data),
    onSuccess: () => {
      invalidateSkills();
      options.onSuccess?.('Skill mapped');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to map skill'),
  });

  const removeSkillMutation = useMutation({
    mutationFn: (id: number) => skillRoleMappingsApi.delete(id),
    onSuccess: () => {
      invalidateSkills();
      options.onSuccess?.('Skill removed');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to remove skill'),
  });

  const createBracketMutation = useMutation({
    mutationFn: (data: CreatePaymentBracketData) => paymentBracketsApi.create(data),
    onSuccess: () => {
      invalidateAll();
      options.closeBracketDialog?.();
      options.onSuccess?.('Bracket created');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to create bracket'),
  });

  const updateBracketMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentBracketData }) => paymentBracketsApi.update(id, data),
    onSuccess: () => {
      invalidateAll();
      options.closeBracketDialog?.();
      options.onSuccess?.('Bracket updated');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to update bracket'),
  });

  const deleteBracketMutation = useMutation({
    mutationFn: (id: number) => paymentBracketsApi.delete(id),
    onSuccess: () => {
      invalidateAll();
      options.onSuccess?.('Bracket deactivated');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to delete bracket'),
  });

  const assignBracketMutation = useMutation({
    mutationFn: (data: AssignBracketData) => paymentBracketsApi.assign(data),
    onSuccess: () => {
      invalidateAll();
      options.closeAssignDialog?.();
      options.onSuccess?.('Bracket assigned');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to assign bracket'),
  });

  const unassignBracketMutation = useMutation({
    mutationFn: ({ crewId, jobRoleId }: { crewId: number; jobRoleId: number }) =>
      paymentBracketsApi.unassign(crewId, jobRoleId),
    onSuccess: () => {
      invalidateAll();
      options.onSuccess?.('Bracket removed');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to remove bracket'),
  });

  const createCrewMutation = useMutation({
    mutationFn: (data: Parameters<typeof userAccountsApi.create>[0]) => userAccountsApi.create(data),
    onSuccess: () => {
      invalidateAll();
      options.closeAddCrewDialog?.();
      options.onSuccess?.('Crew added');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to add crew'),
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: Parameters<typeof jobRolesApi.create>[0]) => jobRolesApi.create(data),
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ['jobRoles'] });
      options.afterCreateRole?.(role);
      options.onSuccess?.('Role created!');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to create role'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof jobRolesApi.update>[1] }) =>
      jobRolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRoles'] });
      options.afterUpdateRole?.();
      options.onSuccess?.('Role updated successfully');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to update role'),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => jobRolesApi.delete(id),
    onSuccess: () => {
      invalidateAll();
      options.afterDeleteRole?.();
      options.onSuccess?.('Role deleted successfully');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to delete role'),
  });

  const updateCrewMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCrewDto }) => userAccountsApi.update(id, data),
    onSuccess: () => {
      invalidateAll();
      options.onSuccess?.('Crew updated');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to update crew'),
  });

  const addJobRoleMutation = useMutation({
    mutationFn: ({ crewId, jobRoleId }: { crewId: number; jobRoleId: number }) =>
      jobRolesApi.addJobRoleToMember(crewId, jobRoleId),
    onSuccess: () => {
      invalidateAll();
      options.onSuccess?.('Role added');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to add role'),
  });

  const removeJobRoleMutation = useMutation({
    mutationFn: ({ crewId, jobRoleId }: { crewId: number; jobRoleId: number }) =>
      jobRolesApi.removeJobRoleFromMember(crewId, jobRoleId),
    onSuccess: () => {
      invalidateAll();
      options.onSuccess?.('Role removed');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to remove role'),
  });

  const setPrimaryJobRoleMutation = useMutation({
    mutationFn: ({ crewId, jobRoleId }: { crewId: number; jobRoleId: number }) =>
      jobRolesApi.setPrimaryJobRole(crewId, jobRoleId),
    onSuccess: () => {
      invalidateAll();
      options.onSuccess?.('Primary role updated');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to set primary role'),
  });

  const updateCrewProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCrewProfileData }) => crewApi.updateProfile(id, data),
    onSuccess: () => {
      invalidateAll();
      options.onSuccess?.('Profile updated');
    },
    onError: (error: Error) => options.onError?.(error.message || 'Failed to update profile'),
  });

  return {
    addSkillMutation,
    removeSkillMutation,
    createBracketMutation,
    updateBracketMutation,
    deleteBracketMutation,
    assignBracketMutation,
    unassignBracketMutation,
    createCrewMutation,
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation,
    updateCrewMutation,
    addJobRoleMutation,
    removeJobRoleMutation,
    setPrimaryJobRoleMutation,
    updateCrewProfileMutation,
  };
}