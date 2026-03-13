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
  BrandSetting,
  UserBrand,

  // Sales domain
  Inquiry,
  InquiryTask,
  InquiryTaskStatus,
  Client,
  ClientListItem,
  CreateInquiryData,
  UpdateInquiryData,
  CreateClientData,
  UpdateClientData,
  Proposal,
  CreateProposalData,
  UpdateProposalData,
  ServicePackage,
  NeedsAssessmentTemplate,
  NeedsAssessmentSubmission,
  NeedsAssessmentSubmissionPayload,

  // Contracts and Invoices domain
  Contract,
  Invoice,
  CreateContractData,
  UpdateContractData,
  CreateInvoiceData,
  UpdateInvoiceData,

  // Estimates domain
  Estimate,
  EstimateItem,
  CreateEstimateData,
  UpdateEstimateData,

  // Payment Schedules domain
  PaymentScheduleTemplate,
  PaymentScheduleRule,
  EstimatePaymentMilestone,
  CreatePaymentScheduleTemplateData,
  UpdatePaymentScheduleTemplateData,
  ApplyScheduleToEstimateData,

  // Quotes domain
  Quote,
  QuoteItem,
  CreateQuoteData,
  UpdateQuoteData,

  // Content domain - NOTE: ScenesLibrary moved to domains/scenes
  CreateSceneDto,
  UpdateSceneDto,
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
  TaskAutoGenerationPreview,
  ExecuteAutoGenerationResult,
  ExecuteAutoGenerationDto,

  // Workflow Management domain
  WorkflowTemplate,
  WorkflowStage,
  TaskGenerationRule,
  WorkflowTaskPreview,
  WorkflowTemplateTask,
  TemplateTasksResponse,
  ToggleTaskResponse,
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  AddTaskToTemplateDto,
  SyncTemplateTasksDto,
  UpdateTemplateTaskDto,
  CreateWorkflowStageDto,
  UpdateWorkflowStageDto,
  ReorderStagesDto,
  CreateTaskGenerationRuleDto,
  UpdateTaskGenerationRuleDto,
  WorkflowQueryParams,

  // Equipment Management domain
  Equipment,
  EquipmentRental,
  EquipmentMaintenance,
  CreateEquipmentDto,
  UpdateEquipmentDto,
  CreateEquipmentRentalDto,
  UpdateEquipmentRentalDto,
  CreateEquipmentMaintenanceDto,
  UpdateEquipmentMaintenanceDto,
  EquipmentByCategory,
  EquipmentStats,

  // Job Roles domain
  JobRole,
  CreateJobRoleData,
  UpdateJobRoleData,

  // Payment Brackets domain
  PaymentBracket,
  PaymentBracketsByRole,
  EffectiveRate,
  ContributorBracketAssignment,
  CreatePaymentBracketData,
  UpdatePaymentBracketData,
  AssignBracketData,

  // Skill-Role Mappings domain
  SkillRoleMapping,
  SkillRoleMappingSummary,
  AvailableSkill,
  ResolvedRoleResult,
  CreateSkillRoleMappingData,
  UpdateSkillRoleMappingData,
  BulkCreateSkillRoleMappingData,
  ResolveSkillRoleData,

  // Subjects domain
  SubjectsLibrary,
  SceneSubjects,
  CreateSubjectDto,
  UpdateSubjectDto,
  AssignSubjectToSceneDto,
  UpdateSceneSubjectDto,

  // API responses and mappers
  ContributorApiResponse,
  ContactApiResponse,
  mapContributorResponse,
  mapContactResponse,
  InquiryApiResponse,
  ProposalApiResponse,
  mapProposalResponse,
  ClientApiResponse,
  ClientListApiResponse,
  ClientDetailApiResponse,
  mapInquiryResponse,
  mapClientResponse,
  mapClientListResponse,
  mapClientDetailResponse,
} from "./types";

import { createLoggedFetch } from "./logging/request-interceptor";

// Import coverage types from separate file
import {
  Coverage,
  CreateCoverageDto,
  UpdateCoverageDto,
  CoverageLibraryItem,
} from "../types/coverage.types";

// Import locations types from separate file
import {
  LocationsLibrary,
  LocationSpace,
  FloorPlan,
  FloorPlanObject,
  CreateLocationRequest,
  UpdateLocationRequest,
  UpdateVenueFloorPlanRequest,
  CreateLocationSpaceRequest,
  UpdateLocationSpaceRequest,
  CreateFloorPlanRequest,
  UpdateFloorPlanRequest,
  CreateFloorPlanObjectRequest,
  UpdateFloorPlanObjectRequest,
  LocationCategory,
  ObjectCategory,
} from "./types/locations";

import type {
  FilmLocationAssignment,
  FilmSceneLocationAssignment,
} from "./types/locations";

// Import film equipment, tracks, and scenes types
import {
  FilmEquipment,
  SetEquipmentDto,
  EquipmentSummary,
  FilmEquipmentAssignment,
} from "../types/film-equipment.types";

import {
  TimelineTrack,
  GenerateTracksDto,
  UpdateTrackDto,
  ReorderTracksDto,
  TracksByType,
  TrackStatistics,
} from "../types/film-timeline-tracks.types";

import {
  CreateSceneFromTemplateDto,
  CreateBlankSceneDto,
  UpdateDurationModeDto,
  SceneDurationInfo,
  FilmLocalScene,
} from "../types/film-scenes.types";

// Import ScenesLibrary from centralized domains/scenes
import {
  ScenesLibrary,
} from "./types/domains/scenes";

// Import Film types from domains
import {
  Film,
  FilmType,
  CreateFilmDto,
  UpdateFilmDto,
} from "./types/domains/film";

import type {
  MontagePreset,
  CreateMontagePresetDto,
  UpdateMontagePresetDto,
} from "./types/domains/montage-presets";

import type {
  FilmStructureTemplate,
  CreateFilmStructureTemplateDto,
  UpdateFilmStructureTemplateDto,
} from "./types/domains/film-structure-templates";

