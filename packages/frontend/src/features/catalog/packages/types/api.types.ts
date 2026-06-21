import type { ServicePackage } from './service-package.types';

export interface ServicePackagePriceEstimate {
    packageId: number;
    packageName: string;
    currency: string;
    equipment: {
        cameras: number;
        audio: number;
        totalItems: number;
        dailyCost: number;
        items: Array<{ name: string; category: string; dailyRate: number }>;
    };
    crew: {
        crewSlotCount: number;
        totalHours: number;
        totalCost: number;
        crewSlots: Array<{ position: string; hours: number; rate: number; cost: number }>;
    };
    tasks: {
        totalTasks: number;
        totalHours: number;
        totalCost: number;
        byPhase: Record<string, { taskCount: number; hours: number; cost: number }>;
    };
    summary: {
        equipmentCost: number;
        crewCost: number;
        subtotal: number;
    };
    tax: {
        rate: number;
        amount: number;
        totalWithTax: number;
    };
}

export interface ServicePackageVersion {
    id: number;
    [key: string]: unknown;
}

export type PackageAiRunStatus = 'running' | 'completed' | 'failed';
export type PackageAiRunSource = 'catalog' | 'inquiry';

export interface PackageAiPlannerSummaryStep {
    step: string;
    label: string;
    status: string;
    stepIndex: number;
    activityName?: string;
    error?: string;
    data?: Record<string, unknown>;
}

export interface PackageAiPlannerSummary {
    finalStatus?: string;
    errors?: string[];
    steps?: PackageAiPlannerSummaryStep[];
}

export type PackageAiRunTranscriptSectionKind =
    | 'context'
    | 'input'
    | 'llm-call'
    | 'llm-prompt'
    | 'llm-response'
    | 'output'
    | 'other';

export interface PackageAiRunTranscriptMessage {
    timestamp: string | null;
    level: string;
    message: string;
}

export interface PackageAiRunTranscriptSection {
    title: string;
    kind: PackageAiRunTranscriptSectionKind;
    content: string;
    json: unknown | null;
}

export interface PackageAiRunTranscriptStep {
    stepNumber: number;
    label: string;
    skillKey: string | null;
    startedAt: string | null;
    sections: PackageAiRunTranscriptSection[];
    messages: PackageAiRunTranscriptMessage[];
}

export interface PackageAiRunSummary {
    runId: string;
    status: PackageAiRunStatus;
    source: PackageAiRunSource;
    route: string;
    startedAt: string;
    completedAt: string | null;
    packageId: number;
    packageName: string | null;
    plannerStatus: string | null;
    completedSteps: number;
    totalSteps: number;
    error: string | null;
}

export interface PackageAiRunDetail extends PackageAiRunSummary {
    masterLog: string | null;
    transcriptSteps: PackageAiRunTranscriptStep[];
    request: unknown | null;
    builderSummary: unknown | null;
    plannerSummary: PackageAiPlannerSummary | null;
}

export interface ServicePackageCategory {
    id: number;
    name: string;
    description?: string;
    order_index?: number;
}

export interface CreatePackageFromBuilderData {
    packageTemplateId: number;
    selectedActivityPresetIds: number[];
    crewCount: number;
    cameraCount?: number;
    filmPreferences: Array<{ type: string; activityPresetId?: number; activityName?: string }>;
    inquiryId?: number;
    clientName?: string;
    /** Optional published DayBlueprintVersion to consume — matches backend DTO. */
    sourceDayBlueprintVersionId?: number;
    selectedDayBlueprintActivityIds?: number[];
    blueprintDayMappings?: Array<{ blueprintDayId: number; eventTypeDayLinkId: number }>;
}

export interface CreatePackageFromTemplateData {
    packageName: string;
    packageDescription?: string;
    selectedDayIds: number[];
    selectedActivities: Array<{ presetId: number; startTime?: string; durationMinutes?: number }>;
    customActivities: Array<{
        name: string;
        dayTemplateId: number;
        startTime?: string;
        durationMinutes?: number;
        moments: Array<{ name: string; isKeyMoment: boolean }>;
    }>;
    selectedMomentIds: number[];
    momentKeyOverrides: Array<{ momentId: number; isKey: boolean }>;
    selectedRoleIds: number[];
    standardGuestCount?: number;
    locationCount: number;
    roleSlots: Array<{ jobRoleId: number; quantity: number }>;
    crewAssignments: Array<{ crewId: number; jobRoleId: number; label?: string }>;
    equipmentSlots: Array<{
        equipmentId: number;
        slotLabel: string;
        slotType: string;
        crewId?: number;
        jobRoleId?: number;
    }>;
    /**
     * Optional: published DayBlueprintVersion whose day/activity/moment
     * structure should be consumed into the created package after the
     * preset-based build. Populated by the Day Designer selector in the
     * package creation wizard. Backend field name matches.
     */
    sourceDayBlueprintVersionId?: number;
    /** Subset of DayBlueprintActivity ids to consume when blueprint mode is on. */
    selectedDayBlueprintActivityIds?: number[];
    /** DayBlueprintDay.id ↔ PackageTemplateDay.id when multi-day. */
    blueprintDayMappings?: Array<{ blueprintDayId: number; eventTypeDayLinkId: number }>;
    /** Named days with optional starter activities when the wizard skips preset activities. */
    scaffoldPackageDays?: Array<{
        name: string;
        order_index: number;
        locationCount?: number;
        activities?: Array<{ name: string; durationMinutes?: number }>;
    }>;
}

export interface CreateServicePackageData extends Partial<ServicePackage> {}

export interface UpdateServicePackageData extends Partial<ServicePackage> {}

export interface CreatePackageSetData {
    name: string;
    description?: string;
    emoji?: string;
    event_category?: string;
    tier_labels?: string[];
}

export interface UpdatePackageSetData {
    name?: string;
    description?: string;
    emoji?: string;
    event_category?: string;
    order_index?: number;
}

export interface UpdatePackageSetSlotData {
    slot_label?: string;
    service_package_id?: number | null;
    order_index?: number;
}

export type PackageTraceabilityInquiryRole = 'selected_package' | 'source_package';

export interface PackageTraceabilityResponse {
    package_template: { id: number; name: string } | null;
    source_blueprint: {
        blueprint_id: number;
        display_name: string;
        version_id: number;
        version_number: number | null;
    } | null;
    inquiries: Array<{ id: number; label: string; roles: PackageTraceabilityInquiryRole[] }>;
    projects: Array<{ id: number; name: string | null; wedding_date: string }>;
}

export interface PackageBlueprintResyncPreview {
    already_current: boolean;
    package_id: number;
    blueprint: { id: number; display_name: string };
    current_version: { id: number; version_number: number } | null;
    latest_version: { id: number; version_number: number };
    structural_summary: {
        current_days: number;
        latest_days: number;
        current_activities: number;
        latest_activities: number;
        current_moments: number;
        latest_moments: number;
    };
    warning: string;
    moment_changes_sample?: {
        added_moment_names: string[];
        removed_moment_names: string[];
    };
}