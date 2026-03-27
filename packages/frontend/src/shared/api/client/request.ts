import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  notifyUnauthorized,
  setAuthToken,
  setRefreshToken,
} from "./token-provider";
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
  if (token && !options?.skipAuth) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const brandId = getBrandId();
  if (brandId && !options?.skipBrandContext) {
    headers.append("X-Brand-Context", brandId);
  }

  return headers;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }

    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return {} as T;
};

const refreshAccessToken = async (baseUrl: string): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
    };

    setAuthToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  }
};

export const request = async <T>(
  endpoint: string,
  init: RequestInit = {},
  options?: ApiClientOptions,
  hasRetried = false,
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

  if (response.status === 401 && !options?.skipAuth && !hasRetried) {
    const refreshed = await refreshAccessToken(baseUrl);
    if (refreshed) {
      return request<T>(endpoint, init, options, true);
    }

    clearAuthTokens();
    notifyUnauthorized();
  }

  return parseResponse<T>(response);
};

export const requestExternal = async <T>(
  url: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, init);
  return parseResponse<T>(response);
};

export const uploadFile = async <T = { url: string; filename: string }>(
  file: File,
  endpoint = "/upload",
  options?: ApiClientOptions,
): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const headers = buildAuthHeaders(false, options);
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  return parseResponse<T>(response);
};
