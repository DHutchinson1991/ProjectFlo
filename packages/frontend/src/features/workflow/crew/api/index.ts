import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  CrewMember,
  CrewWorkload,
  SetCrewStatusData,
  UpdateCrewProfileData,
} from '../types';
import type { CrewMember, NewCrewMemberData, UpdateCrewMemberDto } from '@/shared/types/users';
import type { CrewMemberApiResponse } from '@/shared/types/user-api';
import { mapCrewMemberResponse } from '@/shared/types/user-mappers';
import type {
  JobRole,
  CreateJobRoleData,
  UpdateJobRoleData,
} from '@/features/catalog/task-library/types/job-roles';
import type {
  SkillRoleMapping,
  SkillRoleMappingSummary,
  AvailableSkill,
  CreateSkillRoleMappingData,
  UpdateSkillRoleMappingData,
  BulkCreateSkillRoleMappingData,
  ResolveSkillRoleData,
  ResolvedRoleResult,
} from '@/features/catalog/task-library/types/skill-role-mappings';

export function createCrewApi(client: ApiClient) {
  return {
    getByBrand: (_brandId?: number) =>
      client.get<CrewMember[]>('/api/crew'),

    getAllContributors: (_brandId?: number) =>
      client.get<CrewMember[]>('/api/crew/all-contributors'),

    getByJobRole: (_brandId: number | undefined, jobRoleId: number) =>
      client.get<CrewMember[]>(`/api/crew/by-role/${jobRoleId}`),

    getWorkload: (_brandId?: number) =>
      client.get<CrewWorkload[]>('/api/crew/workload'),

    getById: (id: number) =>
      client.get<CrewMember>(`/api/crew/${id}`),

    setCrewStatus: (id: number, data: SetCrewStatusData) =>
      client.patch<CrewMember>(`/api/crew/${id}/crew-status`, data),

    updateProfile: (id: number, data: UpdateCrewProfileData) =>
      client.patch<CrewMember>(`/api/crew/${id}/profile`, data),
  };
}

export function createcrewMembersApi(client: ApiClient) {
  return {
    getAll: async (): Promise<CrewMember[]> => {
      const raw = await client.get<CrewMemberApiResponse[]>('/api/contributors');
      return raw.map(mapCrewMemberResponse);
    },

    getById: async (id: number): Promise<CrewMember> => {
      const raw = await client.get<CrewMemberApiResponse>(`/api/contributors/${id}`);
      return mapCrewMemberResponse(raw);
    },

    create: async (data: NewCrewMemberData): Promise<CrewMember> => {
      const raw = await client.post<CrewMemberApiResponse>('/api/contributors', data);
      return mapCrewMemberResponse(raw);
    },

    update: async (id: number, data: UpdateCrewMemberDto): Promise<CrewMember> => {
      const raw = await client.patch<CrewMemberApiResponse>(`/api/contributors/${id}`, data);
      return mapCrewMemberResponse(raw);
    },

    delete: (id: number) =>
      client.delete<void>(`/api/contributors/${id}`),

    addJobRole: async (id: number, jobRoleId: number): Promise<CrewMember> => {
      const raw = await client.post<CrewMemberApiResponse>(`/api/contributors/${id}/job-roles`, {
        job_role_id: jobRoleId,
      });
      return mapCrewMemberResponse(raw);
    },

    removeJobRole: async (id: number, jobRoleId: number): Promise<CrewMember> => {
      const raw = await client.delete<CrewMemberApiResponse>(`/api/contributors/${id}/job-roles/${jobRoleId}`);
      return mapCrewMemberResponse(raw);
    },

    setPrimaryJobRole: async (id: number, jobRoleId: number): Promise<CrewMember> => {
      const raw = await client.put<CrewMemberApiResponse>(`/api/contributors/${id}/job-roles/${jobRoleId}/primary`, {});
      return mapCrewMemberResponse(raw);
    },
  };
}

export function createJobRolesApi(client: ApiClient) {
  return {
    getAll: () =>
      client.get<JobRole[]>('/api/job-roles', { skipBrandContext: true }),

    getById: (id: number) =>
      client.get<JobRole>(`/api/job-roles/${id}`, { skipBrandContext: true }),

    create: (data: CreateJobRoleData) =>
      client.post<JobRole>('/api/job-roles', data, { skipBrandContext: true }),

    update: (id: number, data: UpdateJobRoleData) =>
      client.put<JobRole>(`/api/job-roles/${id}`, data, { skipBrandContext: true }),

    delete: (id: number) =>
      client.delete<void>(`/api/job-roles/${id}`, { skipBrandContext: true }),

    getContributorAssignments: (crewMemberId: number) =>
      client.get<Array<{
      id: number;
      crew_member_id: number;
      job_role_id: number;
      is_primary: boolean;
      assigned_at: string;
      assigned_by: number | null;
      job_role: JobRole;
      assigned_by_user: unknown | null;
    }>>(`/api/job-roles/contributor/${crewMemberId}/assignments`, { skipBrandContext: true }),
  };
}

export function createSkillRoleMappingsApi(client: ApiClient) {
  return {
    getAll: (params?: { brandId?: number; jobRoleId?: number; skill?: string }) => {
      const qs = new URLSearchParams();
      if (params?.jobRoleId) qs.set('jobRoleId', String(params.jobRoleId));
      if (params?.skill) qs.set('skill', params.skill);
      const query = qs.toString();
      return client.get<SkillRoleMapping[]>(`/api/skill-role-mappings${query ? `?${query}` : ''}`);
    },

    getById: (id: number) =>
      client.get<SkillRoleMapping>(`/api/skill-role-mappings/${id}`),

    getSummary: (_brandId?: number) =>
      client.get<SkillRoleMappingSummary>('/api/skill-role-mappings/summary'),

    getAvailableSkills: (_brandId?: number) =>
      client.get<AvailableSkill[]>('/api/skill-role-mappings/skills'),

    create: (data: CreateSkillRoleMappingData) =>
      client.post<SkillRoleMapping>('/api/skill-role-mappings', data),

    bulkCreate: (data: BulkCreateSkillRoleMappingData) =>
      client.post<{ created: number; skipped: number; errors: string[] }>('/api/skill-role-mappings/bulk', data),

    update: (id: number, data: UpdateSkillRoleMappingData) =>
      client.put<SkillRoleMapping>(`/api/skill-role-mappings/${id}`, data),

    delete: (id: number) =>
      client.delete<void>(`/api/skill-role-mappings/${id}`),

    resolve: (data: ResolveSkillRoleData) =>
      client.post<ResolvedRoleResult | null>('/api/skill-role-mappings/resolve', data),
  };
}

export const crewApi = createCrewApi(apiClient);
export const crewMembersApi = createcrewMembersApi(apiClient);
export const jobRolesApi = createJobRolesApi(apiClient);
export const skillRoleMappingsApi = createSkillRoleMappingsApi(apiClient);

export type CrewApi = ReturnType<typeof createCrewApi>;
export type crewMembersApi = ReturnType<typeof createcrewMembersApi>;
export type JobRolesApi = ReturnType<typeof createJobRolesApi>;
export type SkillRoleMappingsApi = ReturnType<typeof createSkillRoleMappingsApi>;
