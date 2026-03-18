/**
 * Logging Utilities
 * Small helpers for formatting and safe serialization
 */

export const formatDuration = (ms?: number): string => {
  if (ms === undefined) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const safeStringify = (value: unknown, maxLength: number = 2000): string => {
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length > maxLength) {
      return `${serialized.slice(0, maxLength)}…`;
    }
    return serialized;
  } catch {
    return "[unserializable]";
  }
};
