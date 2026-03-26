import { authService } from "@/lib/api";

const BRAND_STORAGE_KEY = "projectflo_current_brand";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const getBrandId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BRAND_STORAGE_KEY);
};

export const buildAuthHeaders = (includeContentType = true) => {
  const headers = new Headers();
  if (includeContentType) {
    headers.append("Content-Type", "application/json");
  }

  const token = authService.getToken();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const brandId = getBrandId();
  if (brandId) {
    headers.append("X-Brand-Context", brandId);
  }

  return headers;
};

export const withBrandQuery = (endpoint: string): string => {
  const brandId = getBrandId();
  if (!brandId || endpoint.includes("brandId=")) return endpoint;
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}brandId=${brandId}`;
};

export const request = async <T>(
  endpoint: string,
  init: RequestInit = {},
  options: { includeBrandQuery?: boolean } = {},
): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const url = options.includeBrandQuery === false ? endpoint : withBrandQuery(endpoint);

  const method = (init.method || "GET").toUpperCase();
  const includeContentType = method !== "GET" && method !== "HEAD";
  const headers = buildAuthHeaders(includeContentType);

  if (init.headers) {
    const extra = new Headers(init.headers as HeadersInit);
    extra.forEach((value, key) => headers.set(key, value));
  }

  const response = await fetch(`${baseUrl}${url}`, {
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
