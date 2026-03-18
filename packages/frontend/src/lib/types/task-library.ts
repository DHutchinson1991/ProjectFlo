/**
 * Task Library Types - ProjectFlo Frontend
 *
 * Types for managing task definitions, effort estimates, and skill requirements
 * organized by project phases.
 */

import { BaseEntity } from "./common";
import { JobRole } from "./job-roles";

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

export enum TriggerType {
    ALWAYS = "always",
    PER_PROJECT = "per_project",
    PER_FILM = "per_film",
    PER_FILM_WITH_MUSIC = "per_film_with_music",
    PER_FILM_WITH_GRAPHICS = "per_film_with_graphics",
    PER_EVENT_DAY = "per_event_day",
    PER_CREW_MEMBER = "per_crew_member",
    PER_LOCATION = "per_location",
    PER_ACTIVITY = "per_activity",
    PER_ACTIVITY_CREW = "per_activity_crew",
    PER_FILM_SCENE = "per_film_scene",
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
    trigger_type: TriggerType;
    due_date_offset_days?: number | null;
    default_job_role_id?: number | null;
    default_job_role?: Pick<JobRole, 'id' | 'name' | 'display_name' | 'category'> | null;
    default_contributor_id?: number | null;
    default_contributor?: { id: number; contact: { first_name: string; last_name: string } } | null;
    skills_needed?: string[];
    benchmarks?: TaskLibraryBenchmark[];
    skill_rates?: TaskLibrarySkillRate[];
    parent_task_id?: number | null;
    is_stage?: boolean;
    stage_color?: string | null;
    children?: TaskLibrary[];
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
    trigger_type?: TriggerType;
    due_date_offset_days?: number | null;
    default_job_role_id?: number;
    default_contributor_id?: number;
    skills_needed?: string[];
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

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
    [TriggerType.ALWAYS]: "Always",
    [TriggerType.PER_PROJECT]: "Per Project",
    [TriggerType.PER_FILM]: "Per Film",
    [TriggerType.PER_FILM_WITH_MUSIC]: "Per Film (Music)",
    [TriggerType.PER_FILM_WITH_GRAPHICS]: "Per Film (Graphics)",
    [TriggerType.PER_EVENT_DAY]: "Per Event Day",
    [TriggerType.PER_CREW_MEMBER]: "Per Crew Member",
    [TriggerType.PER_LOCATION]: "Per Location",
    [TriggerType.PER_ACTIVITY]: "Per Activity",
    [TriggerType.PER_ACTIVITY_CREW]: "Per Activity × Crew",
    [TriggerType.PER_FILM_SCENE]: "Per Film Scene",
};

// Auto-generation preview types
export interface TaskAutoGenerationPreviewTask {
    task_library_id: number;
    name: string;
    phase: ProjectPhase;
    trigger_type: TriggerType;
    effort_hours_each: number;
    multiplier: number;
    total_instances: number;
    total_hours: number;
    role_name?: string | null;
    assigned_to_name?: string | null;
    hourly_rate?: number | null;
    estimated_cost?: number | null;
    film_name?: string | null;
}

export interface TaskAutoGenerationPreview {
    package: { id: number; name: string };
    contentCounts: {
        films: number;
        films_with_music: number;
        films_with_graphics: number;
        event_days: number;
        crew_members: number;
        locations: number;
        activities: number;
        activity_crew_assignments: number;
        film_scenes: number;
    };
    summary: {
        total_library_tasks: number;
        total_generated_tasks: number;
        total_estimated_hours: number;
        total_estimated_cost: number;
    };
    byPhase: Record<string, TaskAutoGenerationPreviewTask[]>;
    tasks: TaskAutoGenerationPreviewTask[];
}

// Project task (created by auto-generation)
export interface ProjectTask {
    id: number;
    project_id: number;
    task_library_id: number | null;
    package_id: number | null;
    name: string;
    description: string | null;
    phase: ProjectPhase;
    trigger_type: TriggerType;
    trigger_context: string | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    status: string;
    due_date: string | null;
    assigned_to_id: number | null;
    assigned_to?: {
        id: number;
        contact?: { first_name: string; last_name: string } | null;
    } | null;
    pricing_type: PricingType;
    fixed_price: number | null;
    hourly_rate: number | null;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ExecuteAutoGenerationResult {
    success: boolean;
    project: { id: number; name: string | null };
    package: { id: number; name: string };
    summary: {
        total_tasks_created: number;
        total_estimated_hours: number;
        phases_covered: number;
        tasks_auto_assigned?: number;
    };
    byPhase: Record<string, ProjectTask[]>;
    tasks: ProjectTask[];
}

export interface ExecuteAutoGenerationDto {
    projectId: number;
    packageId: number;
    brandId: number;
}

// Unified active task (from calendar/active-tasks endpoint)
export interface ActiveTask {
    id: number;
    source: 'inquiry' | 'project';
    inquiry_id: number | null;
    project_id: number | null;
    name: string;
    description: string | null;
    phase: string;
    status: string;
    due_date: string | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    completed_at: string | null;
    context_label: string;
    project_name: string | null;
    event_date: string | null;
    assignee: { id: number; name: string; email: string } | null;
    priority: string | null;
    is_stage: boolean;
    parent_task_id: number | null;
    stage_color: string | null;
    is_auto_only?: boolean;
    children_count?: number;
    children_completed?: number;
}
