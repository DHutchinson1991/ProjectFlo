import { request } from './request';
import type { ApiClient, ApiClientOptions } from './types';

function buildRequestInit(method: string, data?: unknown, options?: ApiClientOptions): RequestInit {
  return {
    method,
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    ...(options?.headers ? { headers: options.headers } : {}),
  };
}

export const apiClient: ApiClient = {
  get: <T>(url: string, options?: ApiClientOptions) =>
    request<T>(url, buildRequestInit('GET', undefined, options), options),
  post: <T>(url: string, data?: unknown, options?: ApiClientOptions) =>
    request<T>(url, buildRequestInit('POST', data, options), options),
  patch: <T>(url: string, data?: unknown, options?: ApiClientOptions) =>
    request<T>(url, buildRequestInit('PATCH', data, options), options),
  put: <T>(url: string, data?: unknown, options?: ApiClientOptions) =>
    request<T>(url, buildRequestInit('PUT', data, options), options),
  delete: <T>(url: string, options?: ApiClientOptions) =>
    request<T>(url, buildRequestInit('DELETE', undefined, options), options),
};