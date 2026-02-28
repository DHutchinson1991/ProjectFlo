/**
 * Dev Console Store
 * Lightweight in-memory store for API logs and UI state
 */

export type ApiLogStatusFilter = "all" | "success" | "error";

export interface ApiLogEntry {
  id: string;
  method: string;
  url: string;
  status?: number;
  ok?: boolean;
  durationMs?: number;
  requestBody?: string;
  responseBody?: string;
  error?: string;
  timestamp: string;
}

interface DevConsoleState {
  entries: ApiLogEntry[];
  isOpen: boolean;
  filter: ApiLogStatusFilter;
}

const state: DevConsoleState = {
  entries: [],
  isOpen: false,
  filter: "all",
};

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const devConsoleStore = {
  getState: (): DevConsoleState => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  addEntry: (entry: ApiLogEntry) => {
    state.entries = [entry, ...state.entries].slice(0, 200);
    emit();
  },

  clear: () => {
    state.entries = [];
    emit();
  },

  toggleOpen: () => {
    state.isOpen = !state.isOpen;
    emit();
  },

  setFilter: (filter: ApiLogStatusFilter) => {
    state.filter = filter;
    emit();
  },
};
