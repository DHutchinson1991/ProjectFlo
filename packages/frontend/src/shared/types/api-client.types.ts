/**
 * API Client Interface
 * Defines the contract that all API client methods must follow
 */

export interface ApiClientOptions {
  skipBrandContext?: boolean;
  headers?: Record<string, string>;
}

export interface ApiClient {
  get<T = unknown>(url: string, options?: ApiClientOptions): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, options?: ApiClientOptions): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, options?: ApiClientOptions): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, options?: ApiClientOptions): Promise<T>;
  delete<T = unknown>(url: string, options?: ApiClientOptions): Promise<T>;
}

export interface PublicApiClient {
  publicGet<T = unknown>(url: string): Promise<T>;
  publicPost<T = unknown>(url: string, data?: unknown): Promise<T>;
  publicPatch<T = unknown>(url: string, data?: unknown): Promise<T>;
}
