/**
 * Equipment Management Types - ProjectFlo Frontend
 *
 * Types for managing equipment inventory, rentals, and maintenance tracking
 * organized by equipment categories and status.
 */

import type { CrewMember } from "@/shared/types/users";

// Shared base entity (inlined from deleted common.ts)
interface BaseEntity {
    id: number;
    created_at: string;
    updated_at: string;
}

// Enums that match backend
export enum EquipmentCategory {
    CAMERA = "CAMERA",
    LENS = "LENS",
    AUDIO = "AUDIO",
    LIGHTING = "LIGHTING",
    GRIP = "GRIP",
    POWER = "POWER",
    STORAGE = "STORAGE",
    STREAMING = "STREAMING",
    BACKGROUNDS = "BACKGROUNDS",
    ACCESSORIES = "ACCESSORIES",
}

export enum EquipmentType {
    // Camera Types
    MIRRORLESS = "MIRRORLESS",
    DSLR = "DSLR",
    CAMCORDER = "CAMCORDER",
    ACTION_CAM = "ACTION_CAM",
    DRONE = "DRONE",
    SMARTPHONE = "SMARTPHONE",

    // Lens Types
    EF_MOUNT = "EF_MOUNT",
    EF_S_MOUNT = "EF_S_MOUNT",
    SONY_E_MOUNT = "SONY_E_MOUNT",
    NIKON_AF_S = "NIKON_AF_S",
    CANON_RF = "CANON_RF",

    // Audio Types
    RECORDER = "RECORDER",
    LAVALIER = "LAVALIER",
    CONDENSER = "CONDENSER",
    HEADPHONES = "HEADPHONES",
    PA_SPEAKER = "PA_SPEAKER",
    MIXER = "MIXER",
    INTERFACE = "INTERFACE",
    CABLES_AUDIO = "CABLES_AUDIO",
    DECKS = "DECKS",

    // Lighting Types
    LED = "LED",
    STAGE_LIGHTING = "STAGE_LIGHTING",
    T_BARS = "T_BARS",
    DIFFUSION = "DIFFUSION",
    STANDS = "STANDS",

    // Grip Types
    TRIPOD = "TRIPOD",
    MONOPOD = "MONOPOD",
    GIMBAL = "GIMBAL",
    SLIDER = "SLIDER",
    MOUNT = "MOUNT",

    // Power & Storage
    BATTERY = "BATTERY",
    CHARGER = "CHARGER",
    GENERATOR = "GENERATOR",
    MEMORY_CARD = "MEMORY_CARD",

    // Streaming & Sync
    STREAMING_DEVICE = "STREAMING_DEVICE",
    AUTOCUE = "AUTOCUE",
    SYNC_DEVICE = "SYNC_DEVICE",

    // Backgrounds & Effects
    GREEN_SCREEN = "GREEN_SCREEN",
    SMOKE_MACHINE = "SMOKE_MACHINE",

    // Other
    OTHER_EQUIPMENT = "OTHER_EQUIPMENT",
}

export enum EquipmentCondition {
    NEW = "NEW",
    EXCELLENT = "EXCELLENT",
    GOOD = "GOOD",
    FAIR = "FAIR",
    NEEDS_REPAIR = "NEEDS_REPAIR",
}

export enum EquipmentAvailability {
    AVAILABLE = "AVAILABLE",
    RENTED = "RENTED",
    MAINTENANCE = "MAINTENANCE",
    RETIRED = "RETIRED",
}

export enum MaintenanceType {
    ROUTINE = "Routine",
    REPAIR = "Repair",
    CALIBRATION = "Calibration",
    CLEANING = "Cleaning",
    INSPECTION = "Inspection",
    UPGRADE = "Upgrade",
}

export enum MaintenanceStatus {
    SCHEDULED = "Scheduled",
    IN_PROGRESS = "In_Progress",
    COMPLETED = "Completed",
    CANCELLED = "Cancelled",
}

