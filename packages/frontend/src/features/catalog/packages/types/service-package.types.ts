/**
 * Service Package Types
 * Canonical definitions for ServicePackage and ServicePackageItem.
 */

export interface ServicePackageItem {
    id?: string; // For ad-hoc items
    description: string;
    price: number;
    type: 'film' | 'service';
    referenceId?: number; // ID of the referenced film if type is 'film'
    config?: {
        linked_film_id?: number; // Film instance linked to this package item
        template_film_id?: number; // Original film template used to seed the linked film
        operator_count?: number;
        scenes?: unknown[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scene_overrides?: Record<string, any>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
}

export interface ServicePackage {
    id: number;
    brand_id: number;
    name: string;
    description: string | null;
    category: string | null;
    currency: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    workflow_template_id?: number | null;
    workflow_template?: {
        id: number;
        name: string;
        description?: string;
        is_default: boolean;
        is_active?: boolean;
        _count?: { workflow_template_tasks: number };
    } | null;
    contents: {
        subject_template_id?: number | null;
        equipment_template_id?: number | null;
        equipment_counts?: {
            cameras?: number;
            audio?: number;
        };
        equipment_overrides?: Record<number, boolean>;
        /** Per-day coverage settings keyed by event day template id */
        day_coverage?: Record<number, {
            mode: 'hours' | 'window';
            hours?: number;
            window?: { from: string; to: string };
        }>;
        // Legacy global coverage (kept for migration)
        coverage_mode?: 'hours' | 'window';
        coverage_hours?: number;
        coverage_window?: { from: string; to: string };
        /** Extra equipment added to this specific package beyond the template */
        extra_equipment?: Array<{
            equipment_id: number;
            slot_type: 'CAMERA' | 'AUDIO';
            equipment?: { id: number; item_name: string; model?: string | null };
        }>;
        /** Equipment assigned per event day, keyed by event-day ID (stringified) */
        day_equipment?: Record<string, Array<{
            equipment_id: number;
            slot_type: 'CAMERA' | 'AUDIO';
            track_number?: number;
            equipment?: { id: number; item_name: string; model?: string | null };
        }>>;
        /** Activity-level equipment overrides, keyed by activity ID (stringified) */
        activity_equipment?: Record<string, Array<{
            equipment_id: number;
            slot_type: 'CAMERA' | 'AUDIO';
            track_number?: number;
            equipment?: { id: number; item_name: string; model?: string | null };
        }>>;
        items: ServicePackageItem[];
    };
    /** Sum of group-role subject counts across event days (e.g. total guest headcount) */
    typical_guest_count?: number | null;
    /** Computed pricing from PricingService (bracket-aware + task costs) */
    _totalCost?: number;
    _totalCrewCost?: number;
    _totalEquipmentCost?: number;
    _tax?: { rate: number; amount: number; totalWithTax: number } | null;
}
