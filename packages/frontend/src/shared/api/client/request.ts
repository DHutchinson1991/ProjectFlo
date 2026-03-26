import { getAuthToken } from "./token-provider";
import type { ApiClientOptions } from "./types";

const BRAND_STORAGE_KEY = "projectflo_current_brand";

export const getApiBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const getBrandId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BRAND_STORAGE_KEY);
};

export const buildAuthHeaders = (
  includeContentType = true,
  options?: ApiClientOptions,
): Headers => {
  const headers = new Headers();
  if (includeContentType) {
    headers.append("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const brandId = getBrandId();
  if (brandId && !options?.skipBrandContext) {
    headers.append("X-Brand-Context", brandId);
  }

  return headers;
};

export const request = async <T>(
  endpoint: string,
  init: RequestInit = {},
  options?: ApiClientOptions,
): Promise<T> => {
  const baseUrl = getApiBaseUrl();

  const method = (init.method || "GET").toUpperCase();
  const includeContentType = method !== "GET" && method !== "HEAD";
  const headers = buildAuthHeaders(includeContentType, options);

  if (init.headers) {
    const extra = new Headers(init.headers as HeadersInit);
    extra.forEach((value, key) => headers.set(key, value));
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {} as T;
};
