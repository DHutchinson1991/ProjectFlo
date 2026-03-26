/**
 * Auth token provider — decouples the shared HTTP client from lib/api.ts.
 *
 * AuthProvider wires this up at boot via setTokenProvider().
 */

let _getToken: () => string | null = () => null;

export function setTokenProvider(fn: () => string | null) {
  _getToken = fn;
}

export function getAuthToken(): string | null {
  return _getToken();
}
