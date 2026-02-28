/**
 * API Logger
 * Centralized logging for API calls (dev only)
 */

import { devConsoleStore, type ApiLogEntry } from "../debug/dev-console-store";
import { safeJsonParse, safeStringify } from "./utils";

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
    requestBody: requestBody ? safeStringify(requestBody) : undefined,
  };
};

export const logApiSuccess = async (context: ApiLogContext | null, response: Response): Promise<void> => {
  if (!context || !isDev || typeof window === "undefined") return;

  const durationMs = Date.now() - context.startTime;
  const responseText = await response.text();
  const responseBody = safeStringify(safeJsonParse(responseText));

  const entry: ApiLogEntry = {
    id: context.id,
    method: context.method,
    url: context.url,
    status: response.status,
    ok: response.ok,
    durationMs,
    requestBody: context.requestBody,
    responseBody,
    timestamp: new Date().toISOString(),
  };

  devConsoleStore.addEntry(entry);
};

export const logApiError = async (
  context: ApiLogContext | null,
  response: Response | null,
  error: unknown,
): Promise<void> => {
  if (!context || !isDev || typeof window === "undefined") return;

  const durationMs = Date.now() - context.startTime;
  let responseBody: string | undefined;

  if (response) {
    const responseText = await response.text();
    responseBody = safeStringify(safeJsonParse(responseText));
  }

  const entry: ApiLogEntry = {
    id: context.id,
    method: context.method,
    url: context.url,
    status: response?.status,
    ok: false,
    durationMs,
    requestBody: context.requestBody,
    responseBody,
    error: error instanceof Error ? error.message : "Unknown error",
    timestamp: new Date().toISOString(),
  };

  devConsoleStore.addEntry(entry);
};
