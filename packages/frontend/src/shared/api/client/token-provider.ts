const AUTH_TOKEN_STORAGE_KEY = "authToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

let authToken: string | null = null;
let refreshToken: string | null = null;
let unauthorizedCallback: (() => void) | undefined;

function readStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(key);
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    localStorage.setItem(key, value);
    return;
  }

  localStorage.removeItem(key);
}

export function setAuthToken(token: string | null) {
  authToken = token;
  writeStorage(AUTH_TOKEN_STORAGE_KEY, token);
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
  writeStorage(REFRESH_TOKEN_STORAGE_KEY, token);
}

export function getAuthToken(): string | null {
  if (authToken === null) {
    authToken = readStorage(AUTH_TOKEN_STORAGE_KEY);
  }

  return authToken;
}

export function getRefreshToken(): string | null {
  if (refreshToken === null) {
    refreshToken = readStorage(REFRESH_TOKEN_STORAGE_KEY);
  }

  return refreshToken;
}

export function refreshAuthStateFromStorage(): void {
  authToken = readStorage(AUTH_TOKEN_STORAGE_KEY);
  refreshToken = readStorage(REFRESH_TOKEN_STORAGE_KEY);
}

export function clearAuthTokens(): void {
  setAuthToken(null);
  setRefreshToken(null);
}

export function setUnauthorizedCallback(callback: () => void): void {
  unauthorizedCallback = callback;
}

export function notifyUnauthorized(): void {
  unauthorizedCallback?.();
}
