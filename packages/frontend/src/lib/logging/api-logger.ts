/**
 * API Logger
 * Centralized logging for API calls (dev only)
 */

const isDev = process.env.NODE_ENV !== "production";

export interface ApiLogContext {
  id: string;
  method: string;
  url: string;
  startTime: number;
  requestBody?: string;
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const logApiStart = (method: string, url: string, requestBody?: unknown): ApiLogContext | null => {
  if (!isDev || typeof window === "undefined") return null;

  return {
    id: createId(),
    method,
    url,
    startTime: Date.now(),
    requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
  };
};

export const logApiSuccess = async (_context: ApiLogContext | null, _response: Response): Promise<void> => {
  // no-op: dev console removed
};

export const logApiError = async (
  _context: ApiLogContext | null,
  _response: Response | null,
  _error: unknown,
): Promise<void> => {
  // no-op: dev console removed
};
