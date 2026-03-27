/**
 * Task Library Types — Canonical feature-owned barrel.
 */
export {
    ProjectPhase,
    PricingType,
    TriggerType,
    PHASE_LABELS,
    PRICING_TYPE_LABELS,
    TRIGGER_TYPE_LABELS,
} from './task-library';

export type {
    TaskLibrary,
    TaskLibraryBenchmark,
    TaskLibrarySkillRate,
    TaskLibrarySubtaskTemplate,
    TaskLibraryByPhase,
    TaskLibraryPhaseGroup,
    TaskAutoGenerationPreview,
    TaskAutoGenerationPreviewTask,
    CreateTaskLibraryDto,
    UpdateTaskLibraryDto,
    CreateTaskLibraryBenchmarkDto,
    UpdateTaskLibraryBenchmarkDto,
    CreateTaskLibrarySkillRateDto,
    UpdateTaskLibrarySkillRateDto,
    TaskOrderUpdateDto,
    BatchUpdateTaskOrderDto,
    TaskLibraryQuery,
    TaskLibraryFormData,
    ProjectTask,
    ExecuteAutoGenerationDto,
    ExecuteAutoGenerationResult,
    ActiveTask,
} from './task-library';

export type { JobRole, CrewMemberJobRole, CreateJobRoleData, UpdateJobRoleData } from './job-roles';

export type {
    SkillRoleMapping,
    ResolvedRoleResult,
    SkillRoleMappingSummary,
    AvailableSkill,
    CreateSkillRoleMappingData,
    UpdateSkillRoleMappingData,
    BulkCreateSkillRoleMappingData,
    ResolveSkillRoleData,
} from './skill-role-mappings';

// Re-export Contributor for task-library consumers (canonical source: lib/types/domains/users)
export type { CrewMember } from '@/shared/types/users';