// Main equipment interface - matches backend schema exactly
export interface Equipment extends BaseEntity {
    item_name: string;
    item_code?: string;
    category: EquipmentCategory;
    type: EquipmentType;
    brand_name?: string;
    model?: string;
    description?: string;
    quantity: number;
    condition: EquipmentCondition;
    availability_status: EquipmentAvailability;
    vendor?: string;
    rental_price_per_day?: number | string;
    purchase_price?: number | string;
    purchase_date?: string;
    weight_kg?: number;
    power_usage_watts?: number;
    dimensions?: string;
    specifications?: Record<string, unknown>;
    attachment_type?: string;
    compatibility?: string;
    serial_number?: string;
    warranty_expiry?: string;
    last_maintenance?: string;
    next_maintenance_due?: string;
    location?: string;
    brand_id?: number;
    is_active: boolean;
    created_by_id?: number;
    owner_id?: number | null;
    rental_bookings?: EquipmentRental[];
    maintenance_logs?: EquipmentMaintenance[];
    rentals?: EquipmentRental[];
    maintenance_records?: EquipmentMaintenance[];
    brand?: {
        id: number;
        name: string;
        display_name: string;
        description?: string;
        business_type?: string;
        website?: string;
        email?: string;
        phone?: string;
        address_line1?: string;
        address_line2?: string;
        city?: string;
        state?: string;
        country?: string;
        postal_code?: string;
        timezone?: string;
        currency?: string;
        logo_url?: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
    };
    created_by?: {
        id: number;
        contact?: {
            id: number;
            name: string;
            email?: string;
            phone?: string;
        };
    };
    owner?: {
        id: number;
        contact?: {
            id: number;
            first_name: string;
            last_name: string;
            email?: string;
            phone?: string;
        };
    } | null;
    is_unmanned?: boolean;
}

export interface EquipmentRental extends BaseEntity {
    equipment_id: number;
    project_id?: number;
    renter_name: string;
    renter_contact?: string;
    start_date: string;
    end_date: string;
    daily_rate: number | string;
    total_cost: number | string;
    deposit_amount?: number | string;
    deposit_returned?: boolean;
    status: 'Active' | 'Completed' | 'Cancelled';
    notes?: string;
    equipment?: Equipment;
}

export interface EquipmentMaintenance extends BaseEntity {
    equipment_id: number;
    maintenance_type: MaintenanceType;
    status: MaintenanceStatus;
    scheduled_date: string;
    completed_date?: string;
    performed_by?: string;
    cost?: number | string;
    description: string;
    notes?: string;
    equipment?: Equipment;
}

export interface EquipmentByCategory {
    [key: string]: EquipmentCategoryGroup;
}

export interface EquipmentCategoryGroup {
    category: EquipmentCategory;
    label: string;
    count: number;
    equipment: Equipment[];
    expanded?: boolean;
}

export interface EquipmentStats {
    total_count: number;
    by_category: Record<EquipmentCategory, number>;
    by_availability: Record<EquipmentAvailability, number>;
    by_condition: Record<EquipmentCondition, number>;
    total_value: number;
    monthly_rental_revenue: number;
    maintenance_due: number;
    warranty_expiring: number;
}

export interface CreateEquipmentDto {
    item_name: string;
    item_code?: string;
    category: EquipmentCategory;
    type: EquipmentType;
    brand_name?: string;
    model?: string;
    description?: string;
    quantity?: number;
    condition?: EquipmentCondition;
    availability_status?: EquipmentAvailability;
    vendor?: string;
    rental_price_per_day?: number;
    purchase_price?: number;
    purchase_date?: string;
    weight_kg?: number;
    power_usage_watts?: number;
    dimensions?: string;
    specifications?: Record<string, unknown>;
    attachment_type?: string;
    compatibility?: string;
    serial_number?: string;
    warranty_expiry?: string;
    last_maintenance?: string;
    next_maintenance_due?: string;
    location?: string;
}

export type UpdateEquipmentDto = Partial<CreateEquipmentDto>;

