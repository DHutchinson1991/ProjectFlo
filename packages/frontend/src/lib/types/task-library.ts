/**
 * Task Library Types - ProjectFlo Frontend
 *
 * Types for managing task definitions, effort estimates, and skill requirements
 * organized by project phases.
 */

import { BaseEntity } from "./common";

// Enums that match backend
export enum ProjectPhase {
    LEAD = "Lead",
    INQUIRY = "Inquiry",
    BOOKING = "Booking",
    CREATIVE_DEVELOPMENT = "Creative_Development",
    PRE_PRODUCTION = "Pre_Production",
    PRODUCTION = "Production",
    POST_PRODUCTION = "Post_Production",
    DELIVERY = "Delivery",
}

export enum PricingType {
    HOURLY = "Hourly",
    FIXED = "Fixed",
}

// Main task library interface
export interface TaskLibrary extends BaseEntity {
    name: string;
    description?: string;
    effort_hours: number;
    recorded_hours: number;
    phase: ProjectPhase;
    pricing_type: PricingType;
    fixed_price?: number;
    hourly_rate?: number;
    base_price?: number;
    is_active: boolean;
    brand_id: number;
    order_index: number;
    benchmarks?: TaskLibraryBenchmark[];
    skill_rates?: TaskLibrarySkillRate[];
}

// Task library benchmark interface
export interface TaskLibraryBenchmark extends BaseEntity {
    task_library_id: number;
    contributor_id: number;
    benchmark_hours: number;
    benchmark_price?: number;
    notes?: string;
    is_active: boolean;
    task_library?: TaskLibrary;
    contributor?: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
    };
}

// Task library skill rate interface
export interface TaskLibrarySkillRate extends BaseEntity {
    task_library_id: number;
    skill_name: string;
    rate_per_hour: number;
    is_active: boolean;
    task_library?: TaskLibrary;
}

// API request types
export interface CreateTaskLibraryDto {
    name: string;
    description?: string;
    effort_hours: number;
    phase: ProjectPhase;
    pricing_type: PricingType;
    fixed_price?: number;
    hourly_rate?: number;
    base_price?: number;
    is_active: boolean;
    brand_id: number;
}

export interface UpdateTaskLibraryDto extends Partial<CreateTaskLibraryDto> {
    recorded_hours?: number;
}

export interface CreateTaskLibraryBenchmarkDto {
    task_library_id: number;
    contributor_id: number;
    benchmark_hours: number;
    benchmark_price?: number;
    notes?: string;
    is_active: boolean;
}

export type UpdateTaskLibraryBenchmarkDto = Partial<CreateTaskLibraryBenchmarkDto>;

export interface CreateTaskLibrarySkillRateDto {
    task_library_id: number;
    skill_name: string;
    rate_per_hour: number;
    is_active: boolean;
}

export type UpdateTaskLibrarySkillRateDto = Partial<CreateTaskLibrarySkillRateDto>;

// Batch update types
export interface TaskOrderUpdateDto {
    id: number;
    order_index: number;
}

export interface BatchUpdateTaskOrderDto {
    tasks: TaskOrderUpdateDto[];
    phase: ProjectPhase;
    brand_id: number;
}

// Query types
export interface TaskLibraryQuery {
    phase?: ProjectPhase;
    is_active?: boolean;
    page?: number;
    limit?: number;
    search?: string;
}

// Response types grouped by phase
export interface TaskLibraryByPhase {
    [key: string]: TaskLibrary[];
}

// Form types
export interface TaskLibraryFormData {
    name: string;
    description: string;
    effort_hours: number;
    phase: ProjectPhase;
    pricing_type: PricingType;
    base_price: number;
    is_active: boolean;
}

// UI types
export interface TaskLibraryPhaseGroup {
    phase: ProjectPhase;
    label: string;
    tasks: TaskLibrary[];
    expanded: boolean;
}

// Helper constants
export const PHASE_LABELS: Record<ProjectPhase, string> = {
    [ProjectPhase.LEAD]: "Lead",
    [ProjectPhase.INQUIRY]: "Inquiry",
    [ProjectPhase.BOOKING]: "Booking",
    [ProjectPhase.CREATIVE_DEVELOPMENT]: "Creative Development",
    [ProjectPhase.PRE_PRODUCTION]: "Pre-Production",
    [ProjectPhase.PRODUCTION]: "Production",
    [ProjectPhase.POST_PRODUCTION]: "Post-Production",
    [ProjectPhase.DELIVERY]: "Delivery",
};

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
    [PricingType.HOURLY]: "Hourly",
    [PricingType.FIXED]: "Fixed Price",
};
