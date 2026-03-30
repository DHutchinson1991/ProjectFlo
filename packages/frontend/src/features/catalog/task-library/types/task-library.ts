/**
 * Task Library Types — Canonical source.
 */

import { JobRole } from './job-roles';

// Shared base entity (inlined from deleted common.ts)
interface BaseEntity {
    id: number;
    created_at: string;
    updated_at: string;
}

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
    PER_CREW = "per_crew",
    PER_LOCATION = "per_location",
    PER_ACTIVITY = "per_activity",
    PER_ACTIVITY_CREW = "per_activity_crew",
    PER_FILM_SCENE = "per_film_scene",
}

export interface TaskLibrary extends BaseEntity {
    name: string;
    description?: string;
    workflow_description?: string | null;
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
    due_date_offset_reference?: string | null;
    default_job_role_id?: number | null;
    default_job_role?: Pick<JobRole, 'id' | 'name' | 'display_name' | 'category'> | null;
    default_crew_id?: number | null;
    default_crew?: { id: number; contact: { first_name: string; last_name: string } } | null;
    skills_needed?: string[];
    benchmarks?: TaskLibraryBenchmark[];
    skill_rates?: TaskLibrarySkillRate[];
    parent_task_id?: number | null;
    is_task_group?: boolean;
    is_on_site?: boolean;
    children?: TaskLibrary[];
    task_library_subtask_templates?: TaskLibrarySubtaskTemplate[];
}

export interface TaskLibrarySubtaskTemplate {
    id: number;
    task_library_id: number;
    subtask_key: string;
    name: string;
    description?: string | null;
    order_index: number;
    is_auto_only: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateSubtaskTemplateDto {
    subtask_key: string;
    name: string;
    description?: string;
    is_auto_only?: boolean;
    order_index?: number;
}

export interface UpdateSubtaskTemplateDto {
    name?: string;
    description?: string | null;
    is_auto_only?: boolean;
    order_index?: number;
}

export interface TaskLibraryBenchmark extends BaseEntity {
    task_library_id: number;
    crew_id: number;
    benchmark_hours: number;
    benchmark_price?: number;
    notes?: string;
    is_active: boolean;
    task_library?: TaskLibrary;
    crew?: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
    };
}

export interface TaskLibrarySkillRate extends BaseEntity {
    task_library_id: number;
    skill_name: string;
    rate_per_hour: number;
    is_active: boolean;
    task_library?: TaskLibrary;
}

export interface CreateTaskLibraryDto {
    name: string;
    description?: string;
    workflow_description?: string;
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
    default_crew_id?: number;
    skills_needed?: string[];
    is_on_site?: boolean;
}

export interface UpdateTaskLibraryDto extends Partial<CreateTaskLibraryDto> {
    recorded_hours?: number;
}

export interface CreateTaskLibraryBenchmarkDto {
    task_library_id: number;
    crew_id: number;
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

export interface TaskOrderUpdateDto {
    id: number;
    order_index: number;
}

export interface BatchUpdateTaskOrderDto {
    tasks: TaskOrderUpdateDto[];
    phase: ProjectPhase;
    brand_id: number;
}

export interface TaskLibraryQuery {
    phase?: ProjectPhase;
    is_active?: boolean;
    page?: number;
    limit?: number;
    search?: string;
}

export interface TaskLibraryByPhase {
    [key: string]: TaskLibrary[];
}

export interface TaskLibraryFormData {
    name: string;
    description: string;
    effort_hours: number;
    phase: ProjectPhase;
    pricing_type: PricingType;
    base_price: number;
    is_active: boolean;
}

export interface TaskLibraryPhaseGroup {
    phase: ProjectPhase;
    label: string;
    tasks: TaskLibrary[];
    expanded: boolean;
}

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
    [TriggerType.PER_PROJECT]: "Project",
    [TriggerType.PER_FILM]: "Film",
    [TriggerType.PER_FILM_WITH_MUSIC]: "Film + Music",
    [TriggerType.PER_FILM_WITH_GRAPHICS]: "Film + Graphics",
    [TriggerType.PER_EVENT_DAY]: "Event Day",
    [TriggerType.PER_CREW]: "Crew",
    [TriggerType.PER_LOCATION]: "Location",
    [TriggerType.PER_ACTIVITY]: "Activity",
    [TriggerType.PER_ACTIVITY_CREW]: "Activity × Crew",
    [TriggerType.PER_FILM_SCENE]: "Film Scene",
};

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
    due_date_offset_days?: number | null;
    is_on_site?: boolean | null;
    /** Deduplication key for on-site hours (activityName for per_activity_crew tasks). */
    activity_key?: string | null;
    /** On-site billing band label (e.g. 'Half Day', 'Day', 'Day + OT'). */
    onsite_band?: string | null;
}

export interface TaskAutoGenerationPreview {
    package: { id: number; name: string };
    contentCounts: {
        films: number;
        films_with_music: number;
        films_with_graphics: number;
        event_days: number;
        crews: number;
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

export interface ActiveTask {
    id: number;
    source: 'inquiry' | 'project';
    task_kind?: 'task' | 'subtask';
    subtask_key?: string | null;
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
    is_task_group: boolean;
    parent_task_id: number | null;
    subtask_parent_id?: number | null;
    is_auto_only?: boolean;
    children_count?: number;
    children_completed?: number;
    job_role?: { id: number; name: string; display_name?: string | null } | null;
}
