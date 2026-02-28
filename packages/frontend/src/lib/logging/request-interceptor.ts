/**
 * Request Interceptor
 * Wraps fetch with API logging hooks
 */

import { logApiError, logApiStart, logApiSuccess } from "./api-logger";

export const createLoggedFetch = (baseFetch: typeof fetch) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method || "GET";
    const url = typeof input === "string" ? input : input.toString();
    const body = init?.body ? init.body : undefined;

    const context = logApiStart(method, url, body);

    try {
      const response = await baseFetch(input, init);
      const clone = response.clone();
      await logApiSuccess(context, clone);
      return response;
    } catch (error) {
      await logApiError(context, null, error);
      throw error;
    }
  };
};
