export interface SnapshotMoment {
    id: number;
    name: string;
    order_index: number;
    is_required: boolean;
}

export interface SnapshotActivity {
    id: number;
    name: string;
    color: string | null;
    icon: string | null;
    order_index: number;
    moments: SnapshotMoment[];
}
