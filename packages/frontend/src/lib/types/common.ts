/**
 * Common utility types and generic interfaces
 */

// API response wrapper
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Common entity fields
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface BaseEntityWithSoftDelete extends BaseEntity {
  deleted_at?: string;
  is_active: boolean;
}

// Form types
export interface FormError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: FormError[];
  isSubmitting: boolean;
  isValid: boolean;
  touched: Record<keyof T, boolean>;
}

// Search and filter
export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Generic API error
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

// Select option type
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

// File upload
export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// Generic CRUD operations
export type CreateDto<T> = Omit<T, "id" | "created_at" | "updated_at">;
export type UpdateDto<T> = Partial<CreateDto<T>>;

// Environment configuration
export interface AppConfig {
  apiUrl: string;
  environment: "development" | "staging" | "production";
  version: string;
  features: {
    enableAnalytics: boolean;
    enableDevtools: boolean;
    enableTestMode: boolean;
  };
}
