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

export interface ServicePackageCategory {
    id: number;
    name: string;
    description?: string;
    order_index?: number;
}

export interface CreatePackageFromBuilderData {
    eventTypeId: number;
    selectedActivityPresetIds: number[];
    crewSlotCount: number;
    cameraCount?: number;
    filmPreferences: Array<{ type: string; activityPresetId?: number; activityName?: string }>;
    inquiryId?: number;
    clientName?: string;
}

export interface CreateServicePackageData extends Partial<ServicePackage> {}

export interface UpdateServicePackageData extends Partial<ServicePackage> {}

export interface CreatePackageCategoryData {
    name: string;
    description?: string;
    order_index?: number;
}

export interface UpdatePackageCategoryData {
    name?: string;
    description?: string;
    order_index?: number;
}

export interface CreatePackageSetData {
    name: string;
    description?: string;
    emoji?: string;
    event_type_id?: number;
    tier_labels?: string[];
}

export interface UpdatePackageSetData {
    name?: string;
    description?: string;
    emoji?: string;
    event_type_id?: number;
    order_index?: number;
}

export interface UpdatePackageSetSlotData {
    slot_label?: string;
    service_package_id?: number | null;
    order_index?: number;
}