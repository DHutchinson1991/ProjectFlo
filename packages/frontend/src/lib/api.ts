/**
 * Unified API Service - ProjectFlo Frontend
 *
 * Single source of truth for all API interactions with proper type safety,
 * authentication handling, and domain-organized methods.
 */

import {
  // Auth domain
  LoginCredentials,
  AuthResponse,
  UserProfile,

  // User domain
  Contributor,
  Contact,
  NewContributorData,
  UpdateContributorDto,
  NewContactData,
  UpdateContactDto,
  Role,

  // Brand domain
  Brand,
  UserBrand,

  // Content domain
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

  // Task Library domain
  TaskLibrary,
  TaskLibraryBenchmark,
  TaskLibrarySkillRate,
  CreateTaskLibraryDto,
  UpdateTaskLibraryDto,
  CreateTaskLibraryBenchmarkDto,
  UpdateTaskLibraryBenchmarkDto,
  CreateTaskLibrarySkillRateDto,
  UpdateTaskLibrarySkillRateDto,
  TaskLibraryByPhase,
  BatchUpdateTaskOrderDto,
  TaskOrderUpdateDto,

  // API responses and mappers
  ContributorApiResponse,
  ContactApiResponse,
  mapContributorResponse,
  mapContactResponse,
} from "./types";

// Brand context interface for API service
interface BrandContextProvider {
  getCurrentBrandId: () => number | null;
}

// Global brand context provider instance
let globalBrandContextProvider: BrandContextProvider | null = null;

// Function to set the brand context provider (called by BrandProvider)
export function setBrandContextProvider(provider: BrandContextProvider) {
  globalBrandContextProvider = provider;
}

// Function to get current brand ID
function getCurrentBrandId(): number | null {
  return globalBrandContextProvider?.getCurrentBrandId() || null;
}

