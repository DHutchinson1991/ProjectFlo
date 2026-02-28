/**
 * API Client Interface
 * Defines the contract that all API client methods must follow
 */

export interface ApiClientOptions {
  skipBrandContext?: boolean;
  headers?: Record<string, string>;
}

export interface ApiClient {
  get<T = any>(url: string, options?: ApiClientOptions): Promise<T>;
  post<T = any>(url: string, data?: any, options?: ApiClientOptions): Promise<T>;
  patch<T = any>(url: string, data?: any, options?: ApiClientOptions): Promise<T>;
  delete<T = any>(url: string, options?: ApiClientOptions): Promise<T>;
}
