/**
 * Unified API Service - ProjectFlo Frontend
 *
 * Single source of truth for all API interactions with proper type safety,
 * authentication handling, and domain-organized methods.
 */

import {
  LoginCredentials,
  AuthResponse,
  UserProfile,
  Contributor,
  NewContributorData,
  UpdateContributorDto,
  Role,
  ScenesLibrary,
  CreateSceneDto,
  UpdateSceneDto,
  FilmData,
  CreateFilmData,
  UpdateFilmData,
  TimelineSceneData,
  TimelineLayerData,
  TimelineAnalyticsData,
  EditingStyleData,
  CreateEditingStyleData,
  UpdateEditingStyleData,
} from "./types";

// Base HTTP client functionality
class BaseApiClient {
  protected baseURL: string;
  protected authToken: string | null = null;
  private onUnauthorized?: () => void;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private getAuthHeaders(includeContentType: boolean = false): HeadersInit {
    const headers = new Headers();
    if (includeContentType) {
      headers.append("Content-Type", "application/json");
    }
    if (this.authToken) {
      headers.append("Authorization", `Bearer ${this.authToken}`);
    }
    return headers;
  }

  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        this.setAuthToken(null);
        localStorage.removeItem("authToken");
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new Error("Authentication failed. Please log in again.");
      }

      try {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      } catch {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return {} as T;
  }

  protected async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  protected async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

// Unified API Service with domain-organized methods
class ApiService extends BaseApiClient {
  // Authentication methods
  auth = {
    login: (credentials: LoginCredentials): Promise<AuthResponse> =>
      this.post("/auth/login", credentials),

    getProfile: (): Promise<UserProfile> => this.get("/auth/profile"),

    setToken: (token: string | null) => this.setAuthToken(token),
    getToken: () => this.getAuthToken(),
    onUnauthorized: (callback: () => void) =>
      this.setUnauthorizedCallback(callback),
  };

  // Contributors methods
  contributors = {
    getAll: (): Promise<Contributor[]> => this.get("/contributors"),
    getById: (id: number): Promise<Contributor> =>
      this.get(`/contributors/${id}`),
    create: (data: NewContributorData): Promise<Contributor> =>
      this.post("/contributors", data),
    update: (id: number, data: UpdateContributorDto): Promise<Contributor> =>
      this.patch(`/contributors/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/contributors/${id}`),
  };

  // Roles methods
  roles = {
    getAll: (): Promise<Role[]> => this.get("/roles"),
    getById: (id: number): Promise<Role> => this.get(`/roles/${id}`),
    create: (data: { name: string; description?: string }): Promise<Role> =>
      this.post("/roles", data),
    update: (
      id: number,
      data: { name?: string; description?: string },
    ): Promise<Role> => this.patch(`/roles/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/roles/${id}`),
  };

  // Scenes methods
  scenes = {
    getAll: (): Promise<ScenesLibrary[]> => this.get("/scenes"),
    getById: (id: number): Promise<ScenesLibrary> => this.get(`/scenes/${id}`),
    create: (data: CreateSceneDto): Promise<ScenesLibrary> =>
      this.post("/scenes", data),
    update: (id: number, data: UpdateSceneDto): Promise<ScenesLibrary> =>
      this.patch(`/scenes/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/scenes/${id}`),
  };

  // Films methods
  films = {
    getAll: (): Promise<FilmData[]> => this.get("/films"),
    getById: (id: number): Promise<FilmData> => this.get(`/films/${id}`),
    create: (data: CreateFilmData): Promise<FilmData> =>
      this.post("/films", data),
    update: (id: number, data: UpdateFilmData): Promise<FilmData> =>
      this.patch(`/films/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/films/${id}`),
  };

  // Editing Styles methods
  editingStyles = {
    getAll: (): Promise<EditingStyleData[]> => this.get("/editing-styles"),
    getById: (id: number): Promise<EditingStyleData> =>
      this.get(`/editing-styles/${id}`),
    create: (data: CreateEditingStyleData): Promise<EditingStyleData> =>
      this.post("/editing-styles", data),
    update: (
      id: number,
      data: UpdateEditingStyleData,
    ): Promise<EditingStyleData> => this.patch(`/editing-styles/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/editing-styles/${id}`),
  };

