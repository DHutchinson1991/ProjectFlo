import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { SubjectRole, CreateSubjectRoleDto } from '../types';

export interface SubjectRoleTemplate {
  id: number;
  category?: string;
  roles: Array<{
    id: number;
    role_name: string;
  }>;
}

export const createRolesApi = (client: ApiClient) => ({
  getRoles: (brandId: number): Promise<SubjectRole[]> =>
    client.get(`/api/subjects/roles/brand/${brandId}`),

  getRoleTemplates: (brandId: number): Promise<SubjectRoleTemplate[]> =>
    client.get(`/api/subjects/roles/brand/${brandId}`),

  createRole: (brandId: number, dto: CreateSubjectRoleDto): Promise<SubjectRole | SubjectRole[]> =>
    client.post(`/api/subjects/roles/brand/${brandId}`, dto),

  updateRole: (roleId: number, dto: { role_name?: string; description?: string; is_core?: boolean }): Promise<SubjectRole> =>
    client.patch(`/api/subjects/roles/${roleId}`, dto),

  deleteRole: (roleId: number): Promise<void> =>
    client.delete(`/api/subjects/roles/${roleId}`),
});

export const rolesApi = createRolesApi(apiClient);
export type RolesApi = ReturnType<typeof createRolesApi>;
