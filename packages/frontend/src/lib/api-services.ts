// lib/api-services.ts
import {
  apiClient,
  LoginCredentials,
  AuthResponse,
  Contributor,
  Role,
  NewContributorData,
  UpdateContributorDto,
  CoverageSceneData,
  DeliverableData,
  CreateCoverageSceneData,
  CreateDeliverableData,
  UpdateCoverageSceneData,
  UpdateDeliverableData
} from './api-client';

// Authentication Services
export const authService = {
  apiClient, // Expose the API client for advanced configuration

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.login(credentials);
  },

  async getProfile(): Promise<{ userId: number; email: string; roles: string[] }> {
    return apiClient.getProfile();
  },

  setToken(token: string | null) {
    apiClient.setAuthToken(token);
  },

  getToken(): string | null {
    return apiClient.getAuthToken();
  }
};

// Contributors Services
export const contributorsService = {
  async getAll(): Promise<Contributor[]> {
    return apiClient.get<Contributor[]>('/contributors');
  },

  async getById(id: number): Promise<Contributor> {
    return apiClient.get<Contributor>(`/contributors/${id}`);
  },

  async create(data: NewContributorData): Promise<Contributor> {
    return apiClient.post<Contributor>('/contributors', data);
  },

  async update(id: number, data: UpdateContributorDto): Promise<Contributor> {
    return apiClient.patch<Contributor>(`/contributors/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/contributors/${id}`);
  }
};

// Roles Services
export const rolesService = {
  async getAll(): Promise<Role[]> {
    return apiClient.get<Role[]>('/roles');
  },

  async getById(id: number): Promise<Role> {
    return apiClient.get<Role>(`/roles/${id}`);
  }
};



// Wedding Business Services (Coverage Scenes, Deliverables)
export const coverageScenesService = {
  async getAll(): Promise<CoverageSceneData[]> {
    return apiClient.get<CoverageSceneData[]>('/coverage-scenes');
  },

  async getById(id: number): Promise<CoverageSceneData> {
    return apiClient.get<CoverageSceneData>(`/coverage-scenes/${id}`);
  },

  async create(data: CreateCoverageSceneData): Promise<CoverageSceneData> {
    return apiClient.post<CoverageSceneData>('/coverage-scenes', data);
  },

  async update(id: number, data: UpdateCoverageSceneData): Promise<CoverageSceneData> {
    return apiClient.patch<CoverageSceneData>(`/coverage-scenes/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/coverage-scenes/${id}`);
  }
};

export const deliverablesService = {
  async getAll(): Promise<DeliverableData[]> {
    return apiClient.get<DeliverableData[]>('/deliverables');
  },

  async getById(id: number): Promise<DeliverableData> {
    return apiClient.get<DeliverableData>(`/deliverables/${id}`);
  },

  async create(data: CreateDeliverableData): Promise<DeliverableData> {
    return apiClient.post<DeliverableData>('/deliverables', data);
  },

  async update(id: number, data: UpdateDeliverableData): Promise<DeliverableData> {
    return apiClient.patch<DeliverableData>(`/deliverables/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/deliverables/${id}`);
  }
};
