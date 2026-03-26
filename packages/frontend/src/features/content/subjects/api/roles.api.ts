import type { ApiClient } from '@/lib/api/api-client.types';
import { apiClient } from '@/lib/api';
import type { SubjectRole, CreateSubjectRoleDto } from '../types';

export const createRolesApi = (client: ApiClient) => ({
  getRoles: (): Promise<SubjectRole[]> =>
    client.get('/api/subjects/roles'),

  createRole: (dto: CreateSubjectRoleDto): Promise<SubjectRole | SubjectRole[]> =>
    client.post('/api/subjects/roles', dto),

  updateRole: (roleId: number, dto: { role_name?: string; description?: string; is_core?: boolean }): Promise<SubjectRole> =>
    client.patch(`/api/subjects/roles/${roleId}`, dto),

  deleteRole: (roleId: number): Promise<void> =>
    client.delete(`/api/subjects/roles/${roleId}`),
});

export const rolesApi = createRolesApi(apiClient as unknown as ApiClient);
export type RolesApi = ReturnType<typeof createRolesApi>;
