export interface SnapshotMoment {
    id: number;
    name: string;
    description?: string | null;
    order_index: number;
    is_required: boolean;
}

export interface SnapshotActivity {
    id: number;
    name: string;
    description?: string | null;
    location_label?: string | null;
    color: string | null;
    icon: string | null;
    order_index: number;
    moments: SnapshotMoment[];
}
