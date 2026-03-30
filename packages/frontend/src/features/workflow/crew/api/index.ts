import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  Crew,
  CrewWorkload,
  SetCrewStatusData,
  UpdateCrewProfileData,
} from '../types';
import type { NewCrewData, UpdateCrewDto } from '@/shared/types/users';
import type { CrewApiResponse } from '@/shared/types/user-api';
import { mapCrewResponse } from '@/shared/types/user-mappers';
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
      client.get<Crew[]>('/api/crew'),

    getAllCrew: (_brandId?: number) =>
      client.get<Crew[]>('/api/crew/all-crew'),

    getByJobRole: (_brandId: number | undefined, jobRoleId: number) =>
      client.get<Crew[]>(`/api/crew/by-role/${jobRoleId}`),

    getWorkload: (_brandId?: number) =>
      client.get<CrewWorkload[]>('/api/crew/workload'),

    getById: (id: number) =>
      client.get<Crew>(`/api/crew/${id}`),

    setCrewStatus: (id: number, data: SetCrewStatusData) =>
      client.patch<Crew>(`/api/crew/${id}/crew-status`, data),

    updateProfile: (id: number, data: UpdateCrewProfileData) =>
      client.patch<Crew>(`/api/crew/${id}/profile`, data),
  };
}

export function createUserAccountsApi(client: ApiClient) {
  return {
    getAll: async (): Promise<Crew[]> => {
      const raw = await client.get<CrewApiResponse[]>('/api/user-accounts');
      return raw.map(mapCrewResponse);
    },

    getById: async (id: number): Promise<Crew> => {
      const raw = await client.get<CrewApiResponse>(`/api/user-accounts/${id}`);
      return mapCrewResponse(raw);
    },

    create: async (data: NewCrewData): Promise<Crew> => {
      const raw = await client.post<CrewApiResponse>('/api/user-accounts', data);
      return mapCrewResponse(raw);
    },

    update: async (id: number, data: UpdateCrewDto): Promise<Crew> => {
      const raw = await client.patch<CrewApiResponse>(`/api/user-accounts/${id}`, data);
      return mapCrewResponse(raw);
    },

    delete: (id: number) =>
      client.delete<void>(`/api/user-accounts/${id}`),
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

    getCrewAssignments: (crewId: number) =>
      client.get<Array<{
      id: number;
      crew_id: number;
      job_role_id: number;
      is_primary: boolean;
      assigned_at: string;
      assigned_by: number | null;
      job_role: JobRole;
      assigned_by_user: unknown | null;
    }>>(`/api/job-roles/crew/${crewId}/assignments`, { skipBrandContext: true }),

    addJobRoleToMember: (crewId: number, jobRoleId: number) =>
      client.post<unknown>('/api/job-roles/assignments', {
        crew_id: crewId,
        job_role_id: jobRoleId,
      }, { skipBrandContext: true }),

    removeJobRoleFromMember: (crewId: number, jobRoleId: number) =>
      client.delete<void>(`/api/job-roles/crew/${crewId}/job-role/${jobRoleId}`, { skipBrandContext: true }),

    setPrimaryJobRole: (crewId: number, jobRoleId: number) =>
      client.put<unknown>(`/api/job-roles/crew/${crewId}/job-role/${jobRoleId}`, { is_primary: true }, { skipBrandContext: true }),
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
export const userAccountsApi = createUserAccountsApi(apiClient);
export const jobRolesApi = createJobRolesApi(apiClient);
export const skillRoleMappingsApi = createSkillRoleMappingsApi(apiClient);

export type CrewApi = ReturnType<typeof createCrewApi>;
export type UserAccountsApi = ReturnType<typeof createUserAccountsApi>;
export type JobRolesApi = ReturnType<typeof createJobRolesApi>;
export type SkillRoleMappingsApi = ReturnType<typeof createSkillRoleMappingsApi>;