// Base HTTP client functionality
class BaseApiClient {
  protected baseURL: string;
  protected authToken: string | null = null;
  private onUnauthorized?: () => void;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Initialize token from localStorage if available (browser only)
    this.initializeTokenFromStorage();
  }

  private initializeTokenFromStorage() {
    // Only run in browser environment, not during SSR
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        this.authToken = storedToken;
      }
    }
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    // Persist token changes to localStorage (browser only)
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("authToken", token);
      } else {
        localStorage.removeItem("authToken");
      }
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  // Method to refresh token from localStorage (useful for hot reloads)
  refreshTokenFromStorage(): void {
    this.initializeTokenFromStorage();
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

    // Add brand context header if available
    const brandId = getCurrentBrandId();
    console.log('🔗 API Debug - getAuthHeaders called, brandId:', brandId);
    if (brandId) {
      headers.append("X-Brand-Context", brandId.toString());
      console.log('🔗 API Debug - Added X-Brand-Context header:', brandId.toString());
    }

    return headers;
  }

  // Helper method to add brand context to URL parameters
  protected addBrandContextToUrl(url: string, forceBrandContext = false): string {
    const brandId = getCurrentBrandId();
    console.log('🔗 API Debug - addBrandContextToUrl called for:', url, 'with brandId:', brandId);

    // Only add brand context if we have one and either it's forced or the URL doesn't already contain brandId
    if (brandId && (forceBrandContext || !url.includes('brandId='))) {
      const separator = url.includes('?') ? '&' : '?';
      const finalUrl = `${url}${separator}brandId=${brandId}`;
      console.log('🔗 API Debug - Final URL with brand context:', finalUrl);
      return finalUrl;
    }

    console.log('🔗 API Debug - No brand context added, returning original URL:', url);
    return url;
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

  protected async get<T>(endpoint: string, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  protected async post<T>(endpoint: string, data?: unknown, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async patch<T>(endpoint: string, data?: unknown, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async delete<T>(endpoint: string, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await fetch(`${this.baseURL}${url}`, {
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
      this.post("/auth/login", credentials, { skipBrandContext: true }),

    getProfile: (): Promise<UserProfile> =>
      this.get("/auth/profile", { skipBrandContext: true }),

    setToken: (token: string | null) => this.setAuthToken(token),
    getToken: () => this.getAuthToken(),
    refreshToken: () => this.refreshTokenFromStorage(),
    onUnauthorized: (callback: () => void) =>
      this.setUnauthorizedCallback(callback),
  };

  // Contributors methods (brand-specific)
  contributors = {
    getAll: async (): Promise<Contributor[]> => {
      console.log('🔍 API Debug - contributors.getAll called');
      const apiResponse: ContributorApiResponse[] = await this.get("/contributors");
      console.log('🔍 API Debug - contributors.getAll response:', apiResponse.length, 'contributors received');
      return apiResponse.map(mapContributorResponse);
    },
    getById: async (id: number): Promise<Contributor> => {
      const apiResponse: ContributorApiResponse = await this.get(`/contributors/${id}`);
      return mapContributorResponse(apiResponse);
    },
    create: async (data: NewContributorData): Promise<Contributor> => {
      const apiResponse: ContributorApiResponse = await this.post("/contributors", data);
      return mapContributorResponse(apiResponse);
    },
    update: async (id: number, data: UpdateContributorDto): Promise<Contributor> => {
      const apiResponse: ContributorApiResponse = await this.patch(`/contributors/${id}`, data);
      return mapContributorResponse(apiResponse);
    },
    delete: (id: number): Promise<void> => this.delete(`/contributors/${id}`),
  };

  // Contacts methods (brand-specific)
  contacts = {
    getAll: async (): Promise<Contact[]> => {
      console.log('🔍 API Debug - contacts.getAll called');
      const apiResponse: ContactApiResponse[] = await this.get("/contacts");
      console.log('🔍 API Debug - contacts.getAll response:', apiResponse.length, 'contacts received');
      return apiResponse.map(mapContactResponse);
    },
    getById: async (id: number): Promise<Contact> => {
      const apiResponse: ContactApiResponse = await this.get(`/contacts/${id}`);
      return mapContactResponse(apiResponse);
    },
    create: async (data: NewContactData): Promise<Contact> => {
      const apiResponse: ContactApiResponse = await this.post("/contacts", data);
      return mapContactResponse(apiResponse);
    },
    update: async (id: number, data: UpdateContactDto): Promise<Contact> => {
      const apiResponse: ContactApiResponse = await this.patch(`/contacts/${id}`, data);
      return mapContactResponse(apiResponse);
    },
    delete: (id: number): Promise<void> => this.delete(`/contacts/${id}`),
  };

  // Roles methods (universal - no brand context needed)
  roles = {
    getAll: (): Promise<Role[]> => this.get("/roles", { skipBrandContext: true }),
    getById: (id: number): Promise<Role> => this.get(`/roles/${id}`, { skipBrandContext: true }),
    create: (data: { name: string; description?: string }): Promise<Role> =>
      this.post("/roles", data, { skipBrandContext: true }),
    update: (
      id: number,
      data: { name?: string; description?: string },
    ): Promise<Role> => this.patch(`/roles/${id}`, data, { skipBrandContext: true }),
    delete: (id: number): Promise<void> => this.delete(`/roles/${id}`, { skipBrandContext: true }),
  };

  // Scenes methods (brand-specific)
  scenes = {
    getAll: (): Promise<ScenesLibrary[]> => {
      console.log('🔍 API Debug - scenes.getAll called');
      return this.get("/scenes");
    },
    getById: (id: number): Promise<ScenesLibrary> => this.get(`/scenes/${id}`),
    create: (data: CreateSceneDto): Promise<ScenesLibrary> =>
      this.post("/scenes", data),
    update: (id: number, data: UpdateSceneDto): Promise<ScenesLibrary> =>
      this.patch(`/scenes/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/scenes/${id}`),
  };

  // Films methods (brand-specific)
  films = {
    getAll: (): Promise<FilmData[]> => {
      console.log('🔍 API Debug - films.getAll called');
      return this.get("/films");
    },
    getById: (id: number): Promise<FilmData> => this.get(`/films/${id}`),
    create: (data: CreateFilmData): Promise<FilmData> =>
      this.post("/films", data),
    update: (id: number, data: UpdateFilmData): Promise<FilmData> =>
      this.patch(`/films/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/films/${id}`),
  };

  // Editing Styles methods (universal - shared across brands)
  editingStyles = {
    getAll: (): Promise<EditingStyleData[]> => this.get("/editing-styles", { skipBrandContext: true }),
    getById: (id: number): Promise<EditingStyleData> =>
      this.get(`/editing-styles/${id}`, { skipBrandContext: true }),
    create: (data: CreateEditingStyleData): Promise<EditingStyleData> =>
      this.post("/editing-styles", data, { skipBrandContext: true }),
    update: (
      id: number,
      data: UpdateEditingStyleData,
    ): Promise<EditingStyleData> => this.patch(`/editing-styles/${id}`, data, { skipBrandContext: true }),
    delete: (id: number): Promise<void> => this.delete(`/editing-styles/${id}`, { skipBrandContext: true }),
  };

  // Timeline methods (brand-specific for content, universal for layers)
  timeline = {
    getScenesForFilm: (filmId: number): Promise<TimelineSceneData[]> =>
      this.get(`/timeline/content/${filmId}/scenes`),

    getLayers: (): Promise<TimelineLayerData[]> =>
      this.get("/timeline/layers", { skipBrandContext: true }),

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

  // Brands methods (universal - used for brand management itself)
  brands = {
    getAll: (): Promise<Brand[]> => this.get("/brands", { skipBrandContext: true }),
    getById: (id: number): Promise<Brand> => this.get(`/brands/${id}`, { skipBrandContext: true }),
    create: (data: Omit<Brand, 'id' | 'created_at' | 'updated_at'>): Promise<Brand> =>
      this.post("/brands", data, { skipBrandContext: true }),
    update: (id: number, data: Partial<Omit<Brand, 'id' | 'created_at' | 'updated_at'>>): Promise<Brand> =>
      this.patch(`/brands/${id}`, data, { skipBrandContext: true }),
    delete: (id: number): Promise<void> =>
      this.delete(`/brands/${id}`, { skipBrandContext: true }),
    getUserBrands: (userId: number): Promise<UserBrand[]> =>
      this.get(`/brands/users/${userId}/brands`, { skipBrandContext: true }),
    getBrandContext: (brandId: number, userId: number) =>
      this.get(`/brands/${brandId}/context/users/${userId}`, { skipBrandContext: true }),
  };

  // Task Library methods (brand-specific)
  taskLibrary = {
    getAll: (query?: { phase?: string; is_active?: boolean }): Promise<TaskLibrary[]> => {
      const params = new URLSearchParams();
      if (query?.phase) params.append("phase", query.phase);
      if (query?.is_active !== undefined) params.append("is_active", query.is_active.toString());
      const queryString = params.toString();
      return this.get(`/task-library${queryString ? `?${queryString}` : ""}`);
    },
    getById: (id: number): Promise<TaskLibrary> => this.get(`/task-library/${id}`),
    create: (data: CreateTaskLibraryDto): Promise<TaskLibrary> =>
      this.post("/task-library", data),
    update: (id: number, data: UpdateTaskLibraryDto): Promise<TaskLibrary> =>
      this.patch(`/task-library/${id}`, data),
    delete: (id: number): Promise<void> =>
      this.delete(`/task-library/${id}`),
    getGroupedByPhase: async (): Promise<TaskLibraryByPhase> => {
      const response: { groupedByPhase: TaskLibraryByPhase } = await this.get("/task-library");
      return response.groupedByPhase;
    },
    batchUpdateOrder: (data: BatchUpdateTaskOrderDto): Promise<void> =>
      this.patch("/task-library/batch-update-order", data),

    // Benchmark methods
    benchmarks: {
      getAll: (taskLibraryId: number): Promise<TaskLibraryBenchmark[]> =>
        this.get(`/task-library/${taskLibraryId}/benchmarks`),
      create: (data: CreateTaskLibraryBenchmarkDto): Promise<TaskLibraryBenchmark> =>
        this.post("/task-library/benchmarks", data),
      update: (id: number, data: UpdateTaskLibraryBenchmarkDto): Promise<TaskLibraryBenchmark> =>
        this.patch(`/task-library/benchmarks/${id}`, data),
      delete: (id: number): Promise<void> =>
        this.delete(`/task-library/benchmarks/${id}`),
    },

    // Skill rates methods  
    skillRates: {
      getAll: (taskLibraryId: number): Promise<TaskLibrarySkillRate[]> =>
        this.get(`/task-library/${taskLibraryId}/skill-rates`),
      create: (data: CreateTaskLibrarySkillRateDto): Promise<TaskLibrarySkillRate> =>
        this.post("/task-library/skill-rates", data),
      update: (id: number, data: UpdateTaskLibrarySkillRateDto): Promise<TaskLibrarySkillRate> =>
        this.patch(`/task-library/skill-rates/${id}`, data),
      delete: (id: number): Promise<void> =>
        this.delete(`/task-library/skill-rates/${id}`),
    },
  };

  // Utility methods for common operations
  utils = {
    // Health check (universal)
    healthCheck: (): Promise<{ status: string; timestamp: string }> =>
      this.get("/health", { skipBrandContext: true }),

    // Upload file (brand-specific if needed)
    uploadFile: (
      file: File,
      endpoint: string = "/upload",
      options: { skipBrandContext?: boolean } = {}
    ): Promise<{ url: string; filename: string }> => {
      const formData = new FormData();
      formData.append("file", file);

      // Add brand context to URL if not skipped
      const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);

      return fetch(`${this.baseURL}${url}`, {
        method: "POST",
        headers: this.authToken
          ? { Authorization: `Bearer ${this.authToken}` }
          : {},
        body: formData,
      }).then((response) => this.handleResponse(response));
    },

    // Search across entities (brand-specific)
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
 * import { api, authService, setBrandContextProvider } from '@/lib/api';
 * import { useBrand } from '@/app/providers/BrandProvider';
 *
 * // Set up brand context provider (done automatically by BrandProvider)
 * const { getCurrentBrandId } = useBrand();
 * setBrandContextProvider({ getCurrentBrandId });
 *
 * // Authentication - ALWAYS use authService for authentication operations
 * await authService.login({ email: 'user@example.com', password: 'password' });
 * const profile = await authService.getProfile();
 * const token = authService.getToken();
 * authService.setToken(newToken);
 *
 * // Working with brand-specific data (brand context automatically included)
 * const scenes = await api.scenes.getAll(); // Brand context automatically included
 * const contacts = await api.contacts.getAll(); // Brand context automatically included
 * const newScene = await api.scenes.create({
 *   name: 'Wedding Ceremony',
 *   description: 'Main ceremony footage',
 *   media_type: 'VIDEO',
 *   complexity_score: 8,
 *   estimated_duration: 3600,
 *   base_task_hours: '4.5'
 * }); // Brand context automatically included
 *
 * // Working with universal/global data (no brand context)
 * const layers = await api.timeline.getLayers(); // No brand context needed
 * const editingStyles = await api.editingStyles.getAll(); // Shared across brands
 * const roles = await api.roles.getAll(); // Universal roles
 *
 * // Brand management operations
 * const userBrands = await api.brands.getUserBrands(userId);
 *
 * // Timeline operations (mixed: content is brand-specific, layers are universal)
 * const filmScenes = await api.timeline.getScenesForFilm(filmId); // Brand-specific
 * const analytics = await api.timeline.getAnalytics(filmId); // Brand-specific
 *
 * // Search across entities (brand-specific)
 * const results = await api.utils.search('wedding dance');
 *
 * // Health check (universal)
 * const health = await api.utils.healthCheck();
 * ```
 *
 * ## Brand Context Features
 *
 * - **Automatic Brand Context**: All brand-specific API calls automatically include the current brand context
 * - **No Manual brandId**: No need to pass brandId parameters manually
 * - **Universal vs Brand-Specific**: Clear separation between data that's shared (universal) and brand-specific
 * - **Header & Query Support**: Brand context sent both as X-Brand-Context header and brandId query parameter
 * - **Selective Application**: Only brand-specific endpoints get brand context, universal endpoints skip it
 * 
 * ## Brand-Specific vs Universal Data
 * 
 * **Brand-Specific (auto brand context):**
 * - contacts, contributors, scenes, films
 * - timeline content (scenes, analytics)
 * - search, uploads
 * 
 * **Universal/Global (no brand context):**
 * - authentication, user profiles
 * - timeline layers, editing styles, roles
 * - brand management operations
 * - health checks
 *
 * ## Features
 *
 * - **Type Safety**: All methods are fully typed with centralized type definitions
 * - **Authentication**: Automatic token management and 401 handling through authService
 * - **Brand Context**: Automatic brand context injection for multi-tenant operations
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
export const taskLibraryService = api.taskLibrary;

// Export the main instance as default
export default api;
