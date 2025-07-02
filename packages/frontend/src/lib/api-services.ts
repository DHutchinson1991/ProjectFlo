// lib/api-services.ts
import {
  apiClient,
  AuthResponse,
  Contributor,
  Role,
  NewContributorData,
  UpdateContributorDto,
  CoverageSceneData,
  CreateCoverageSceneData,
  UpdateCoverageSceneData,
  TimelineComponentData,
  TimelineLayerData,
  TimelineAnalyticsData
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

// Export types for use in other files
export interface LoginCredentials {
  email: string;
  password: string;
}

// Timeline Services
export const timelineService = {
  // Timeline Components
  async getComponentsForContent(contentId: number): Promise<TimelineComponentData[]> {
    return apiClient.get<TimelineComponentData[]>(`/timeline/content/${contentId}/components`);
  },

  async createComponent(data: TimelineComponentData): Promise<TimelineComponentData> {
    return apiClient.post<TimelineComponentData>('/timeline/components', data);
  },

  async updateComponent(id: number, data: Partial<TimelineComponentData>): Promise<TimelineComponentData> {
    return apiClient.patch<TimelineComponentData>(`/timeline/components/${id}`, data);
  },

  async deleteComponent(id: number): Promise<void> {
    return apiClient.delete<void>(`/timeline/components/${id}`);
  },

  // Timeline Layers
  async getLayers(): Promise<TimelineLayerData[]> {
    return apiClient.get<TimelineLayerData[]>('/timeline/layers');
  },

  async createLayer(data: Omit<TimelineLayerData, 'id' | 'is_active'>): Promise<TimelineLayerData> {
    return apiClient.post<TimelineLayerData>('/timeline/layers', data);
  },

  async updateLayer(id: number, data: Partial<Omit<TimelineLayerData, 'id' | 'is_active'>>): Promise<TimelineLayerData> {
    return apiClient.patch<TimelineLayerData>(`/timeline/layers/${id}`, data);
  },

  async deleteLayer(id: number): Promise<void> {
    return apiClient.delete<void>(`/timeline/layers/${id}`);
  },

  // Timeline Analytics
  async getAnalytics(contentId: number): Promise<TimelineAnalyticsData> {
    return apiClient.get<TimelineAnalyticsData>(`/timeline/content/${contentId}/analytics`);
  },

  // Timeline Validation
  async validateTimeline(contentId: number): Promise<any> {
    return apiClient.post<any>(`/timeline/content/${contentId}/validate`, {});
  }
};
