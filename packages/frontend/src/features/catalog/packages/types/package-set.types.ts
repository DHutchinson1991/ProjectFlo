import type { ServicePackage } from './service-package.types';

// ─── Types ───────────────────────────────────────────────────────────

export interface PackageSetSlot {
    id: number;
    package_set_id: number;
    service_package_id: number | null;
    slot_label: string;
    order_index: number;
    service_package?: ServicePackage | null;
}

export interface PackageSet {
    id: number;
    brand_id: number;
    name: string;
    description: string | null;
    emoji: string;
    event_category: string | null;
    order_index: number;
    is_active: boolean;
    slots: PackageSetSlot[];
}