import type {
  SceneAudioSource,
  CreateSceneAudioSourceDto,
  UpdateSceneAudioSourceDto,
} from "./types/domains/audio-sources";

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
  protected refreshToken: string | null = null;
  private onUnauthorized?: () => void;
  private readonly loggedFetch = createLoggedFetch(fetch);

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Initialize token from localStorage if available (browser only)
    this.initializeTokenFromStorage();
  }

  private initializeTokenFromStorage() {
    // Only run in browser environment, not during SSR
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("authToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (storedToken) {
        this.authToken = storedToken;
      }
      if (storedRefreshToken) {
        this.refreshToken = storedRefreshToken;
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

  setRefreshToken(token: string | null) {
    this.refreshToken = token;
    // Persist refresh token changes to localStorage (browser only)
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("refreshToken", token);
      } else {
        localStorage.removeItem("refreshToken");
      }
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
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
    if (brandId) {
      headers.append("X-Brand-Context", brandId.toString());
    }

    return headers;
  }

  // Helper method to add brand context to URL parameters
  protected addBrandContextToUrl(url: string, forceBrandContext = false): string {
    const brandId = getCurrentBrandId();

    // Only add brand context if we have one and either it's forced or the URL doesn't already contain brandId
    if (brandId && (forceBrandContext || !url.includes('brandId='))) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}brandId=${brandId}`;
    }

    return url;
  }

  protected async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token if we have a refresh token
        if (this.refreshToken) {
          try {
            // Make refresh request
            const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: this.refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              this.setAuthToken(refreshData.access_token);
              this.setRefreshToken(refreshData.refresh_token);

              // Retry the original request with new token
              const url = response.url;
              const originalRequest = new Request(url, {
                method: response.headers.get('x-original-method') || 'GET',
            FilmLocationAssignment,
            FilmSceneLocationAssignment,
                headers: this.getAuthHeaders(),
                body: response.headers.get('x-original-body') || undefined,
              });

              const retryResponse = await fetch(originalRequest);
              return this.handleResponse<T>(retryResponse);
            }
          } catch (refreshError) {
            // Refresh failed, proceed with logout
            console.error('Token refresh failed:', refreshError);
          }
        }

        // No refresh token or refresh failed
        this.setAuthToken(null);
        this.setRefreshToken(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new Error("Authentication failed. Please log in again.");
      }

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message;
        }
      } catch {
        // ignore JSON parse failure, use default message
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return {} as T;
  }

  protected async get<T>(endpoint: string, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await this.loggedFetch(`${this.baseURL}${url}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  protected async post<T>(endpoint: string, data?: unknown, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await this.loggedFetch(`${this.baseURL}${url}`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async patch<T>(endpoint: string, data?: unknown, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await this.loggedFetch(`${this.baseURL}${url}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async put<T>(endpoint: string, data?: unknown, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await this.loggedFetch(`${this.baseURL}${url}`, {
      method: "PUT",
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  protected async delete<T>(endpoint: string, options: { skipBrandContext?: boolean } = {}): Promise<T> {
    const url = options.skipBrandContext ? endpoint : this.addBrandContextToUrl(endpoint);
    const response = await this.loggedFetch(`${this.baseURL}${url}`, {
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
    login: (credentials: LoginCredentials): Promise<AuthResponse & { refresh_token: string }> =>
      this.post("/auth/login", credentials, { skipBrandContext: true }),

    getProfile: (): Promise<UserProfile> =>
      this.get("/auth/profile", { skipBrandContext: true }),

    refresh: (refreshToken: string): Promise<{ access_token: string; refresh_token: string }> =>
      this.post("/auth/refresh", { refresh_token: refreshToken }, { skipBrandContext: true }),

    setToken: (token: string | null) => this.setAuthToken(token),
    setRefreshToken: (token: string | null) => this.setRefreshToken(token),
    getToken: () => this.getAuthToken(),
    getRefreshToken: () => this.getRefreshToken(),
    refreshToken: () => this.refreshTokenFromStorage(),
    onUnauthorized: (callback: () => void) =>
      this.setUnauthorizedCallback(callback),
  };

  // Contributors methods (brand-specific)
  contributors = {
    getAll: async (): Promise<Contributor[]> => {
      const apiResponse: ContributorApiResponse[] = await this.get("/contributors");
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
    // Job role management methods
    addJobRole: async (id: number, jobRoleId: number): Promise<Contributor> => {
      const apiResponse: ContributorApiResponse = await this.post(`/contributors/${id}/job-roles`, {
        job_role_id: jobRoleId,
      });
      return mapContributorResponse(apiResponse);
    },
    removeJobRole: async (id: number, jobRoleId: number): Promise<Contributor> => {
      const apiResponse: ContributorApiResponse = await this.delete(`/contributors/${id}/job-roles/${jobRoleId}`);
      return mapContributorResponse(apiResponse);
    },
    setPrimaryJobRole: async (id: number, jobRoleId: number): Promise<Contributor> => {
      const apiResponse: ContributorApiResponse = await this.put(`/contributors/${id}/job-roles/${jobRoleId}/primary`, {});
      return mapContributorResponse(apiResponse);
    },
  };

  // Job Roles methods (global)
  jobRoles = {
    getAll: (): Promise<JobRole[]> => this.get("/job-roles", { skipBrandContext: true }),
    getById: (id: number): Promise<JobRole> => this.get(`/job-roles/${id}`, { skipBrandContext: true }),
    create: (data: CreateJobRoleData): Promise<JobRole> =>
      this.post("/job-roles", data, { skipBrandContext: true }),
    update: (id: number, data: UpdateJobRoleData): Promise<JobRole> =>
      this.put(`/job-roles/${id}`, data, { skipBrandContext: true }),
    delete: (id: number): Promise<void> =>
      this.delete(`/job-roles/${id}`, { skipBrandContext: true }),
    getContributorAssignments: (contributorId: number): Promise<Array<{
      id: number;
      contributor_id: number;
      job_role_id: number;
      is_primary: boolean;
      assigned_at: string;
      assigned_by: number | null;
      job_role: JobRole;
      assigned_by_user: unknown | null;
    }>> =>
      this.get(`/job-roles/contributor/${contributorId}/assignments`, { skipBrandContext: true }),
  };

  // Payment Brackets methods (global, not brand-scoped)
  paymentBrackets = {
    getAll: (includeInactive = false): Promise<PaymentBracket[]> =>
      this.get(`/payment-brackets${includeInactive ? "?include_inactive=true" : ""}`, { skipBrandContext: true }),
    getByRole: (brandId?: number): Promise<PaymentBracketsByRole> =>
      this.get(`/payment-brackets/by-role${brandId ? `?brandId=${brandId}` : ''}`, { skipBrandContext: true }),
    getByJobRole: (jobRoleId: number, includeInactive = false): Promise<PaymentBracket[]> =>
      this.get(`/payment-brackets/job-role/${jobRoleId}${includeInactive ? "?include_inactive=true" : ""}`, { skipBrandContext: true }),
    getById: (id: number): Promise<PaymentBracket> =>
      this.get(`/payment-brackets/${id}`, { skipBrandContext: true }),
    create: (data: CreatePaymentBracketData): Promise<PaymentBracket> =>
      this.post("/payment-brackets", data, { skipBrandContext: true }),
    update: (id: number, data: UpdatePaymentBracketData): Promise<PaymentBracket> =>
      this.put(`/payment-brackets/${id}`, data, { skipBrandContext: true }),
    delete: (id: number): Promise<void> =>
      this.delete(`/payment-brackets/${id}`, { skipBrandContext: true }),
    assign: (data: AssignBracketData): Promise<ContributorBracketAssignment> =>
      this.post("/payment-brackets/assign", data, { skipBrandContext: true }),
    unassign: (contributorId: number, jobRoleId: number): Promise<ContributorBracketAssignment> =>
      this.delete(`/payment-brackets/contributor/${contributorId}/job-role/${jobRoleId}`, { skipBrandContext: true }),
    toggleUnmanned: (contributorId: number, jobRoleId: number, isUnmanned: boolean): Promise<ContributorBracketAssignment> =>
      this.patch(`/payment-brackets/contributor/${contributorId}/job-role/${jobRoleId}/unmanned`, { is_unmanned: isUnmanned }, { skipBrandContext: true }),
    getContributorBrackets: (contributorId: number): Promise<ContributorBracketAssignment[]> =>
      this.get(`/payment-brackets/contributor/${contributorId}`, { skipBrandContext: true }),
    getEffectiveRate: (contributorId: number, jobRoleId: number): Promise<EffectiveRate> =>
      this.get(`/payment-brackets/effective-rate/${contributorId}/${jobRoleId}`, { skipBrandContext: true }),
  };

  // Skill-Role Mappings methods
  skillRoleMappings = {
    getAll: (params?: { brandId?: number; jobRoleId?: number; skill?: string }): Promise<SkillRoleMapping[]> => {
      const qs = new URLSearchParams();
      if (params?.brandId) qs.set("brandId", String(params.brandId));
      if (params?.jobRoleId) qs.set("jobRoleId", String(params.jobRoleId));
      if (params?.skill) qs.set("skill", params.skill);
      const query = qs.toString();
      return this.get(`/skill-role-mappings${query ? `?${query}` : ""}`);
    },
    getById: (id: number): Promise<SkillRoleMapping> =>
      this.get(`/skill-role-mappings/${id}`),
    getSummary: (brandId?: number): Promise<SkillRoleMappingSummary> =>
      this.get(`/skill-role-mappings/summary${brandId ? `?brandId=${brandId}` : ""}`),
    getAvailableSkills: (brandId?: number): Promise<AvailableSkill[]> =>
      this.get(`/skill-role-mappings/skills${brandId ? `?brandId=${brandId}` : ""}`),
    create: (data: CreateSkillRoleMappingData): Promise<SkillRoleMapping> =>
      this.post("/skill-role-mappings", data),
    bulkCreate: (data: BulkCreateSkillRoleMappingData): Promise<{ created: number; skipped: number; errors: string[] }> =>
      this.post("/skill-role-mappings/bulk", data),
    update: (id: number, data: UpdateSkillRoleMappingData): Promise<SkillRoleMapping> =>
      this.put(`/skill-role-mappings/${id}`, data),
    delete: (id: number): Promise<void> =>
      this.delete(`/skill-role-mappings/${id}`),
    resolve: (data: ResolveSkillRoleData): Promise<ResolvedRoleResult | null> =>
      this.post("/skill-role-mappings/resolve", data),
  };

  // Subjects methods (library-based with optional brand context)
  subjects = {
    // Get all subjects from library (brand-specific or global)
    getAll: (): Promise<SubjectsLibrary[]> => this.get("/subjects"),

    // Get subject by ID
    getById: (id: number): Promise<SubjectsLibrary> => this.get(`/subjects/${id}`),

    // Create new subject in library
    create: (data: CreateSubjectDto): Promise<SubjectsLibrary> =>
      this.post("/subjects", data),

    // Update subject in library
    update: (id: number, data: UpdateSubjectDto): Promise<SubjectsLibrary> =>
      this.patch(`/subjects/${id}`, data),

    // Delete subject from library
    delete: (id: number): Promise<void> => this.delete(`/subjects/${id}`),

    // Get subjects assigned to a specific scene
    getByScene: (sceneId: number): Promise<SceneSubjects[]> =>
      this.get(`/subjects/scenes/${sceneId}`),

    // Assign subject to scene with priority
    assignToScene: (sceneId: number, data: AssignSubjectToSceneDto): Promise<SceneSubjects> =>
      this.post(`/subjects/scenes/${sceneId}/assign`, data),

    // Update scene subject assignment (priority, notes)
    updateSceneAssignment: (sceneId: number, subjectId: number, data: UpdateSceneSubjectDto): Promise<SceneSubjects> =>
      this.patch(`/subjects/scenes/${sceneId}/subjects/${subjectId}`, data),

    // Remove subject from scene
    removeFromScene: (sceneId: number, subjectId: number): Promise<void> =>
      this.delete(`/subjects/scenes/${sceneId}/subjects/${subjectId}`),

    // Get subjects assigned to a specific moment
    getByMoment: (momentId: number): Promise<SceneSubjects[]> =>
      this.get(`/subjects/moments/${momentId}`),

    // Assign subject to moment with priority
    assignToMoment: (momentId: number, data: AssignSubjectToSceneDto): Promise<SceneSubjects> =>
      this.post(`/subjects/moments/${momentId}/assign`, data),

    // Update moment subject assignment (priority, notes)
    updateMomentAssignment: (momentId: number, subjectId: number, data: UpdateSceneSubjectDto): Promise<SceneSubjects> =>
      this.patch(`/subjects/moments/${momentId}/subjects/${subjectId}`, data),

    // Remove subject from moment
    removeFromMoment: (momentId: number, subjectId: number): Promise<void> =>
      this.delete(`/subjects/moments/${momentId}/subjects/${subjectId}`),

    // ===== Subject Type Template Management =====

    // Get all type templates for a brand
    getTypeTemplates: (brandId: number): Promise<any[]> =>
      this.get(`/subjects/type-templates/brand/${brandId}`),

    // Create a new type template for a brand
    createTypeTemplate: (brandId: number, data: { name: string; description?: string; category: string }): Promise<any> =>
      this.post(`/subjects/type-templates/brand/${brandId}`, data),

    // Update a type template
    updateTypeTemplate: (templateId: number, data: { name?: string; description?: string; category?: string; is_active?: boolean }): Promise<any> =>
      this.patch(`/subjects/type-templates/${templateId}`, data),

    // Delete a type template
    deleteTypeTemplate: (templateId: number): Promise<void> =>
      this.delete(`/subjects/type-templates/${templateId}`),

    // Add a role to a type template
    addRoleToTemplate: (templateId: number, data: { role_name: string; description?: string; is_core?: boolean }): Promise<any> =>
      this.post(`/subjects/type-templates/${templateId}/roles`, data),

    // Remove a role from a type template
    removeRoleFromTemplate: (roleId: number): Promise<void> =>
      this.delete(`/subjects/type-templates/roles/${roleId}`),
  };

  // Film location assignments
  filmLocations = {
    getByFilm: (filmId: number): Promise<FilmLocationAssignment[]> =>
      this.get(`/film-locations/films/${filmId}/locations`),
    addToFilm: (filmId: number, data: { location_id: number; notes?: string }): Promise<FilmLocationAssignment> =>
      this.post(`/film-locations/films/${filmId}/locations`, data),
    removeFromFilm: (filmId: number, locationId: number): Promise<void> =>
      this.delete(`/film-locations/films/${filmId}/locations/${locationId}`),
    getSceneLocation: (sceneId: number): Promise<FilmSceneLocationAssignment | null> =>
      this.get(`/film-locations/scenes/${sceneId}/location`),
    setSceneLocation: (sceneId: number, data: { location_id: number }): Promise<FilmSceneLocationAssignment> =>
      this.put(`/film-locations/scenes/${sceneId}/location`, data),
    clearSceneLocation: (sceneId: number): Promise<void> =>
      this.delete(`/film-locations/scenes/${sceneId}/location`),
  };

  // Contacts methods (brand-specific)
  contacts = {
    getAll: async (): Promise<Contact[]> => {
      const apiResponse: ContactApiResponse[] = await this.get("/contacts");
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
      return this.get("/scenes/templates");
    },
    getByFilm: (filmId: number): Promise<ScenesLibrary[]> => {
      return this.get(`/scenes/films/${filmId}/scenes`);
    },
    getTemplates: (): Promise<ScenesLibrary[]> => {
      return this.get("/scenes/templates");
    },
    createTemplateFromScene: (sceneId: number, name?: string): Promise<ScenesLibrary> =>
      this.post("/scenes/templates/from-scene", { scene_id: sceneId, name }, { skipBrandContext: true }),
    deleteTemplate: (id: number): Promise<{ message: string }> =>
      this.delete(`/scenes/templates/${id}`, { skipBrandContext: true }),
    getById: (id: number): Promise<ScenesLibrary> => this.get(`/scenes/${id}`),
    create: (data: CreateSceneDto): Promise<ScenesLibrary> =>
      this.post("/scenes", data),
    update: (id: number, data: UpdateSceneDto): Promise<ScenesLibrary> =>
      this.patch(`/scenes/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/scenes/${id}`),
    // Scene-Coverage relationship methods
    addCoverageToScene: (
      sceneId: number, 
      coverageIds: number[],
      assignments?: { coverageId: number; assignment: string }[]
    ): Promise<{ 
      success: boolean; 
      message: string; 
      scene_id: number; 
      coverage_ids: number[];
      scene_coverage_records?: { id: number; coverage_id: number; assignment: string }[]
    }> =>
      this.post(`/scenes/${sceneId}/coverage`, { coverageIds, assignments }),
    getSceneCoverage: (sceneId: number): Promise<{ 
      scene_id: number; 
      scene_name: string; 
      coverage_items: (Coverage & { scene_coverage_id: number; assignment?: string; priority_order?: number })[] 
    }> =>
      this.get(`/scenes/${sceneId}/coverage`),
    removeCoverageFromScene: (sceneId: number, coverageId: number): Promise<{ success: boolean; message: string; scene_id: number; coverage_id: number }> =>
      this.delete(`/scenes/${sceneId}/coverage/${coverageId}`),
    removeAllCoverageFromScene: (sceneId: number): Promise<{ success: boolean; message: string; scene_id: number; removed_count: number }> =>
      this.delete(`/scenes/${sceneId}/coverage`),
  };

  // Coverage methods (library)
  coverage = {
    getAll: (): Promise<Coverage[]> => this.get("/coverage"),
    getById: (id: number): Promise<Coverage> => this.get(`/coverage/${id}`),
    create: (data: CreateCoverageDto): Promise<Coverage> =>
      this.post("/coverage", data),
    update: (id: number, data: UpdateCoverageDto): Promise<Coverage> =>
      this.patch(`/coverage/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/coverage/${id}`),
  };

  // Films methods (brand-specific)
  films = {
    getAll: (): Promise<Film[]> => {
      return this.get("/films");
    },
    getById: (id: number): Promise<Film> => this.get(`/films/${id}`),
    create: (data: CreateFilmDto): Promise<Film> =>
      this.post("/films", data),
    update: (id: number, data: UpdateFilmDto): Promise<Film> =>
      this.patch(`/films/${id}`, data),
    delete: (id: number): Promise<void> => this.delete(`/films/${id}`),

    // Equipment Management
    equipment: {
      set: (filmId: number, data: SetEquipmentDto): Promise<FilmEquipment> =>
        this.post(`/films/${filmId}/equipment`, data),
      update: (filmId: number, data: { num_cameras?: number; num_audio?: number; allow_removal?: boolean }): Promise<any> =>
        this.patch(`/films/${filmId}/equipment`, data),
      getAll: (filmId: number): Promise<FilmEquipment[]> =>
        this.get(`/films/${filmId}/equipment`),
      getSummary: (filmId: number): Promise<EquipmentSummary> =>
        this.get(`/films/${filmId}/equipment/summary`),
      delete: (filmId: number, equipmentType: string): Promise<void> =>
        this.delete(`/films/${filmId}/equipment/${equipmentType}`),
    },

    equipmentAssignments: {
      getAll: (filmId: number): Promise<FilmEquipmentAssignment[]> =>
        this.get(`/films/${filmId}/equipment-assignments`),
      getSummary: (filmId: number): Promise<{ cameras: number; audio: number; music: number; lighting: number; other: number }> =>
        this.get(`/films/${filmId}/equipment-summary`),
      assign: (filmId: number, data: { equipment_id: number; quantity?: number; notes?: string }): Promise<FilmEquipmentAssignment> =>
        this.post(`/films/${filmId}/equipment-assignments`, data),
      update: (filmId: number, equipmentId: number, data: { quantity?: number; notes?: string }): Promise<FilmEquipmentAssignment> =>
        this.patch(`/films/${filmId}/equipment-assignments/${equipmentId}`, data),
      remove: (filmId: number, equipmentId: number): Promise<void> =>
        this.delete(`/films/${filmId}/equipment-assignments/${equipmentId}`),
    },

    // Timeline Tracks
    tracks: {
      generate: (filmId: number, data?: GenerateTracksDto): Promise<TimelineTrack[]> =>
        this.post(`/films/${filmId}/tracks/generate`, data),
      getAll: (filmId: number, activeOnly?: boolean): Promise<TimelineTrack[]> => {
        const query = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : '';
        return this.get(`/films/${filmId}/tracks${query}`);
      },
      getByType: (filmId: number): Promise<TracksByType> =>
        this.get(`/films/${filmId}/tracks/by-type`),
      update: (filmId: number, trackId: number, data: UpdateTrackDto): Promise<TimelineTrack> =>
        this.patch(`/films/${filmId}/tracks/${trackId}`, data),
      reorder: (filmId: number, data: ReorderTracksDto): Promise<TimelineTrack[]> =>
        this.post(`/films/${filmId}/tracks/reorder`, data),
      delete: (filmId: number, trackId: number): Promise<void> =>
        this.delete(`/films/${filmId}/tracks/${trackId}`),
      getStatistics: (filmId: number): Promise<TrackStatistics> =>
        this.get(`/films/${filmId}/tracks/statistics`),
    },

    // Scene Management
    localScenes: {
      createFromTemplate: (filmId: number, data: CreateSceneFromTemplateDto): Promise<FilmLocalScene> =>
        this.post(`/films/${filmId}/scenes/from-template`, data),
      createBlank: (filmId: number, data: CreateBlankSceneDto): Promise<FilmLocalScene> =>
        this.post(`/films/${filmId}/scenes/blank`, data),
      getAll: (filmId: number): Promise<FilmLocalScene[]> =>
        this.get(`/films/${filmId}/scenes`),
      updateDurationMode: (filmId: number, sceneId: number, data: UpdateDurationModeDto): Promise<FilmLocalScene> =>
        this.patch(`/films/${filmId}/scenes/${sceneId}/duration-mode`, data),
      getDuration: (filmId: number, sceneId: number): Promise<SceneDurationInfo> =>
        this.get(`/films/${filmId}/scenes/${sceneId}/duration`),
      getAllDurations: (filmId: number): Promise<SceneDurationInfo[]> =>
        this.get(`/films/${filmId}/scenes/durations`),
      create: (filmId: number, data: { name: string; scene_template_id?: number; order_index?: number; shot_count?: number | null; duration_seconds?: number | null; mode?: 'MOMENTS' | 'MONTAGE' }): Promise<FilmLocalScene> =>
        this.post(`/scenes/films/${filmId}/scenes`, data),
      reorder: (filmId: number, sceneOrderings: Array<{ id: number; order_index: number }>): Promise<any> =>
        this.post(`/scenes/${filmId}/reorder`, sceneOrderings),
    },
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

  // Moments methods (brand-specific)
  moments = {
    getSceneMoments: (sceneId: number): Promise<any[]> =>
      this.get(`/moments/scenes/${sceneId}/moments`),
    
    create: (sceneId: number, data: { name: string; duration?: number; order_index?: number }): Promise<any> => {
      const payload = {
        name: data.name,
        duration: data.duration || 10,
        order_index: data.order_index !== undefined ? data.order_index : 0,
      };
      return this.post(`/moments/scenes/${sceneId}/moments`, payload);
    },
    
    update: (sceneId: number, momentId: number, data: { name?: string; duration?: number; order_index?: number }): Promise<any> =>
      this.patch(`/moments/${momentId}`, data),
    
    delete: (sceneId: number, momentId: number): Promise<void> =>
      this.delete(`/moments/${momentId}`),
  };

  // Beats methods (montage)
  beats = {
    getSceneBeats: (sceneId: number): Promise<any[]> =>
      this.get(`/beats/scenes/${sceneId}/beats`),

    create: (sceneId: number, data: { name: string; duration_seconds?: number; order_index?: number; shot_count?: number | null }): Promise<any> => {
      const payload = {
        name: data.name,
        duration_seconds: data.duration_seconds || 10,
        order_index: data.order_index !== undefined ? data.order_index : 0,
        shot_count: data.shot_count ?? null,
      };
      return this.post(`/beats/scenes/${sceneId}/beats`, payload);
    },

    update: (beatId: number, data: { name?: string; duration_seconds?: number; order_index?: number; shot_count?: number | null }): Promise<any> =>
      this.patch(`/beats/${beatId}`, data),

    delete: (beatId: number): Promise<void> =>
      this.delete(`/beats/${beatId}`),

    reorder: (sceneId: number, beatOrderings: Array<{ id: number; order_index: number }>): Promise<any> =>
      this.post(`/beats/scenes/${sceneId}/reorder`, beatOrderings),

    recordingSetup: {
      get: (beatId: number): Promise<any> => this.get(`/beats/${beatId}/recording-setup`),
      upsert: (beatId: number, data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean }): Promise<any> =>
        this.patch(`/beats/${beatId}/recording-setup`, data),
      delete: (beatId: number): Promise<any> => this.delete(`/beats/${beatId}/recording-setup`),
    },
  };

  // Montage Presets (brand-scoped)
  montagePresets = {
    getAll: (brandId?: number): Promise<MontagePreset[]> => {
      const query = brandId ? `?brandId=${brandId}` : '';
      return this.get(`/montage-presets${query}`);
    },
    getById: (id: number): Promise<MontagePreset> =>
      this.get(`/montage-presets/${id}`),
    create: (data: CreateMontagePresetDto): Promise<MontagePreset> =>
      this.post('/montage-presets', data),
    update: (id: number, data: UpdateMontagePresetDto): Promise<MontagePreset> =>
      this.patch(`/montage-presets/${id}`, data),
    delete: (id: number): Promise<void> =>
      this.delete(`/montage-presets/${id}`),
  };

  // Film Structure Templates (brand-scoped)
  filmStructureTemplates = {
    getAll: (brandId?: number, filmType?: FilmType): Promise<FilmStructureTemplate[]> => {
      const params = new URLSearchParams();
      if (brandId) params.set('brandId', String(brandId));
      if (filmType) params.set('filmType', filmType);
      const query = params.toString() ? `?${params.toString()}` : '';
      return this.get(`/film-structure-templates${query}`);
    },
    getById: (id: number): Promise<FilmStructureTemplate> =>
      this.get(`/film-structure-templates/${id}`),
    create: (data: CreateFilmStructureTemplateDto): Promise<FilmStructureTemplate> =>
      this.post('/film-structure-templates', data),
    update: (id: number, data: UpdateFilmStructureTemplateDto): Promise<FilmStructureTemplate> =>
      this.patch(`/film-structure-templates/${id}`, data),
    delete: (id: number): Promise<void> =>
      this.delete(`/film-structure-templates/${id}`),
  };

  // Scene Audio Sources
  sceneAudioSources = {
    getByScene: (sceneId: number): Promise<SceneAudioSource[]> =>
      this.get(`/scene-audio-sources/scenes/${sceneId}/audio-sources`),
    getById: (id: number): Promise<SceneAudioSource> =>
      this.get(`/scene-audio-sources/${id}`),
    create: (sceneId: number, data: CreateSceneAudioSourceDto): Promise<SceneAudioSource> =>
      this.post(`/scene-audio-sources/scenes/${sceneId}/audio-sources`, data),
    update: (id: number, data: UpdateSceneAudioSourceDto): Promise<SceneAudioSource> =>
      this.patch(`/scene-audio-sources/${id}`, data),
    delete: (id: number): Promise<void> =>
      this.delete(`/scene-audio-sources/${id}`),
    reorder: (sceneId: number, orderings: Array<{ id: number; order_index: number }>): Promise<SceneAudioSource[]> =>
      this.post(`/scene-audio-sources/scenes/${sceneId}/audio-sources/reorder`, orderings),
  };

  // Timeline methods - layers managed via Films API
  timeline = {
    // Timeline layers (track organization metadata)
    getLayers: (): Promise<TimelineLayerData[]> =>
      this.get("/films/timeline-layers", { skipBrandContext: true }),

    createLayer: (data: { name: string; order_index: number; color_hex: string; description?: string }): Promise<TimelineLayerData> =>
      this.post("/films/timeline-layers", data, { skipBrandContext: true }),

    updateLayer: (id: number, data: Partial<TimelineLayerData>): Promise<TimelineLayerData> =>
      this.patch(`/films/timeline-layers/${id}`, data, { skipBrandContext: true }),

    deleteLayer: (id: number): Promise<void> =>
      this.delete(`/films/timeline-layers/${id}`, { skipBrandContext: true }),
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
    // Brand Settings
    getSettings: (brandId: number, category?: string): Promise<BrandSetting[]> =>
      this.get(`/brands/${brandId}/settings${category ? `?category=${category}` : ""}`, { skipBrandContext: true }),
    getSetting: (brandId: number, key: string): Promise<BrandSetting> =>
      this.get(`/brands/${brandId}/settings/${key}`, { skipBrandContext: true }),
    createSetting: (brandId: number, data: { key: string; value: string; data_type?: string; category?: string; description?: string }): Promise<BrandSetting> =>
      this.post(`/brands/${brandId}/settings`, data, { skipBrandContext: true }),
    updateSetting: (brandId: number, key: string, data: { value?: string; description?: string; is_active?: boolean }): Promise<BrandSetting> =>
      this.patch(`/brands/${brandId}/settings/${key}`, data, { skipBrandContext: true }),
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

    // Auto-generation preview for packages
    previewAutoGeneration: (packageId: number, brandId: number, inquiryId?: number): Promise<TaskAutoGenerationPreview> => {
      let url = `/task-library/auto-generate/preview/${packageId}?brandId=${brandId}`;
      if (inquiryId) url += `&inquiryId=${inquiryId}`;
      return this.get(url);
    },

    // Execute auto-generation: create real project tasks
    executeAutoGeneration: (dto: ExecuteAutoGenerationDto): Promise<ExecuteAutoGenerationResult> =>
      this.post('/task-library/auto-generate/execute', dto),
  };

  // Workflow Management methods (brand-specific)
  workflows = {
    // Workflow Templates
    getAll: (query?: WorkflowQueryParams): Promise<WorkflowTemplate[]> => {
      const params = new URLSearchParams();
      if (query?.brandId) params.append("brandId", query.brandId.toString());
      if (query?.is_active !== undefined) params.append("is_active", query.is_active.toString());
      if (query?.is_default !== undefined) params.append("is_default", query.is_default.toString());
      const queryString = params.toString();
      return this.get(`/workflows${queryString ? `?${queryString}` : ""}`);
    },
    getById: (id: number): Promise<WorkflowTemplate> =>
      this.get(`/workflows/${id}`),
    create: (data: CreateWorkflowTemplateDto): Promise<WorkflowTemplate> =>
      this.post("/workflows", data),
    update: (id: number, data: UpdateWorkflowTemplateDto): Promise<WorkflowTemplate> =>
      this.patch(`/workflows/${id}`, data),
    delete: (id: number): Promise<void> =>
      this.delete(`/workflows/${id}`),
    preview: (id: number): Promise<WorkflowTaskPreview> =>
      this.get(`/workflows/${id}/preview`),

    // Template Tasks (preset task selections)
    templateTasks: {
      getAll: (templateId: number): Promise<TemplateTasksResponse> =>
        this.get(`/workflows/${templateId}/tasks`),
      add: (templateId: number, data: AddTaskToTemplateDto): Promise<WorkflowTemplateTask> =>
        this.post(`/workflows/${templateId}/tasks`, data),
      sync: (templateId: number, data: SyncTemplateTasksDto): Promise<TemplateTasksResponse> =>
        this.post(`/workflows/${templateId}/tasks/sync`, data),
      toggle: (templateId: number, taskLibraryId: number): Promise<ToggleTaskResponse> =>
        this.post(`/workflows/${templateId}/tasks/toggle`, { task_library_id: taskLibraryId }),
      update: (templateTaskId: number, data: UpdateTemplateTaskDto): Promise<WorkflowTemplateTask> =>
        this.patch(`/workflows/tasks/${templateTaskId}`, data),
      remove: (templateTaskId: number): Promise<void> =>
        this.delete(`/workflows/tasks/${templateTaskId}`),
    },
  };

  // Equipment Management methods (brand-specific)
  equipment = {
    // Main equipment CRUD
    getAll: (query?: {
      category?: string;
      type?: string;
      status?: string;
      search?: string;
      manufacturer?: string;
      location?: string;
    }): Promise<Equipment[]> => {
      const params = new URLSearchParams();
      if (query?.category) params.append("category", query.category);
      if (query?.type) params.append("type", query.type);
      if (query?.status) params.append("status", query.status);
      if (query?.search) params.append("search", query.search);
      if (query?.manufacturer) params.append("manufacturer", query.manufacturer);
      if (query?.location) params.append("location", query.location);
      const queryString = params.toString();
      const baseUrl = `/equipment${queryString ? `?${queryString}` : ""}`;
      const url = this.addBrandContextToUrl(baseUrl);
      return this.get(url);
    },
    getById: (id: number): Promise<Equipment> => {
      const url = this.addBrandContextToUrl(`/equipment/${id}`);
      return this.get(url);
    },
    create: (data: CreateEquipmentDto): Promise<Equipment> =>
      this.post("/equipment", data),
    update: (id: number, data: UpdateEquipmentDto): Promise<Equipment> =>
      this.patch(`/equipment/${id}`, data),
    delete: (id: number): Promise<void> =>
      this.delete(`/equipment/${id}`),
    getGroupedByCategory: async (): Promise<EquipmentByCategory> => {
      const url = this.addBrandContextToUrl("/equipment/grouped");
      const response: { groupedByType: EquipmentByCategory } = await this.get(url);
      return response.groupedByType;
    },
    getStats: (): Promise<EquipmentStats> => this.get("/equipment/stats"),
    getAvailable: (startDate?: string, endDate?: string): Promise<Equipment[]> => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const queryString = params.toString();
      return this.get(`/equipment/available${queryString ? `?${queryString}` : ""}`);
    },

    // Equipment unmanned status methods
    findUnmanned: (brandId: number): Promise<Equipment[]> => {
      const url = this.addBrandContextToUrl(`/equipment/unmanned/${brandId}`);
      return this.get(url);
    },
    setUnmannedStatus: (equipmentId: number, isUnmanned: boolean): Promise<Equipment> =>
      this.patch(`/equipment/${equipmentId}/unmanned`, { isUnmanned }),

    // Equipment rental methods
    rentals: {
      getAll: (equipmentId?: number): Promise<EquipmentRental[]> => {
        const endpoint = equipmentId ? `/equipment/${equipmentId}/rentals` : "/equipment/rentals";
        return this.get(endpoint);
      },
      getById: (id: number): Promise<EquipmentRental> =>
        this.get(`/equipment/rentals/${id}`),
      create: (data: CreateEquipmentRentalDto): Promise<EquipmentRental> =>
        this.post("/equipment/rentals", data),
      update: (id: number, data: UpdateEquipmentRentalDto): Promise<EquipmentRental> =>
        this.patch(`/equipment/rentals/${id}`, data),
      delete: (id: number): Promise<void> =>
        this.delete(`/equipment/rentals/${id}`),
      returnEquipment: (id: number, depositReturned: boolean = true): Promise<EquipmentRental> =>
        this.patch(`/equipment/rentals/${id}/return`, {
          status: 'Completed',
          deposit_returned: depositReturned
        }),
      getActive: (): Promise<EquipmentRental[]> =>
        this.get("/equipment/rentals?status=Active"),
    },

    // Equipment maintenance methods
    maintenance: {
      getAll: (equipmentId?: number): Promise<EquipmentMaintenance[]> => {
        const endpoint = equipmentId ? `/equipment/${equipmentId}/maintenance` : "/equipment/maintenance";
        return this.get(endpoint);
      },
      getById: (id: number): Promise<EquipmentMaintenance> =>
        this.get(`/equipment/maintenance/${id}`),
      create: (data: CreateEquipmentMaintenanceDto): Promise<EquipmentMaintenance> =>
        this.post("/equipment/maintenance", data),
      update: (id: number, data: UpdateEquipmentMaintenanceDto): Promise<EquipmentMaintenance> =>
        this.patch(`/equipment/maintenance/${id}`, data),
      delete: (id: number): Promise<void> =>
        this.delete(`/equipment/maintenance/${id}`),
      complete: (id: number, notes?: string): Promise<EquipmentMaintenance> =>
        this.patch(`/equipment/maintenance/${id}/complete`, {
          status: 'Completed',
          completed_date: new Date().toISOString(),
          notes
        }),
      getDue: (): Promise<EquipmentMaintenance[]> =>
        this.get("/equipment/maintenance/due"),
      getScheduled: (): Promise<EquipmentMaintenance[]> =>
        this.get("/equipment/maintenance?status=Scheduled"),
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
      films: Film[];
      contributors: Contributor[];
    }> =>
      this.get(
        `/search?q=${encodeURIComponent(query)}&entities=${entities.join(",")}`,
      ),
  };

  // Inquiries methods (brand-specific)
  inquiries = {
    getAll: async (): Promise<Inquiry[]> => {
      const apiResponse: InquiryApiResponse[] = await this.get("/api/inquiries");
      return apiResponse.map(mapInquiryResponse);
    },
    getById: async (id: number): Promise<Inquiry> => {
      const apiResponse: InquiryApiResponse = await this.get(`/api/inquiries/${id}`);
      return mapInquiryResponse(apiResponse);
    },
    create: async (data: CreateInquiryData): Promise<Inquiry> => {
      const apiResponse: InquiryApiResponse = await this.post("/api/inquiries", data);
      return mapInquiryResponse(apiResponse);
    },
    update: async (id: number, data: UpdateInquiryData): Promise<Inquiry> => {
      const apiResponse: InquiryApiResponse = await this.put(`/api/inquiries/${id}`, data);
      return mapInquiryResponse(apiResponse);
    },
    convert: (inquiryId: number): Promise<{ projectId: number }> =>
      this.post(`/api/inquiries/${inquiryId}/convert`),
    delete: (id: number): Promise<void> => this.delete(`/api/inquiries/${id}`),

    // Schedule snapshot endpoints (cloned package data owned by inquiry)
    scheduleSnapshot: {
      getSummary: (inquiryId: number): Promise<any> =>
        this.get(`/api/inquiries/${inquiryId}/schedule-snapshot`),
      getEventDays: (inquiryId: number): Promise<any[]> =>
        this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/event-days`),
      getActivities: (inquiryId: number): Promise<any[]> =>
        this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/activities`),
      getOperators: (inquiryId: number): Promise<any[]> =>
        this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/operators`),
      getSubjects: (inquiryId: number): Promise<any[]> =>
        this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/subjects`),
      getLocations: (inquiryId: number): Promise<any[]> =>
        this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/locations`),
      getFilms: (inquiryId: number): Promise<any[]> =>
        this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/films`),
      getActivityMoments: (inquiryId: number, activityId: number): Promise<any[]> =>
        this.get(`/api/inquiries/${inquiryId}/schedule-snapshot/activities/${activityId}/moments`),
    },
  };

  // Inquiry Tasks (per-inquiry pipeline task tracking)
  inquiryTasks = {
    getAll: (inquiryId: number): Promise<InquiryTask[]> =>
      this.get(`/api/inquiries/${inquiryId}/tasks`),
    update: (inquiryId: number, taskId: number, data: { status?: InquiryTaskStatus; due_date?: string; order_index?: number }): Promise<InquiryTask> =>
      this.patch(`/api/inquiries/${inquiryId}/tasks/${taskId}`, data),
    toggle: (inquiryId: number, taskId: number, completedById?: number): Promise<InquiryTask> =>
      this.patch(`/api/inquiries/${inquiryId}/tasks/${taskId}/toggle`, completedById ? { completed_by_id: completedById } : {}),
    generate: (inquiryId: number): Promise<InquiryTask[]> =>
      this.post(`/api/inquiries/${inquiryId}/tasks/generate`),
  };

  // Needs Assessment methods (brand-specific)
  needsAssessmentTemplates = {
    getActive: (): Promise<NeedsAssessmentTemplate> =>
      this.get("/api/needs-assessments/templates/active"),
    getAll: (): Promise<NeedsAssessmentTemplate[]> =>
      this.get("/api/needs-assessments/templates"),
    getById: (id: number): Promise<NeedsAssessmentTemplate> =>
      this.get(`/api/needs-assessments/templates/${id}`),
    create: (data: Omit<NeedsAssessmentTemplate, "id" | "brand_id" | "created_at" | "updated_at">): Promise<NeedsAssessmentTemplate> =>
      this.post("/api/needs-assessments/templates", data),
    update: (id: number, data: Partial<NeedsAssessmentTemplate>): Promise<NeedsAssessmentTemplate> =>
      this.put(`/api/needs-assessments/templates/${id}`, data),
  };

  needsAssessmentSubmissions = {
    getAll: (): Promise<NeedsAssessmentSubmission[]> =>
      this.get("/api/needs-assessments/submissions"),
    getByInquiryId: (inquiryId: number): Promise<NeedsAssessmentSubmission[]> =>
      this.get(`/api/needs-assessments/submissions?inquiryId=${inquiryId}`),
    getById: (id: number): Promise<NeedsAssessmentSubmission> =>
      this.get(`/api/needs-assessments/submissions/${id}`),
    create: (data: NeedsAssessmentSubmissionPayload): Promise<NeedsAssessmentSubmission> =>
      this.post("/api/needs-assessments/submissions", data),
    convert: (id: number): Promise<NeedsAssessmentSubmission> =>
      this.post(`/api/needs-assessments/submissions/${id}/convert`),
  };

  // Clients methods (brand-specific, full CRUD)
  clients = {
    getAll: async (): Promise<ClientListItem[]> => {
      const apiResponse: ClientListApiResponse[] = await this.get("/api/clients");
      return apiResponse.map(mapClientListResponse);
    },
    getById: async (id: number): Promise<Client> => {
      const apiResponse: ClientDetailApiResponse = await this.get(`/api/clients/${id}`);
      return mapClientDetailResponse(apiResponse);
    },
    create: (data: CreateClientData): Promise<ClientListItem> =>
      this.post("/api/clients", data),
    update: (id: number, data: UpdateClientData): Promise<ClientListItem> =>
      this.put(`/api/clients/${id}`, data),
    delete: (id: number): Promise<void> =>
      this.delete(`/api/clients/${id}`),
  };

  // Proposals methods (brand-specific, nested under inquiries)
  proposals = {
    getById: async (inquiryId: number, proposalId: number): Promise<Proposal> => {
      const apiResponse: ProposalApiResponse = await this.get(`/api/inquiries/${inquiryId}/proposals/${proposalId}`);
      return mapProposalResponse(apiResponse);
    },
    getAllByInquiry: async (inquiryId: number): Promise<Proposal[]> => {
      const apiResponse: ProposalApiResponse[] = await this.get(`/api/inquiries/${inquiryId}/proposals`);
      return apiResponse.map(mapProposalResponse);
    },
    create: async (inquiryId: number, data: CreateProposalData): Promise<Proposal> => {
      const apiResponse: ProposalApiResponse = await this.post(`/api/inquiries/${inquiryId}/proposals`, data);
      return mapProposalResponse(apiResponse);
    },
    update: async (inquiryId: number, proposalId: number, data: UpdateProposalData): Promise<Proposal> => {
      const apiResponse: ProposalApiResponse = await this.put(`/api/inquiries/${inquiryId}/proposals/${proposalId}`, data);
      return mapProposalResponse(apiResponse);
    },
    delete: (inquiryId: number, proposalId: number): Promise<void> =>
      this.delete(`/api/inquiries/${inquiryId}/proposals/${proposalId}`),
    sendProposal: async (inquiryId: number, proposalId: number): Promise<Proposal> => {
      const apiResponse: ProposalApiResponse = await this.post(`/api/inquiries/${inquiryId}/proposals/${proposalId}/send`);
      return mapProposalResponse(apiResponse);
    },
    getOne: async (inquiryId: number, proposalId: number): Promise<Proposal> => {
      const apiResponse: ProposalApiResponse = await this.get(`/api/inquiries/${inquiryId}/proposals/${proposalId}`);
      return mapProposalResponse(apiResponse);
    },
  };

  servicePackages = {
     getAll: (brandId: number): Promise<ServicePackage[]> => this.get(`/service-packages/${brandId}`),
     getOne: (brandId: number, id: number): Promise<ServicePackage> => this.get(`/service-packages/${brandId}/${id}`),
     create: (brandId: number, data: Partial<ServicePackage>): Promise<ServicePackage> => this.post(`/service-packages/${brandId}`, data),
     update: (brandId: number, id: number, data: Partial<ServicePackage>): Promise<ServicePackage> => this.patch(`/service-packages/${brandId}/${id}`, data),
     delete: (brandId: number, id: number): Promise<void> => this.delete(`/service-packages/${brandId}/${id}`),
     // Version History
     versions: {
       getAll: (brandId: number, packageId: number): Promise<any[]> =>
         this.get(`/service-packages/${brandId}/${packageId}/versions`),
       create: (brandId: number, packageId: number, changeSummary?: string): Promise<any> =>
         this.post(`/service-packages/${brandId}/${packageId}/versions`, { change_summary: changeSummary }),
       getOne: (brandId: number, packageId: number, versionId: number): Promise<any> =>
         this.get(`/service-packages/${brandId}/${packageId}/versions/${versionId}`),
       restore: (brandId: number, packageId: number, versionId: number): Promise<any> =>
         this.post(`/service-packages/${brandId}/${packageId}/versions/${versionId}/restore`, {}),
     },
  };

  servicePackageCategories = {
     getAll: (brandId: number): Promise<any[]> => this.get(`/brands/${brandId}/package-categories`),
     create: (brandId: number, data: { name: string; description?: string; order_index?: number }): Promise<any> => this.post(`/brands/${brandId}/package-categories`, data),
     update: (brandId: number, id: number, data: { name?: string; description?: string; order_index?: number }): Promise<any> => this.patch(`/brands/${brandId}/package-categories/${id}`, data),
     delete: (brandId: number, id: number): Promise<void> => this.delete(`/brands/${brandId}/package-categories/${id}`),
  };

  // ─── Package Sets ────────────────────────────────────────────────────

  packageSets = {
    getAll: (brandId: number): Promise<any[]> => this.get(`/package-sets/${brandId}`),
    getOne: (brandId: number, id: number): Promise<any> => this.get(`/package-sets/${brandId}/${id}`),
    create: (brandId: number, data: { name: string; description?: string; emoji?: string; category_id?: number; tier_labels?: string[] }): Promise<any> =>
      this.post(`/package-sets/${brandId}`, data),
    update: (brandId: number, id: number, data: { name?: string; description?: string; emoji?: string; category_id?: number; order_index?: number }): Promise<any> =>
      this.patch(`/package-sets/${brandId}/${id}`, data),
    delete: (brandId: number, id: number): Promise<void> => this.delete(`/package-sets/${brandId}/${id}`),
    // Slot operations
    addSlot: (brandId: number, setId: number, slotLabel?: string): Promise<any> =>
      this.post(`/package-sets/${brandId}/${setId}/slots`, { slot_label: slotLabel }),
    updateSlot: (brandId: number, slotId: number, data: { slot_label?: string; service_package_id?: number | null; order_index?: number }): Promise<any> =>
      this.patch(`/package-sets/${brandId}/slots/${slotId}`, data),
    assignPackage: (brandId: number, slotId: number, servicePackageId: number): Promise<any> =>
      this.patch(`/package-sets/${brandId}/slots/${slotId}/assign`, { service_package_id: servicePackageId }),
    clearSlot: (brandId: number, slotId: number): Promise<any> =>
      this.patch(`/package-sets/${brandId}/slots/${slotId}/clear`, {}),
    removeSlot: (brandId: number, slotId: number): Promise<void> =>
      this.delete(`/package-sets/${brandId}/slots/${slotId}`),
    reorderSlots: (brandId: number, setId: number, slotIds: number[]): Promise<any> =>
      this.patch(`/package-sets/${brandId}/${setId}/reorder-slots`, { slot_ids: slotIds }),
    migratePackagesCategory: (brandId: number, setId: number, categoryId: number): Promise<{ updated: number }> =>
      this.patch(`/package-sets/${brandId}/${setId}/migrate-categories`, { category_id: categoryId }),
    clearAllSlotAssignments: (brandId: number, setId: number): Promise<{ cleared: number }> =>
      this.patch(`/package-sets/${brandId}/${setId}/clear-assignments`, {}),
  };

  // ─── Wedding Types System ────────────────────────────────────────────

  weddingTypes = {
    getAll: (brandId: number): Promise<any[]> => this.get(`/wedding-types?brandId=${brandId}`),
    getById: (id: number, brandId: number): Promise<any> => this.get(`/wedding-types/${id}?brandId=${brandId}`),
    getSystemSeeded: (): Promise<any[]> => this.get(`/wedding-types/system-seeded`),
    getBrandSpecific: (brandId: number): Promise<any[]> => this.get(`/wedding-types/brand-specific?brandId=${brandId}`),
    createPackageFromTemplate: (weddingTypeId: number, data: { packageName: string; packageDescription?: string }, brandId: number): Promise<any> =>
      this.post(`/wedding-types/${weddingTypeId}/create-package?brandId=${brandId}`, data),
  };

  // ─── Event Types System ────────────────────────────────────────────

  eventTypes = {
    getAll: (): Promise<any[]> => this.get('/event-types'),
    getById: (id: number): Promise<any> => this.get(`/event-types/${id}`),
    create: (data: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      default_duration_hours?: number;
      default_start_time?: string;
      typical_guest_count?: number;
      order_index?: number;
    }): Promise<any> => this.post('/event-types', data),
    update: (id: number, data: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      default_duration_hours?: number;
      default_start_time?: string;
      typical_guest_count?: number;
      is_active?: boolean;
      order_index?: number;
    }): Promise<any> => this.patch(`/event-types/${id}`, data),
    remove: (id: number): Promise<void> => this.delete(`/event-types/${id}`),

    // Event day links
    linkEventDay: (eventTypeId: number, data: {
      event_day_template_id: number;
      order_index?: number;
      is_default?: boolean;
    }): Promise<any> => this.post(`/event-types/${eventTypeId}/event-days`, data),
    unlinkEventDay: (eventTypeId: number, dayTemplateId: number): Promise<void> =>
      this.delete(`/event-types/${eventTypeId}/event-days/${dayTemplateId}`),

    // Subject type links
    linkSubjectType: (eventTypeId: number, data: {
      subject_type_template_id: number;
      order_index?: number;
      is_default?: boolean;
    }): Promise<any> => this.post(`/event-types/${eventTypeId}/subject-types`, data),
    unlinkSubjectType: (eventTypeId: number, subjectTypeTemplateId: number): Promise<void> =>
      this.delete(`/event-types/${eventTypeId}/subject-types/${subjectTypeTemplateId}`),

    // Package creation from wizard
    createPackageFromWizard: (eventTypeId: number, data: {
      packageName: string;
      packageDescription?: string;
      selectedDayIds: number[];
      selectedActivities: { presetId: number; startTime?: string; durationMinutes?: number }[];
      customActivities: {
        name: string;
        dayTemplateId: number;
        startTime?: string;
        durationMinutes?: number;
        moments: { name: string; isKeyMoment: boolean }[];
      }[];
      selectedMomentIds: number[];
      momentKeyOverrides: { momentId: number; isKey: boolean }[];
      selectedRoleIds: number[];
      locationCount: number;
      crewAssignments: { contributorId: number; jobRoleId: number; positionName: string; positionColor?: string }[];
      equipmentSlots: { equipmentId: number; slotLabel: string; slotType: string }[];
    }): Promise<any> => this.post(`/event-types/${eventTypeId}/create-package`, data),
  };

  // ─── Crew System ──────────────────────────────────────────────────

  crew = {
    // Crew members (brand-scoped)
    getByBrand: (brandId: number): Promise<any[]> =>
      this.get(`/crew/brand/${brandId}`),
    getAllContributors: (brandId: number): Promise<any[]> =>
      this.get(`/crew/brand/${brandId}/all-contributors`),
    getByJobRole: (brandId: number, jobRoleId: number): Promise<any[]> =>
      this.get(`/crew/brand/${brandId}/by-role/${jobRoleId}`),
    getWorkload: (brandId: number): Promise<any[]> =>
      this.get(`/crew/brand/${brandId}/workload`),
    getById: (id: number): Promise<any> =>
      this.get(`/crew/${id}`),
    setCrewStatus: (id: number, data: { is_crew: boolean; crew_color?: string | null; bio?: string | null }): Promise<any> =>
      this.patch(`/crew/${id}/crew-status`, data),
    updateProfile: (id: number, data: { crew_color?: string | null; bio?: string | null; default_hourly_rate?: number }): Promise<any> =>
      this.patch(`/crew/${id}/profile`, data),
  };

  // ─── Operators System (Package Crew Slots) ───────────────────────────

  operators = {
    // Package crew slots (assign crew to package event days)
    packageDay: {
      getAll: (packageId: number, dayId?: number): Promise<any[]> =>
        this.get(`/operators/packages/${packageId}${dayId ? `?dayId=${dayId}` : ''}`),
      add: (packageId: number, data: {
        event_day_template_id: number;
        position_name: string;
        position_color?: string | null;
        contributor_id?: number | null;
        job_role_id?: number | null;
        hours?: number;
        notes?: string;
        package_activity_id?: number | null;
      }): Promise<any> =>
        this.post(`/operators/packages/${packageId}`, data),
      update: (slotId: number, data: {
        position_name?: string;
        position_color?: string | null;
        contributor_id?: number | null;
        job_role_id?: number | null;
        hours?: number;
        notes?: string | null;
        order_index?: number;
        package_activity_id?: number | null;
      }): Promise<any> =>
        this.patch(`/operators/packages/day-operators/${slotId}`, data),
      assign: (slotId: number, contributorId: number | null): Promise<any> =>
        this.patch(`/operators/packages/day-operators/${slotId}/assign`, { contributor_id: contributorId }),
      remove: (slotId: number): Promise<void> =>
        this.delete(`/operators/packages/day-operators/${slotId}`),
      setEquipment: (slotId: number, equipment: { equipment_id: number; is_primary: boolean }[]): Promise<any> =>
        this.post(`/operators/packages/day-operators/${slotId}/equipment`, { equipment }),
      // Multi-activity assignments
      assignActivity: (slotId: number, activityId: number): Promise<any> =>
        this.post(`/operators/packages/day-operators/${slotId}/activities/${activityId}`, {}),
      unassignActivity: (slotId: number, activityId: number): Promise<any> =>
        this.delete(`/operators/packages/day-operators/${slotId}/activities/${activityId}`),
    },
  };

  // ─── Schedule System ─────────────────────────────────────────────────

  schedule = {
    // Shared schedule presets (brand-level)
    presets: {
      getAll: (brandId: number): Promise<any[]> =>
        this.get(`/schedule/presets/brand/${brandId}`),
      upsert: (brandId: number, data: { name: string; schedule_data: any[] }): Promise<any> =>
        this.post(`/schedule/presets/brand/${brandId}`, data),
      rename: (brandId: number, presetId: number, name: string): Promise<any> =>
        this.patch(`/schedule/presets/${presetId}/brand/${brandId}/rename`, { name }),
      delete: (brandId: number, presetId: number): Promise<void> =>
        this.delete(`/schedule/presets/${presetId}/brand/${brandId}`),
    },

    // Event Day Templates (brand-level)
    eventDays: {
      getAll: (brandId: number): Promise<any[]> =>
        this.get(`/schedule/event-days/brand/${brandId}`),
      create: (brandId: number, data: { name: string; description?: string; order_index?: number }): Promise<any> =>
        this.post(`/schedule/event-days/brand/${brandId}`, data),
      update: (brandId: number, id: number, data: any): Promise<any> =>
        this.patch(`/schedule/event-days/${id}/brand/${brandId}`, data),
      delete: (brandId: number, id: number): Promise<void> =>
        this.delete(`/schedule/event-days/${id}/brand/${brandId}`),
    },

    // Event Day Activity Presets (per event day template)
    activityPresets: {
      getAll: (eventDayTemplateId: number): Promise<any[]> =>
        this.get(`/schedule/event-days/${eventDayTemplateId}/activity-presets`),
      create: (eventDayTemplateId: number, data: { name: string; color?: string; icon?: string; default_duration_minutes?: number; order_index?: number }): Promise<any> =>
        this.post(`/schedule/event-days/${eventDayTemplateId}/activity-presets`, data),
      bulkCreate: (eventDayTemplateId: number, presets: { name: string; color?: string; order_index?: number }[]): Promise<any> =>
        this.post(`/schedule/event-days/${eventDayTemplateId}/activity-presets/bulk`, { presets }),
      update: (presetId: number, data: any): Promise<any> =>
        this.patch(`/schedule/activity-presets/${presetId}`, data),
      delete: (presetId: number): Promise<void> =>
        this.delete(`/schedule/activity-presets/${presetId}`),
    },

    presetMoments: {
      getAll: (presetId: number): Promise<any[]> =>
        this.get(`/schedule/activity-presets/${presetId}/moments`),
      create: (presetId: number, data: { name: string; duration_seconds?: number; order_index?: number; is_key_moment?: boolean }): Promise<any> =>
        this.post(`/schedule/activity-presets/${presetId}/moments`, data),
      bulkCreate: (presetId: number, moments: { name: string; duration_seconds?: number; order_index?: number; is_key_moment?: boolean }[]): Promise<any> =>
        this.post(`/schedule/activity-presets/${presetId}/moments/bulk`, { moments }),
      update: (momentId: number, data: any): Promise<any> =>
        this.patch(`/schedule/preset-moments/${momentId}`, data),
      delete: (momentId: number): Promise<void> =>
        this.delete(`/schedule/preset-moments/${momentId}`),
    },

    // Film-level schedules
    film: {
      get: (filmId: number): Promise<any> =>
        this.get(`/schedule/films/${filmId}`),
      upsertScene: (filmId: number, data: any): Promise<any> =>
        this.post(`/schedule/films/${filmId}/scenes`, data),
      bulkUpsertScenes: (filmId: number, schedules: any[]): Promise<any[]> =>
        this.post(`/schedule/films/${filmId}/scenes/bulk`, schedules),
      updateScene: (scheduleId: number, data: any): Promise<any> =>
        this.patch(`/schedule/films/scenes/${scheduleId}`, data),
      deleteScene: (scheduleId: number): Promise<void> =>
        this.delete(`/schedule/films/scenes/${scheduleId}`),
    },

    // Package event day assignments (which event days apply to a package)
    packageEventDays: {
      getAll: (packageId: number): Promise<any[]> =>
        this.get(`/schedule/packages/${packageId}/event-days`),
      add: (packageId: number, eventDayTemplateId: number): Promise<any> =>
        this.post(`/schedule/packages/${packageId}/event-days`, { event_day_template_id: eventDayTemplateId }),
      remove: (packageId: number, eventDayTemplateId: number): Promise<void> =>
        this.delete(`/schedule/packages/${packageId}/event-days/${eventDayTemplateId}`),
      set: (packageId: number, eventDayTemplateIds: number[]): Promise<any[]> =>
        this.post(`/schedule/packages/${packageId}/event-days/set`, { event_day_template_ids: eventDayTemplateIds }),
    },

    // Package activities (real-world schedule blocks: Bridal Prep, Ceremony, etc.)
    packageActivities: {
      getAll: (packageId: number): Promise<any[]> =>
        this.get(`/schedule/packages/${packageId}/activities`),
      getByDay: (packageId: number, packageEventDayId: number): Promise<any[]> =>
        this.get(`/schedule/packages/${packageId}/activities/day/${packageEventDayId}`),
      create: (packageId: number, data: {
        package_event_day_id: number;
        name: string;
        description?: string;
        color?: string;
        icon?: string;
        start_time?: string;
        end_time?: string;
        duration_minutes?: number;
        order_index?: number;
      }): Promise<any> =>
        this.post(`/schedule/packages/${packageId}/activities`, data),
      update: (activityId: number, data: any): Promise<any> =>
        this.patch(`/schedule/packages/activities/${activityId}`, data),
      delete: (activityId: number): Promise<void> =>
        this.delete(`/schedule/packages/activities/${activityId}`),
      reorder: (packageId: number, packageEventDayId: number, activityIds: number[]): Promise<any[]> =>
        this.post(`/schedule/packages/${packageId}/activities/day/${packageEventDayId}/reorder`, { activity_ids: activityIds }),
    },

    // Package activity moments (moments within activities)
    packageActivityMoments: {
      getAll: (activityId: number): Promise<any[]> =>
        this.get(`/schedule/packages/activities/${activityId}/moments`),
      create: (activityId: number, data: {
        name: string;
        order_index?: number;
        duration_seconds?: number;
        is_required?: boolean;
        notes?: string;
      }): Promise<any> =>
        this.post(`/schedule/packages/activities/${activityId}/moments`, data),
      bulkCreate: (activityId: number, moments: Array<{
        name: string;
        order_index?: number;
        duration_seconds?: number;
        is_required?: boolean;
        notes?: string;
      }>): Promise<any[]> =>
        this.post(`/schedule/packages/activities/${activityId}/moments/bulk`, { moments }),
      update: (momentId: number, data: {
        name?: string;
        order_index?: number;
        duration_seconds?: number;
        is_required?: boolean;
        notes?: string;
      }): Promise<any> =>
        this.patch(`/schedule/packages/activities/moments/${momentId}`, data),
      delete: (momentId: number): Promise<void> =>
        this.delete(`/schedule/packages/activities/moments/${momentId}`),
      reorder: (activityId: number, momentIds: number[]): Promise<any[]> =>
        this.post(`/schedule/packages/activities/${activityId}/moments/reorder`, { moment_ids: momentIds }),
    },

    // Project activities
    projectActivities: {
      getByDay: (projectId: number, projectEventDayId: number): Promise<any[]> =>
        this.get(`/schedule/projects/${projectId}/activities/${projectEventDayId}`),
      create: (projectId: number, data: any): Promise<any> =>
        this.post(`/schedule/projects/${projectId}/activities`, data),
      update: (activityId: number, data: any): Promise<any> =>
        this.patch(`/schedule/projects/activities/${activityId}`, data),
      delete: (activityId: number): Promise<void> =>
        this.delete(`/schedule/projects/activities/${activityId}`),
    },

    // Package event day subjects (people/objects assigned to event days)
    packageEventDaySubjects: {
      getAll: (packageId: number, eventDayTemplateId?: number): Promise<any[]> =>
        this.get(`/schedule/packages/${packageId}/subjects${eventDayTemplateId ? `?eventDayTemplateId=${eventDayTemplateId}` : ''}`),
      create: (packageId: number, data: {
        event_day_template_id: number;
        name: string;
        package_activity_id?: number;
        role_template_id?: number;
        category?: string;
        notes?: string;
        order_index?: number;
      }): Promise<any> =>
        this.post(`/schedule/packages/${packageId}/subjects`, data),
      update: (subjectId: number, data: any): Promise<any> =>
        this.patch(`/schedule/packages/subjects/${subjectId}`, data),
      delete: (subjectId: number): Promise<void> =>
        this.delete(`/schedule/packages/subjects/${subjectId}`),
      // Multi-activity assignments
      assignActivity: (subjectId: number, activityId: number): Promise<any> =>
        this.post(`/schedule/packages/subjects/${subjectId}/activities/${activityId}`, {}),
      unassignActivity: (subjectId: number, activityId: number): Promise<any> =>
        this.delete(`/schedule/packages/subjects/${subjectId}/activities/${activityId}`),
    },

    // Package event day locations (linked to event days / activities)
    packageEventDayLocations: {
      getAll: (packageId: number, eventDayTemplateId?: number): Promise<any[]> =>
        this.get(`/schedule/packages/${packageId}/locations${eventDayTemplateId ? `?eventDayTemplateId=${eventDayTemplateId}` : ''}`),
      create: (packageId: number, data: {
        event_day_template_id: number;
        location_id: number;
        package_activity_id?: number;
        notes?: string;
        order_index?: number;
      }): Promise<any> =>
        this.post(`/schedule/packages/${packageId}/locations`, data),
      update: (locationId: number, data: any): Promise<any> =>
        this.patch(`/schedule/packages/locations/${locationId}`, data),
      delete: (locationId: number): Promise<void> =>
        this.delete(`/schedule/packages/locations/${locationId}`),
    },

    // Package location slots (abstract numbered locations 1-5)
    packageLocationSlots: {
      getAll: (packageId: number, eventDayTemplateId?: number): Promise<any[]> =>
        this.get(`/schedule/packages/${packageId}/location-slots${eventDayTemplateId ? `?eventDayTemplateId=${eventDayTemplateId}` : ''}`),
      create: (packageId: number, data: {
        event_day_template_id: number;
        location_number?: number;
      }): Promise<any> =>
        this.post(`/schedule/packages/${packageId}/location-slots`, data),
      delete: (slotId: number): Promise<void> =>
        this.delete(`/schedule/packages/location-slots/${slotId}`),
      assignActivity: (slotId: number, activityId: number): Promise<any> =>
        this.post(`/schedule/packages/location-slots/${slotId}/activities/${activityId}`, {}),
      unassignActivity: (slotId: number, activityId: number): Promise<any> =>
        this.delete(`/schedule/packages/location-slots/${slotId}/activities/${activityId}`),
    },

    // Package-film relationships & schedules
    packageFilms: {
      getAll: (packageId: number): Promise<any[]> =>
        this.get(`/schedule/packages/${packageId}/films`),
      create: (packageId: number, data: { film_id: number; order_index?: number; notes?: string }): Promise<any> =>
        this.post(`/schedule/packages/${packageId}/films`, data),
      update: (packageFilmId: number, data: any): Promise<any> =>
        this.patch(`/schedule/packages/films/${packageFilmId}`, data),
      delete: (packageFilmId: number): Promise<void> =>
        this.delete(`/schedule/packages/films/${packageFilmId}`),
      getSchedule: (packageFilmId: number): Promise<any> =>
        this.get(`/schedule/packages/films/${packageFilmId}/schedule`),
      upsertSceneSchedule: (packageFilmId: number, data: any): Promise<any> =>
        this.post(`/schedule/packages/films/${packageFilmId}/scenes`, data),
      bulkUpsertSceneSchedules: (packageFilmId: number, schedules: any[]): Promise<any[]> =>
        this.post(`/schedule/packages/films/${packageFilmId}/scenes/bulk`, schedules),
    },

    // Project event days
    projectEventDays: {
      getAll: (projectId: number): Promise<any[]> =>
        this.get(`/schedule/projects/${projectId}/event-days`),
      create: (projectId: number, data: any): Promise<any> =>
        this.post(`/schedule/projects/${projectId}/event-days`, data),
      update: (eventDayId: number, data: any): Promise<any> =>
        this.patch(`/schedule/projects/event-days/${eventDayId}`, data),
      delete: (eventDayId: number): Promise<void> =>
        this.delete(`/schedule/projects/event-days/${eventDayId}`),
    },

    // Project films & schedules
    projectFilms: {
      getAll: (projectId: number): Promise<any[]> =>
        this.get(`/schedule/projects/${projectId}/films`),
      create: (projectId: number, data: { film_id: number; package_film_id?: number; order_index?: number }): Promise<any> =>
        this.post(`/schedule/projects/${projectId}/films`, data),
      delete: (projectFilmId: number): Promise<void> =>
        this.delete(`/schedule/projects/films/${projectFilmId}`),
      upsertSceneSchedule: (projectFilmId: number, data: any): Promise<any> =>
        this.post(`/schedule/projects/films/${projectFilmId}/scenes`, data),
      bulkUpsertSceneSchedules: (projectFilmId: number, schedules: any[]): Promise<any[]> =>
        this.post(`/schedule/projects/films/${projectFilmId}/scenes/bulk`, schedules),
      /** Initialize a project's schedule from a package (creates event days, project films, and scene schedules) */
      initializeFromPackage: (projectId: number, packageId: number): Promise<any> =>
        this.post(`/schedule/projects/${projectId}/initialize-from-package/${packageId}`, {}),
    },

    // ─── Inquiry Schedule CRUD ───────────────────────────────────────────
    // Inquiry-owned instance data (mirrors project CRUD but with inquiry owner)

    inquiryEventDays: {
      getAll: (inquiryId: number): Promise<any[]> =>
        this.get(`/schedule/inquiries/${inquiryId}/event-days`),
      create: (inquiryId: number, data: any): Promise<any> =>
        this.post(`/schedule/inquiries/${inquiryId}/event-days`, data),
      update: (eventDayId: number, data: any): Promise<any> =>
        this.patch(`/schedule/inquiries/event-days/${eventDayId}`, data),
      delete: (eventDayId: number): Promise<void> =>
        this.delete(`/schedule/inquiries/event-days/${eventDayId}`),
    },

    inquiryActivities: {
      getAll: (inquiryId: number): Promise<any[]> =>
        this.get(`/schedule/inquiries/${inquiryId}/activities`),
      getByDay: (inquiryId: number, eventDayId: number): Promise<any[]> =>
        this.get(`/schedule/inquiries/${inquiryId}/activities/${eventDayId}`),
      create: (inquiryId: number, data: any): Promise<any> =>
        this.post(`/schedule/inquiries/${inquiryId}/activities`, data),
      update: (activityId: number, data: any): Promise<any> =>
        this.patch(`/schedule/inquiries/activities/${activityId}`, data),
      delete: (activityId: number): Promise<void> =>
        this.delete(`/schedule/inquiries/activities/${activityId}`),
    },

    inquiryFilms: {
      getAll: (inquiryId: number): Promise<any[]> =>
        this.get(`/schedule/inquiries/${inquiryId}/films`),
      create: (inquiryId: number, data: { film_id: number; package_film_id?: number; order_index?: number }): Promise<any> =>
        this.post(`/schedule/inquiries/${inquiryId}/films`, data),
      // Inquiry/project instance films share the same underlying scene-schedule table and PK routing.
      delete: (filmId: number): Promise<void> =>
        this.delete(`/schedule/projects/films/${filmId}`),
      upsertSceneSchedule: (filmId: number, data: any): Promise<any> =>
        this.post(`/schedule/projects/films/${filmId}/scenes`, data),
      bulkUpsertSceneSchedules: (filmId: number, schedules: any[]): Promise<any[]> =>
        this.post(`/schedule/projects/films/${filmId}/scenes/bulk`, schedules),
    },

    // ─── Instance CRUD (shared — works with both project & inquiry records) ──

    // Activity moments (for project or inquiry activities)
    instanceMoments: {
      getByActivity: (activityId: number): Promise<any[]> =>
        this.get(`/schedule/instance/activities/${activityId}/moments`),
      createForProject: (projectId: number, data: any): Promise<any> =>
        this.post(`/schedule/projects/${projectId}/activity-moments`, data),
      createForInquiry: (inquiryId: number, data: any): Promise<any> =>
        this.post(`/schedule/inquiries/${inquiryId}/activity-moments`, data),
      update: (momentId: number, data: any): Promise<any> =>
        this.patch(`/schedule/instance/moments/${momentId}`, data),
      delete: (momentId: number): Promise<void> =>
        this.delete(`/schedule/instance/moments/${momentId}`),
      reorder: (activityId: number, momentIds: number[]): Promise<any[]> =>
        this.post(`/schedule/instance/activities/${activityId}/moments/reorder`, { moment_ids: momentIds }),
    },

    // Instance event day subjects (project or inquiry)
    instanceSubjects: {
      getForProject: (projectId: number, eventDayId?: number): Promise<any[]> =>
        this.get(`/schedule/projects/${projectId}/subjects${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
      getForInquiry: (inquiryId: number, eventDayId?: number): Promise<any[]> =>
        this.get(`/schedule/inquiries/${inquiryId}/subjects${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
      createForProject: (projectId: number, data: any): Promise<any> =>
        this.post(`/schedule/projects/${projectId}/subjects`, data),
      createForInquiry: (inquiryId: number, data: any): Promise<any> =>
        this.post(`/schedule/inquiries/${inquiryId}/subjects`, data),
      update: (subjectId: number, data: any): Promise<any> =>
        this.patch(`/schedule/instance/subjects/${subjectId}`, data),
      delete: (subjectId: number): Promise<void> =>
        this.delete(`/schedule/instance/subjects/${subjectId}`),
      assignActivity: (subjectId: number, activityId: number): Promise<any> =>
        this.post(`/schedule/instance/subjects/${subjectId}/activities/${activityId}`, {}),
      unassignActivity: (subjectId: number, activityId: number): Promise<any> =>
        this.delete(`/schedule/instance/subjects/${subjectId}/activities/${activityId}`),
    },

    // Instance location slots (project or inquiry)
    instanceLocationSlots: {
      getForProject: (projectId: number, eventDayId?: number): Promise<any[]> =>
        this.get(`/schedule/projects/${projectId}/location-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
      getForInquiry: (inquiryId: number, eventDayId?: number): Promise<any[]> =>
        this.get(`/schedule/inquiries/${inquiryId}/location-slots${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
      createForProject: (projectId: number, data: any): Promise<any> =>
        this.post(`/schedule/projects/${projectId}/location-slots`, data),
      createForInquiry: (inquiryId: number, data: any): Promise<any> =>
        this.post(`/schedule/inquiries/${inquiryId}/location-slots`, data),
      delete: (slotId: number): Promise<void> =>
        this.delete(`/schedule/instance/location-slots/${slotId}`),
      assignActivity: (slotId: number, activityId: number): Promise<any> =>
        this.post(`/schedule/instance/location-slots/${slotId}/activities/${activityId}`, {}),
      unassignActivity: (slotId: number, activityId: number): Promise<any> =>
        this.delete(`/schedule/instance/location-slots/${slotId}/activities/${activityId}`),
    },

    // Instance day operators / crew (project or inquiry)
    instanceOperators: {
      getForProject: (projectId: number, eventDayId?: number): Promise<any[]> =>
        this.get(`/schedule/projects/${projectId}/operators${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
      getForInquiry: (inquiryId: number, eventDayId?: number): Promise<any[]> =>
        this.get(`/schedule/inquiries/${inquiryId}/operators${eventDayId ? `?eventDayId=${eventDayId}` : ''}`),
      createForProject: (projectId: number, data: any): Promise<any> =>
        this.post(`/schedule/projects/${projectId}/operators`, data),
      createForInquiry: (inquiryId: number, data: any): Promise<any> =>
        this.post(`/schedule/inquiries/${inquiryId}/operators`, data),
      update: (operatorId: number, data: any): Promise<any> =>
        this.patch(`/schedule/instance/operators/${operatorId}`, data),
      assignCrew: (operatorId: number, contributorId: number | null): Promise<any> =>
        this.patch(`/schedule/instance/operators/${operatorId}/assign`, { contributor_id: contributorId }),
      delete: (operatorId: number): Promise<void> =>
        this.delete(`/schedule/instance/operators/${operatorId}`),
      setEquipment: (operatorId: number, equipment: { equipment_id: number; is_primary: boolean }[]): Promise<any> =>
        this.post(`/schedule/instance/operators/${operatorId}/equipment`, { equipment }),
      assignActivity: (operatorId: number, activityId: number): Promise<any> =>
        this.post(`/schedule/instance/operators/${operatorId}/activities/${activityId}`, {}),
      unassignActivity: (operatorId: number, activityId: number): Promise<any> =>
        this.delete(`/schedule/instance/operators/${operatorId}/activities/${activityId}`),
    },

    // Enhanced project instance readers (richer includes)
    projectInstanceEventDays: {
      getAll: (projectId: number): Promise<any[]> =>
        this.get(`/schedule/projects/${projectId}/instance-event-days`),
    },
    projectAllActivities: {
      getAll: (projectId: number): Promise<any[]> =>
        this.get(`/schedule/projects/${projectId}/all-activities`),
    },

    // Resolved schedule (inheritance chain merged)
    getResolved: (filmId: number, params?: { packageFilmId?: number; projectFilmId?: number }): Promise<any> => {
      const query = new URLSearchParams();
      if (params?.packageFilmId) query.set('packageFilmId', String(params.packageFilmId));
      if (params?.projectFilmId) query.set('projectFilmId', String(params.projectFilmId));
      const qs = query.toString();
      return this.get(`/schedule/resolved/${filmId}${qs ? `?${qs}` : ''}`);
    },

    // Project package snapshot (read-only cloned schedule data owned by a project)
    projectPackageSnapshot: {
      getSummary: (projectId: number): Promise<any> =>
        this.get(`/projects/${projectId}/package-snapshot`),
      getEventDays: (projectId: number): Promise<any[]> =>
        this.get(`/projects/${projectId}/package-snapshot/event-days`),
      getActivities: (projectId: number): Promise<any[]> =>
        this.get(`/projects/${projectId}/package-snapshot/activities`),
      getOperators: (projectId: number): Promise<any[]> =>
        this.get(`/projects/${projectId}/package-snapshot/operators`),
      getSubjects: (projectId: number): Promise<any[]> =>
        this.get(`/projects/${projectId}/package-snapshot/subjects`),
      getLocations: (projectId: number): Promise<any[]> =>
        this.get(`/projects/${projectId}/package-snapshot/locations`),
      getFilms: (projectId: number): Promise<any[]> =>
        this.get(`/projects/${projectId}/package-snapshot/films`),
      getActivityMoments: (projectId: number, activityId: number): Promise<any[]> =>
        this.get(`/projects/${projectId}/package-snapshot/activities/${activityId}/moments`),
    },

    // Sync from Package — delete + re-clone from source package
    syncFromPackage: {
      /** Sync project schedule from its source package (delete all + re-clone) */
      project: (projectId: number): Promise<any> =>
        this.post(`/projects/${projectId}/schedule/sync-from-package`, {}),
      /** Sync inquiry schedule from its source package (delete all + re-clone) */
      inquiry: (inquiryId: number): Promise<any> =>
        this.post(`/api/inquiries/${inquiryId}/schedule/sync-from-package`, {}),
    },

    // Package Schedule Summary — aggregate counts for a package's schedule
    packageSummary: {
      /** Get summary (counts, event day names) for a package's schedule template */
      get: (packageId: number): Promise<any> =>
        this.get(`/schedule/packages/${packageId}/summary`),
    },

    // Schedule Diff — compare instance schedule against source package
    scheduleDiff: {
      /** Get diff for a project's instance schedule vs its source package */
      project: (projectId: number): Promise<any> =>
        this.get(`/projects/${projectId}/schedule/diff`),
      /** Get diff for an inquiry's instance schedule vs its source package */
      inquiry: (inquiryId: number): Promise<any> =>
        this.get(`/api/inquiries/${inquiryId}/schedule/diff`),
    },
  };

  // Contracts methods (brand-specific, nested under inquiries)
  contracts = {
    getById: (inquiryId: number, contractId: number): Promise<Contract> =>
      this.get(`/api/inquiries/${inquiryId}/contracts/${contractId}`),
    getAllByInquiry: (inquiryId: number): Promise<Contract[]> =>
      this.get(`/api/inquiries/${inquiryId}/contracts`),
    create: (inquiryId: number, data: CreateContractData): Promise<Contract> =>
      this.post(`/api/inquiries/${inquiryId}/contracts`, data),
    update: (inquiryId: number, contractId: number, data: UpdateContractData): Promise<Contract> =>
      this.patch(`/api/inquiries/${inquiryId}/contracts/${contractId}`, data),
    delete: (inquiryId: number, contractId: number): Promise<void> =>
      this.delete(`/api/inquiries/${inquiryId}/contracts/${contractId}`),
  };

  // Invoices methods (brand-specific, nested under inquiries)
  invoices = {
    getById: (inquiryId: number, invoiceId: number): Promise<Invoice> =>
      this.get(`/api/inquiries/${inquiryId}/invoices/${invoiceId}`),
    getAllByInquiry: (inquiryId: number): Promise<Invoice[]> =>
      this.get(`/api/inquiries/${inquiryId}/invoices`),
    create: (inquiryId: number, data: CreateInvoiceData): Promise<Invoice> =>
      this.post(`/api/inquiries/${inquiryId}/invoices`, data),
    update: (inquiryId: number, invoiceId: number, data: UpdateInvoiceData): Promise<Invoice> =>
      this.patch(`/api/inquiries/${inquiryId}/invoices/${invoiceId}`, data),
    delete: (inquiryId: number, invoiceId: number): Promise<void> =>
      this.delete(`/api/inquiries/${inquiryId}/invoices/${invoiceId}`),
  };

  // Estimates methods (brand-specific, nested under inquiries)
  estimates = {
    getById: (inquiryId: number, estimateId: number): Promise<Estimate> =>
      this.get(`/api/inquiries/${inquiryId}/estimates/${estimateId}`),
    getAllByInquiry: (inquiryId: number): Promise<Estimate[]> =>
      this.get(`/api/inquiries/${inquiryId}/estimates`),
    create: (inquiryId: number, data: CreateEstimateData): Promise<Estimate> =>
      this.post(`/api/inquiries/${inquiryId}/estimates`, data),
    update: (inquiryId: number, estimateId: number, data: UpdateEstimateData): Promise<Estimate> =>
      this.patch(`/api/inquiries/${inquiryId}/estimates/${estimateId}`, data),
    delete: (inquiryId: number, estimateId: number): Promise<void> =>
      this.delete(`/api/inquiries/${inquiryId}/estimates/${estimateId}`),
  };

  // Payment Schedule Templates (brand-scoped)
  paymentSchedules = {
    getAll: (brandId: number): Promise<PaymentScheduleTemplate[]> =>
      this.get(`/api/brands/${brandId}/payment-schedules`),
    getDefault: (brandId: number): Promise<PaymentScheduleTemplate | null> =>
      this.get(`/api/brands/${brandId}/payment-schedules/default`),
    getById: (brandId: number, id: number): Promise<PaymentScheduleTemplate> =>
      this.get(`/api/brands/${brandId}/payment-schedules/${id}`),
    create: (brandId: number, data: CreatePaymentScheduleTemplateData): Promise<PaymentScheduleTemplate> =>
      this.post(`/api/brands/${brandId}/payment-schedules`, data),
    update: (brandId: number, id: number, data: UpdatePaymentScheduleTemplateData): Promise<PaymentScheduleTemplate> =>
      this.put(`/api/brands/${brandId}/payment-schedules/${id}`, data),
    delete: (brandId: number, id: number): Promise<{ success: boolean }> =>
      this.delete(`/api/brands/${brandId}/payment-schedules/${id}`),
    // Milestone management per estimate
    getMilestones: (estimateId: number): Promise<EstimatePaymentMilestone[]> =>
      this.get(`/api/estimates/${estimateId}/milestones`),
    applyToEstimate: (estimateId: number, data: ApplyScheduleToEstimateData): Promise<EstimatePaymentMilestone[]> =>
      this.post(`/api/estimates/${estimateId}/apply-schedule`, data),
    updateMilestoneStatus: (milestoneId: number, status: string): Promise<EstimatePaymentMilestone> =>
      this.patch(`/api/estimates/milestones/${milestoneId}/status`, { status }),
  };

  // Quotes methods (brand-specific, nested under inquiries)
  quotes = {
    getById: (inquiryId: number, quoteId: number): Promise<Quote> =>
      this.get(`/api/inquiries/${inquiryId}/quotes/${quoteId}`),
    getAllByInquiry: (inquiryId: number): Promise<Quote[]> =>
      this.get(`/api/inquiries/${inquiryId}/quotes`),
    create: (inquiryId: number, data: CreateQuoteData): Promise<Quote> =>
      this.post(`/api/inquiries/${inquiryId}/quotes`, data),
    update: (inquiryId: number, quoteId: number, data: UpdateQuoteData): Promise<Quote> =>
      this.patch(`/api/inquiries/${inquiryId}/quotes/${quoteId}`, data),
    delete: (inquiryId: number, quoteId: number): Promise<void> =>
      this.delete(`/api/inquiries/${inquiryId}/quotes/${quoteId}`),
  };

  // Activity Logs methods
  activityLogs = {
    create: (data: { inquiry_id: number; description: string; type: string }): Promise<any> =>
      this.post("/activity-logs", data),
    getByInquiry: (inquiryId: number): Promise<any[]> =>
      this.get(`/activity-logs/inquiry/${inquiryId}`),
    logNote: (inquiryId: number, note: string): Promise<any> =>
      this.post("/activity-logs/note", { inquiryId, note }),
  };

  // Coverage methods (brand-agnostic for creation, brand-specific for retrieval)
  coverage = {
    getById: (id: string): Promise<Coverage> =>
      this.get(`/coverage/${id}`),
    getAll: (): Promise<Coverage[]> =>
      this.get("/coverage"),
    create: (data: CreateCoverageDto): Promise<Coverage> =>
      this.post("/coverage", data, { skipBrandContext: true }),
    update: (id: string, data: UpdateCoverageDto): Promise<Coverage> =>
      this.patch(`/coverage/${id}`, data),
    delete: (id: string): Promise<void> =>
      this.delete(`/coverage/${id}`),
  };

  // Coverage Library methods (brand-specific)
  coverageLibrary = {
    getAll: (): Promise<CoverageLibraryItem[]> =>
      this.get("/coverage"),
    getById: (id: string): Promise<CoverageLibraryItem> =>
      this.get(`/coverage/${id}`),
    getByType: (type: 'VIDEO' | 'AUDIO' | 'MUSIC'): Promise<CoverageLibraryItem[]> =>
      this.get(`/coverage?type=${type}`),
  };

  // Locations methods (brand-specific)
  locations = {
    // Locations
    create: (data: CreateLocationRequest): Promise<LocationsLibrary> =>
      this.post("/locations", data),
    getAll: (brandId?: number): Promise<LocationsLibrary[]> => {
      const params = brandId ? `?brandId=${brandId}` : '';
      return this.get(`/locations${params}`);
    },
    getById: (id: number): Promise<LocationsLibrary> =>
      this.get(`/locations/${id}`),
    update: (id: number, data: UpdateLocationRequest): Promise<LocationsLibrary> =>
      this.put(`/locations/${id}`, data),
    delete: (id: number): Promise<LocationsLibrary> =>
      this.delete(`/locations/${id}`),

    // Location Spaces
    createSpace: (data: CreateLocationSpaceRequest): Promise<LocationSpace> =>
      this.post("/locations/spaces", data),
    getSpaces: (locationId: number): Promise<LocationSpace[]> =>
      this.get(`/locations/${locationId}/spaces`),
    getSpaceById: (id: number): Promise<LocationSpace> =>
      this.get(`/locations/spaces/${id}`),
    updateSpace: (id: number, data: UpdateLocationSpaceRequest): Promise<LocationSpace> =>
      this.put(`/locations/spaces/${id}`, data),
    deleteSpace: (id: number): Promise<LocationSpace> =>
      this.delete(`/locations/spaces/${id}`),

    // Floor Plans
    createFloorPlan: (data: CreateFloorPlanRequest): Promise<FloorPlan> =>
      this.post("/locations/floor-plans", data),
    getFloorPlans: (spaceId: number, projectId?: number): Promise<FloorPlan[]> => {
      const params = projectId ? `?projectId=${projectId}` : '';
      return this.get(`/locations/spaces/${spaceId}/floor-plans${params}`);
    },
    getFloorPlanById: (id: number): Promise<FloorPlan> =>
      this.get(`/locations/floor-plans/${id}`),
    updateFloorPlan: (id: number, data: UpdateFloorPlanRequest): Promise<FloorPlan> =>
      this.put(`/locations/floor-plans/${id}`, data),
    deleteFloorPlan: (id: number): Promise<FloorPlan> =>
      this.delete(`/locations/floor-plans/${id}`),
    duplicateFloorPlan: (id: number, projectId?: number): Promise<FloorPlan> => {
      const params = projectId ? `?projectId=${projectId}` : '';
      return this.post(`/locations/floor-plans/${id}/duplicate${params}`);
    },

    // Floor Plan Objects
    createFloorPlanObject: (data: CreateFloorPlanObjectRequest): Promise<FloorPlanObject> =>
      this.post("/locations/floor-plan-objects", data),
    getFloorPlanObjects: (category?: string, brandId?: number): Promise<FloorPlanObject[]> => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (brandId) params.append('brandId', brandId.toString());
      const query = params.toString() ? `?${params.toString()}` : '';
      return this.get(`/locations/floor-plan-objects${query}`);
    },
    getFloorPlanObjectById: (id: number): Promise<FloorPlanObject> =>
      this.get(`/locations/floor-plan-objects/${id}`),
    updateFloorPlanObject: (id: number, data: UpdateFloorPlanObjectRequest): Promise<FloorPlanObject> =>
      this.put(`/locations/floor-plan-objects/${id}`, data),
    deleteFloorPlanObject: (id: number): Promise<FloorPlanObject> =>
      this.delete(`/locations/floor-plan-objects/${id}`),

    // Venue Floor Plans (for overall building/grounds layout)
    updateVenueFloorPlan: (locationId: number, data: UpdateVenueFloorPlanRequest): Promise<LocationsLibrary> =>
      this.patch(`/locations/${locationId}/venue-floor-plan`, data),
    getVenueFloorPlan: (locationId: number): Promise<{
      venue_floor_plan_data: Record<string, unknown> | null;
      venue_floor_plan_version: number;
      venue_floor_plan_updated_at: string | null;
      venue_floor_plan_updated_by: number | null;
    }> =>
      this.get(`/locations/${locationId}/venue-floor-plan`),
    resetVenueFloorPlan: (locationId: number): Promise<LocationsLibrary> =>
      this.delete(`/locations/${locationId}/venue-floor-plan`),

    // Utility endpoints
    getLocationCategories: (): Promise<LocationCategory[]> =>
      this.get("/locations/categories/spaces"),
    getObjectCategories: (): Promise<ObjectCategory[]> =>
      this.get("/locations/categories/objects"),
  };

  // ─── Instance Film Content (project / inquiry copies) ─────────────
  // Mirrors the library scenes/moments/beats APIs but targets the
  // ProjectFilm* instance tables via the /instance-films prefix.
  // ──────────────────────────────────────────────────────────────────

  instanceFilms = {
    /** Deep-clone library film content into instance tables (idempotent). */
    cloneFromLibrary: (projectFilmId: number): Promise<any> =>
      this.post(`/instance-films/${projectFilmId}/clone-from-library`, {}),

    // ── Scenes ──────────────────────────────────────────────────────
    scenes: {
      getAll: (projectFilmId: number): Promise<any[]> =>
        this.get(`/instance-films/${projectFilmId}/scenes`),
      getById: (sceneId: number): Promise<any> =>
        this.get(`/instance-films/scenes/${sceneId}`),
      create: (projectFilmId: number, data: {
        name: string;
        mode?: string;
        order_index?: number;
        duration_seconds?: number;
        source_scene_id?: number;
        scene_template_id?: number;
      }): Promise<any> =>
        this.post(`/instance-films/${projectFilmId}/scenes`, data),
      update: (sceneId: number, data: {
        name?: string;
        order_index?: number;
        duration_seconds?: number;
      }): Promise<any> =>
        this.patch(`/instance-films/scenes/${sceneId}`, data),
      delete: (sceneId: number): Promise<void> =>
        this.delete(`/instance-films/scenes/${sceneId}`),
      reorder: (projectFilmId: number, orderings: Array<{ id: number; order_index: number }>): Promise<any> =>
        this.post(`/instance-films/${projectFilmId}/scenes/reorder`, orderings),

      recordingSetup: {
        get: (sceneId: number): Promise<any> =>
          this.get(`/instance-films/scenes/${sceneId}/recording-setup`),
        upsert: (sceneId: number, data: {
          camera_track_ids?: number[];
          audio_track_ids?: number[];
          graphics_enabled?: boolean;
        }): Promise<any> =>
          this.patch(`/instance-films/scenes/${sceneId}/recording-setup`, data),
        delete: (sceneId: number): Promise<any> =>
          this.delete(`/instance-films/scenes/${sceneId}/recording-setup`),
      },
    },

    // ── Moments ─────────────────────────────────────────────────────
    moments: {
      getByScene: (sceneId: number): Promise<any[]> =>
        this.get(`/instance-films/scenes/${sceneId}/moments`),
      getById: (momentId: number): Promise<any> =>
        this.get(`/instance-films/moments/${momentId}`),
      create: (sceneId: number, data: {
        name: string;
        order_index?: number;
        duration?: number;
      }): Promise<any> =>
        this.post(`/instance-films/scenes/${sceneId}/moments`, data),
      update: (momentId: number, data: {
        name?: string;
        order_index?: number;
        duration?: number;
      }): Promise<any> =>
        this.patch(`/instance-films/moments/${momentId}`, data),
      delete: (momentId: number): Promise<void> =>
        this.delete(`/instance-films/moments/${momentId}`),
      reorder: (sceneId: number, orderings: Array<{ id: number; order_index: number }>): Promise<any> =>
        this.post(`/instance-films/scenes/${sceneId}/moments/reorder`, orderings),

      recordingSetup: {
        get: (momentId: number): Promise<any> =>
          this.get(`/instance-films/moments/${momentId}/recording-setup`),
        upsert: (momentId: number, data: {
          camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>;
          audio_track_ids?: number[];
          graphics_enabled?: boolean;
          graphics_title?: string | null;
        }): Promise<any> =>
          this.patch(`/instance-films/moments/${momentId}/recording-setup`, data),
        delete: (momentId: number): Promise<any> =>
          this.delete(`/instance-films/moments/${momentId}/recording-setup`),
      },
    },

    // ── Beats ───────────────────────────────────────────────────────
    beats: {
      getByScene: (sceneId: number): Promise<any[]> =>
        this.get(`/instance-films/scenes/${sceneId}/beats`),
      getById: (beatId: number): Promise<any> =>
        this.get(`/instance-films/beats/${beatId}`),
      create: (sceneId: number, data: {
        name: string;
        duration_seconds?: number;
        order_index?: number;
        shot_count?: number | null;
      }): Promise<any> =>
        this.post(`/instance-films/scenes/${sceneId}/beats`, data),
      update: (beatId: number, data: {
        name?: string;
        duration_seconds?: number;
        order_index?: number;
        shot_count?: number | null;
      }): Promise<any> =>
        this.patch(`/instance-films/beats/${beatId}`, data),
      delete: (beatId: number): Promise<void> =>
        this.delete(`/instance-films/beats/${beatId}`),

      recordingSetup: {
        get: (beatId: number): Promise<any> =>
          this.get(`/instance-films/beats/${beatId}/recording-setup`),
        upsert: (beatId: number, data: {
          camera_track_ids?: number[];
          audio_track_ids?: number[];
          graphics_enabled?: boolean;
        }): Promise<any> =>
          this.patch(`/instance-films/beats/${beatId}/recording-setup`, data),
        delete: (beatId: number): Promise<any> =>
          this.delete(`/instance-films/beats/${beatId}/recording-setup`),
      },
    },

    // ── Tracks ──────────────────────────────────────────────────────
    tracks: {
      getAll: (projectFilmId: number, activeOnly?: boolean): Promise<any[]> => {
        const params = activeOnly ? '?activeOnly=true' : '';
        return this.get(`/instance-films/${projectFilmId}/tracks${params}`);
      },
      create: (projectFilmId: number, data: {
        name: string;
        type: string;
        order_index?: number;
        is_active?: boolean;
      }): Promise<any> =>
        this.post(`/instance-films/${projectFilmId}/tracks`, data),
      update: (trackId: number, data: {
        name?: string;
        order_index?: number;
        is_active?: boolean;
      }): Promise<any> =>
        this.patch(`/instance-films/tracks/${trackId}`, data),
      delete: (trackId: number): Promise<void> =>
        this.delete(`/instance-films/tracks/${trackId}`),
    },

    // ── Subjects ────────────────────────────────────────────────────
    subjects: {
      getAll: (projectFilmId: number): Promise<any[]> =>
        this.get(`/instance-films/${projectFilmId}/subjects`),
      create: (projectFilmId: number, data: {
        name: string;
        category?: string;
        priority?: string;
      }): Promise<any> =>
        this.post(`/instance-films/${projectFilmId}/subjects`, data),
      update: (subjectId: number, data: {
        name?: string;
        category?: string;
        priority?: string;
      }): Promise<any> =>
        this.patch(`/instance-films/subjects/${subjectId}`, data),
      delete: (subjectId: number): Promise<void> =>
        this.delete(`/instance-films/subjects/${subjectId}`),
    },

    // ── Locations ───────────────────────────────────────────────────
    locations: {
      getAll: (projectFilmId: number): Promise<any[]> =>
        this.get(`/instance-films/${projectFilmId}/locations`),
      create: (projectFilmId: number, data: {
        location_id: number;
        notes?: string;
      }): Promise<any> =>
        this.post(`/instance-films/${projectFilmId}/locations`, data),
      delete: (locationId: number): Promise<void> =>
        this.delete(`/instance-films/locations/${locationId}`),
    },

    // ── Scene Subjects ──────────────────────────────────────────────
    sceneSubjects: {
      getAll: (sceneId: number): Promise<any[]> =>
        this.get(`/instance-films/scenes/${sceneId}/subjects`),
      add: (sceneId: number, data: {
        project_film_subject_id: number;
        priority?: number;
        notes?: string;
      }): Promise<any> =>
        this.post(`/instance-films/scenes/${sceneId}/subjects`, data),
      remove: (id: number): Promise<void> =>
        this.delete(`/instance-films/scene-subjects/${id}`),
    },

    // ── Scene Location ──────────────────────────────────────────────
    sceneLocation: {
      get: (sceneId: number): Promise<any> =>
        this.get(`/instance-films/scenes/${sceneId}/location`),
      set: (sceneId: number, data: { location_id: number }): Promise<any> =>
        this.post(`/instance-films/scenes/${sceneId}/location`, data),
      remove: (sceneId: number): Promise<void> =>
        this.delete(`/instance-films/scenes/${sceneId}/location`),
    },
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
export const contactsService = api.contacts;
export const inquiriesService = api.inquiries;
export const clientsService = api.clients;
export const proposalsService = api.proposals;
export const contractsService = api.contracts;
export const invoicesService = api.invoices;
export const estimatesService = api.estimates;
export const quotesService = api.quotes;
export const activityLogsService = api.activityLogs;
export const rolesService = api.roles;
export const scenesService = api.scenes;
export const momentsService = api.moments;
export const beatsService = api.beats;
export const coverageService = api.coverage;
export const filmsService = api.films;
export const editingStylesService = api.editingStyles;
export const timelineService = api.timeline;
export const taskLibraryService = api.taskLibrary;
export const workflowsService = api.workflows;
export const locationsService = api.locations;

// Export the main instance as default
export default api;
