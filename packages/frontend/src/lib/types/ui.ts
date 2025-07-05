/**
 * UI and component prop types
 */

import { ReactNode } from "react";

// Loading component
export interface LoadingProps {
  variant?: "circular" | "skeleton" | "dots";
  message?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

// Error boundary
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  retry?: () => void;
  className?: string;
}

// Protected route
export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  redirectTo?: string;
  showUnauthorizedPage?: boolean;
  fallback?: ReactNode;
}

// Unauthorized page
export interface UnauthorizedPageProps {
  message?: string;
  showReturnButton?: boolean;
  returnPath?: string;
}

// Layout components
export interface StudioLayoutProps {
  children: ReactNode;
}

// Theme types
export type ThemeMode = "light" | "dark";

export type ThemeContextType = {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
};

// Error info from React
export interface ErrorInfo {
  componentStack?: string | null;
}
