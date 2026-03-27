// Subjects system types (legacy)

export enum SubjectPriority {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY",
    BACKGROUND = "BACKGROUND"
}

export interface SubjectsLibrary {
    id: number;
    first_name: string;
    last_name?: string | null;
    context_role: string; // e.g., "Bride", "Groom", "Father of the Bride"
    // Appearance notes - structured fields
    hair_color?: string | null; // e.g., "Brown", "Blonde", "Black"
    hair_style?: string | null; // e.g., "Long", "Short", "Curly"
    skin_tone?: string | null; // Color picker value or predefined tone
    height?: string | null; // e.g., "Short", "Average", "Tall"
    eye_color?: string | null; // Color picker value
    // Additional identification notes
    appearance_notes?: string | null; // Free-form text for additional details
    brand_id?: number | null; // Optional: brand-specific subjects
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SceneSubjects {
    id: number;
    scene_id: number;
    subject_id: number;
    priority: SubjectPriority;
    notes?: string | null; // Scene-specific notes about this subject
    created_at: string;
    updated_at: string;
    // Relations
    subject: SubjectsLibrary;
}

// Create/Update DTOs
export interface CreateSubjectDto {
    first_name: string;
    last_name?: string;
    context_role: string;
    hair_color?: string;
    hair_style?: string;
    skin_tone?: string;
    height?: string;
    eye_color?: string;
    appearance_notes?: string;
    brand_id?: number;
}

export type UpdateSubjectDto = Partial<CreateSubjectDto>;

export interface AssignSubjectToSceneDto {
    subject_id: number;
    priority: SubjectPriority;
    notes?: string;
}

export interface UpdateSceneSubjectDto {
    priority?: SubjectPriority;
    notes?: string;
}

// Predefined subject roles for dropdowns
export const SUBJECT_ROLES = [
    "Bride",
    "Groom",
    "Father of the Bride",
    "Mother of the Bride",
    "Father of the Groom",
    "Mother of the Groom",
    "Best Man",
    "Maid of Honor",
    "Bridesmaid",
    "Groomsman",
    "Flower Girl",
    "Ring Bearer",
    "Officiant",
    "Wedding Planner",
    "Photographer",
    "Videographer",
    "DJ/Band Member",
    "Guest - Important",
    "Guest - Family",
    "Guest - Friend",
    "Vendor",
    "Other"
] as const;

// Predefined appearance options for dropdowns
export const HAIR_COLORS = [
    "Blonde",
    "Brown",
    "Black",
    "Red",
    "Auburn",
    "Gray",
    "White",
    "Salt & Pepper",
    "Dyed/Unnatural",
    "Other"
] as const;

export const HAIR_STYLES = [
    "Long",
    "Medium",
    "Short",
    "Curly",
    "Wavy",
    "Straight",
    "Updo",
    "Braided",
    "Bald",
    "Other"
] as const;

export const HEIGHT_OPTIONS = [
    "Short",
    "Average",
    "Tall"
] as const;

// UI Display helpers
export function getSubjectDisplayName(subject: SubjectsLibrary): string {
    return subject.last_name
        ? `${subject.first_name} ${subject.last_name}`
        : subject.first_name;
}

export function getSubjectFullTitle(subject: SubjectsLibrary): string {
    const displayName = getSubjectDisplayName(subject);
    return subject.context_role
        ? `${displayName} (${subject.context_role})`
        : displayName;
}

export function getPriorityColor(priority: SubjectPriority): string {
    switch (priority) {
        case SubjectPriority.PRIMARY:
            return "error.main"; // Red for primary subjects
        case SubjectPriority.SECONDARY:
            return "warning.main"; // Orange for secondary subjects  
        case SubjectPriority.BACKGROUND:
            return "info.main"; // Blue for background subjects
        default:
            return "grey.500";
    }
}

export function getPriorityLabel(priority: SubjectPriority): string {
    switch (priority) {
        case SubjectPriority.PRIMARY:
            return "Primary";
        case SubjectPriority.SECONDARY:
            return "Secondary";
        case SubjectPriority.BACKGROUND:
            return "Background";
        default:
            return "Unknown";
    }
}