  // Timeline methods
  timeline = {
    getScenesForFilm: (filmId: number): Promise<TimelineSceneData[]> =>
      this.get(`/timeline/content/${filmId}/scenes`),

    getLayers: (): Promise<TimelineLayerData[]> => this.get("/timeline/layers"),

    getAnalytics: (filmId: number): Promise<TimelineAnalyticsData> =>
      this.get(`/timeline/content/${filmId}/analytics`),

    createTimelineScene: (
      data: TimelineSceneData,
    ): Promise<TimelineSceneData> => this.post("/timeline/scenes", data),

    updateTimelineScene: (
      id: number,
      data: Partial<TimelineSceneData>,
    ): Promise<TimelineSceneData> => this.patch(`/timeline/scenes/${id}`, data),

    deleteTimelineScene: (id: number): Promise<void> =>
      this.delete(`/timeline/scenes/${id}`),
  };

  // Utility methods for common operations
  utils = {
    // Health check
    healthCheck: (): Promise<{ status: string; timestamp: string }> =>
      this.get("/health"),

    // Upload file (if you have file upload endpoints)
    uploadFile: (
      file: File,
      endpoint: string = "/upload",
    ): Promise<{ url: string; filename: string }> => {
      const formData = new FormData();
      formData.append("file", file);

      return fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: this.authToken
          ? { Authorization: `Bearer ${this.authToken}` }
          : {},
        body: formData,
      }).then((response) => this.handleResponse(response));
    },

    // Search across entities
    search: (
      query: string,
      entities: string[] = ["scenes", "films", "contributors"],
    ): Promise<{
      scenes: ScenesLibrary[];
      films: FilmData[];
      contributors: Contributor[];
    }> =>
      this.get(
        `/search?q=${encodeURIComponent(query)}&entities=${entities.join(",")}`,
      ),
  };
}

/**
 * ## Usage Examples
 *
 * ```typescript
 * import { api } from '@/lib/api';
 *
 * // Authentication
 * await api.auth.login({ email: 'user@example.com', password: 'password' });
 * const profile = await api.auth.getProfile();
 *
 * // Working with scenes
 * const scenes = await api.scenes.getAll();
 * const newScene = await api.scenes.create({
 *   name: 'Wedding Ceremony',
 *   description: 'Main ceremony footage',
 *   media_type: 'VIDEO',
 *   complexity_score: 8,
 *   estimated_duration: 3600,
 *   base_task_hours: '4.5'
 * });
 *
 * // Timeline operations
 * const layers = await api.timeline.getLayers();
 * const scenes = await api.timeline.getScenesForFilm(filmId);
 * const analytics = await api.timeline.getAnalytics(filmId);
 *
 * // Search across entities
 * const results = await api.utils.search('wedding dance');
 *
 * // Health check
 * const health = await api.utils.healthCheck();
 * ```
 *
 * ## Features
 *
 * - **Type Safety**: All methods are fully typed with centralized type definitions
 * - **Authentication**: Automatic token management and 401 handling
 * - **Error Handling**: Consistent error handling across all endpoints
 * - **Domain Organization**: Methods grouped by business domain
 * - **Backward Compatibility**: Named exports for gradual migration
 * - **Utilities**: Common operations like search and health checks
 */

// Create and export singleton instance
const getApiBaseURL = (): string => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
};

export const api = new ApiService(getApiBaseURL());

// Export for backward compatibility and convenience
export const apiClient = api;
export const authService = api.auth;
export const contributorsService = api.contributors;
export const rolesService = api.roles;
export const scenesService = api.scenes;
export const filmsService = api.films;
export const editingStylesService = api.editingStyles;
export const timelineService = api.timeline;

// Export the main instance as default
export default api;
