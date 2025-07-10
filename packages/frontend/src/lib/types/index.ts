/**
 * Types Index - Centralized Type Exports
 *
 * This file serves as the main entry point for all type definitions
 * organized by domain and usage pattern.
 */

// ============================================================================
// DOMAIN MODELS (Primary interfaces for components and business logic)
// ============================================================================

// User domain types
export * from "./domains/users";

// Brand and organization types
export * from "./brand";

// Authentication and authorization types
export type { LoginCredentials, AuthResponse, UserProfile, AuthContextType, AuthProviderProps } from "./auth";
export type { Role as AuthRole } from "./auth";

// Film and media production types
export * from "./media";

// Timeline and editing workflow types
export * from "./timeline";

// Task library and project management types
export * from "./task-library";

// UI and component prop types
export * from "./ui";

// Common utility types and generic interfaces
export * from "./common";

// ============================================================================
// API INTEGRATION (Backend communication types and utilities)
// ============================================================================

// API response types (backend structure)
export * from "./api/users";

// API mappers (transform backend to frontend)
export * from "./mappers/users";