export interface CreateEquipmentRentalDto {
    equipment_id: number;
    project_id?: number;
    renter_name: string;
    renter_contact?: string;
    start_date: string;
    end_date: string;
    daily_rate: number;
    total_cost: number;
    deposit_amount?: number;
    notes?: string;
}

export type UpdateEquipmentRentalDto = Partial<CreateEquipmentRentalDto> & {
    deposit_returned?: boolean;
    status?: 'Active' | 'Completed' | 'Cancelled';
};

export interface CreateEquipmentMaintenanceDto {
    equipment_id: number;
    maintenance_type: MaintenanceType;
    scheduled_date: string;
    performed_by?: string;
    cost?: number;
    description: string;
    notes?: string;
}

export type UpdateEquipmentMaintenanceDto = Partial<CreateEquipmentMaintenanceDto> & {
    status?: MaintenanceStatus;
    completed_date?: string;
};

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
    [EquipmentCategory.CAMERA]: 'Cameras',
    [EquipmentCategory.LENS]: 'Lenses',
    [EquipmentCategory.AUDIO]: 'Audio Equipment',
    [EquipmentCategory.LIGHTING]: 'Lighting',
    [EquipmentCategory.GRIP]: 'Grip & Support',
    [EquipmentCategory.POWER]: 'Power & Batteries',
    [EquipmentCategory.STORAGE]: 'Storage & Media',
    [EquipmentCategory.STREAMING]: 'Streaming & Sync',
    [EquipmentCategory.BACKGROUNDS]: 'Backgrounds & Effects',
    [EquipmentCategory.ACCESSORIES]: 'Accessories',
};

export const EQUIPMENT_AVAILABILITY_COLORS = {
    [EquipmentAvailability.AVAILABLE]: '#4caf50',
    [EquipmentAvailability.RENTED]: '#ff9800',
    [EquipmentAvailability.MAINTENANCE]: '#2196f3',
    [EquipmentAvailability.RETIRED]: '#9e9e9e',
};

export const EQUIPMENT_CONDITION_COLORS = {
    [EquipmentCondition.NEW]: '#2e7d32',
    [EquipmentCondition.EXCELLENT]: '#4caf50',
    [EquipmentCondition.GOOD]: '#8bc34a',
    [EquipmentCondition.FAIR]: '#ff9800',
    [EquipmentCondition.NEEDS_REPAIR]: '#f44336',
};

// Hook state/action interfaces for useEquipmentList
export interface EquipmentListState {
    equipmentByCategory: EquipmentByCategory;
    crewMembers: CrewMember[];
    loading: boolean;
    error: string | null;
    deleteConfirmOpen: boolean;
    equipmentToDelete: Equipment | null;
    snackbarOpen: boolean;
    snackbarMessage: string;
    snackbarSeverity: "success" | "error";
    inlineEditingEquipment: number | null;
    inlineEditData: Partial<Equipment>;
    quickAddCategory: string | null;
    quickAddData: Partial<Equipment>;
    expandedCategories: Record<string, boolean>;
}

export interface EquipmentListActions {
    loadEquipment: () => Promise<void>;
    showSnackbar: (message: string, severity?: "success" | "error") => void;
    toggleCategoryExpansion: (category: string) => void;
    handleCategoryCardClick: (category: string) => void;
    startInlineEdit: (equipment: Equipment) => void;
    cancelInlineEdit: () => void;
    updateInlineEditData: (field: keyof Equipment, value: unknown) => void;
    saveInlineEdit: () => Promise<void>;
    startQuickAdd: (category: string) => void;
    cancelQuickAdd: () => void;
    updateQuickAddData: (field: keyof Equipment, value: unknown) => void;
    saveQuickAdd: () => Promise<void>;
    handleDeleteConfirm: () => Promise<void>;
    setEquipmentToDelete: (equipment: Equipment | null) => void;
    setDeleteConfirmOpen: (open: boolean) => void;
    setError: (error: string | null) => void;
    setSnackbarOpen: (open: boolean) => void;
}
