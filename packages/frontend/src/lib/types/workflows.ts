/**
 * Workflow Management Types - ProjectFlo Frontend
 *
 * Types for workflow templates, template tasks (preset selections from task library),
 * and workflow-related query/mutation DTOs.
 */

import { BaseEntity } from "./common";

// ========================
// WORKFLOW TEMPLATE
// ========================

export interface WorkflowTemplate extends BaseEntity {
    brand_id: number | null;
    name: string;
    description?: string;
    is_default: boolean;
    is_active: boolean;
    brand?: {
        id: number;
        name: string;
    };
    workflow_template_tasks?: WorkflowTemplateTask[];
    _count?: {
        projects: number;
        service_packages: number;
        workflow_template_tasks: number;
    };
}

// ========================
// WORKFLOW TEMPLATE TASK (join table)
// ========================

export interface WorkflowTemplateTask extends BaseEntity {
    workflow_template_id: number;
    task_library_id: number;
    phase: string;
    override_hours: number | null;
    override_assignee_role: string | null;
    order_index: number;
    is_required: boolean;
    is_active: boolean;
    task_library?: {
        id: number;
        name: string;
        description?: string;
        phase: string;
        effort_hours?: number;
        pricing_type?: string;
        hourly_rate?: number;
        brand?: {
            id: number;
            name: string;
        };
    };
}

// ========================
// TEMPLATE TASKS RESPONSE
// ========================

export interface TemplateTasksResponse {
    template: {
        id: number;
        name: string;
        description?: string;
        is_default: boolean;
        is_active: boolean;
    };
    tasks: WorkflowTemplateTask[];
    groupedByPhase: Record<string, WorkflowTemplateTask[]>;
    totalTasks: number;
}

// ========================
// TOGGLE RESPONSE
// ========================

export interface ToggleTaskResponse {
    action: 'added' | 'removed';
    task_library_id: number;
    template_task?: WorkflowTemplateTask;
}

// ========================
// PREVIEW
// ========================

export interface WorkflowTaskPreview {
    template: {
        id: number;
        name: string;
        description?: string;
        is_default: boolean;
        is_active?: boolean;
    };
    phases: {
        phase: string;
        tasks: {
            task_library_id: number;
            name: string;
            description?: string;
            effort_hours?: number;
            pricing_type?: string;
            hourly_rate?: number;
            is_required: boolean;
            override_assignee_role?: string;
        }[];
    }[];
    totalTasks: number;
    totalHours: number;
}

// ========================
// API REQUEST DTOs
// ========================

export interface CreateWorkflowTemplateDto {
    brand_id: number;
    name: string;
    description?: string;
    is_default?: boolean;
}

export interface UpdateWorkflowTemplateDto {
    name?: string;
    description?: string;
    is_default?: boolean;
    is_active?: boolean;
}

export interface AddTaskToTemplateDto {
    task_library_id: number;
    phase?: string;
    override_hours?: number;
    override_assignee_role?: string;
    order_index?: number;
    is_required?: boolean;
}

export interface SyncTemplateTasksDto {
    tasks: AddTaskToTemplateDto[];
}

export interface UpdateTemplateTaskDto {
    override_hours?: number | null;
    override_assignee_role?: string | null;
    order_index?: number;
    is_required?: boolean;
    phase?: string;
}

// Keep legacy types for backward compat (unused but prevents import errors)
export interface WorkflowStage extends BaseEntity {
    workflow_template_id: number;
    name: string;
    description?: string;
    order_index: number;
    is_active: boolean;
    task_generation_rules?: TaskGenerationRule[];
}

export interface TaskGenerationRule extends BaseEntity {
    workflow_stage_id: number;
    task_template_id: number;
    scene_type?: string;
    coverage_id?: number;
    is_required: boolean;
    auto_assign_to_role?: string;
    conditions?: Record<string, unknown>;
    task_template?: {
        id: number;
        name: string;
        phase?: string;
        effort_hours?: number;
        pricing_type?: string;
    };
}

export interface CreateWorkflowStageDto {
    name: string;
    description?: string;
    order_index: number;
}

export interface UpdateWorkflowStageDto {
    name?: string;
    description?: string;
    is_active?: boolean;
}

export interface ReorderStagesDto {
    stages: { id: number; order_index: number }[];
}

export interface CreateTaskGenerationRuleDto {
    task_template_id: number;
    scene_type?: string;
    coverage_id?: number;
    is_required?: boolean;
    auto_assign_to_role?: string;
    conditions?: Record<string, unknown>;
}

export interface UpdateTaskGenerationRuleDto {
    is_required?: boolean;
    auto_assign_to_role?: string;
    conditions?: Record<string, unknown>;
}

// ========================
// QUERY PARAMS
// ========================

export interface WorkflowQueryParams {
    brandId?: number;
    is_active?: boolean;
    is_default?: boolean;
}
