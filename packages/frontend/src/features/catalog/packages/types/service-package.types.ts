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
    /** Derived from Guests subject rows, using the max headcount across package event days. */
    typical_guest_count?: number | null;
    /** Films linked to this package via PackageFilm junction */
    package_films?: Array<{
        id: number;
        order_index: number;
        film: {
            id: number;
            name: string;
            film_type: 'ACTIVITY' | 'FEATURE' | 'MONTAGE' | 'RAW_FOOTAGE';
            target_duration_min: number | null;
            target_duration_max: number | null;
            scenes?: Array<{ duration_seconds: number | null }>;
            _count?: { scenes: number };
        };
    }>;
    /** Computed pricing from PricingService (bracket-aware + task costs) */
    _totalCost?: number;
    _totalCrewCost?: number;
    _totalEquipmentCost?: number;
    _tax?: { rate: number; amount: number; totalWithTax: number } | null;
    // ── Blueprint lineage (set when package was created from a Day Blueprint) ──
    source_day_blueprint_id?: number | null;
    source_day_blueprint_version_id?: number | null;
    source_day_blueprint?: {
        id: number;
        key: string;
        display_name: string;
        event_category: string;
        latest_published_version_id: number | null;
    } | null;
    source_day_blueprint_version?: {
        id: number;
        version_number: number;
        status: string;
        published_at: string | null;
    } | null;
    /** True when a newer published blueprint version exists and the package was last
     *  snapshotted from an older one. Surface a "Blueprint updated" drift pill. */
    blueprint_update_available?: boolean;
}
