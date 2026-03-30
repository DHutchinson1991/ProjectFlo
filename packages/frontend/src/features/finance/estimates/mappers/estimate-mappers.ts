import type { Estimate, EstimateItem, EstimateSnapshot } from '../types';
import type { EstimateApiResponse, EstimateItemApiResponse } from '../types/estimate-api';

type EstimateSnapshotApiResponse = Omit<EstimateSnapshot, 'snapshotted_at'> & {
    snapshotted_at: string | Date;
};

function toDate(value: string | Date): Date {
    return value instanceof Date ? value : new Date(value);
}

function mapEstimateItem(item: EstimateItemApiResponse | EstimateItem): EstimateItem {
    return {
        ...item,
        service_date: item.service_date ? toDate(item.service_date) : null,
    };
}

export function mapEstimateResponse(estimate: EstimateApiResponse | Estimate): Estimate {
    return {
        ...estimate,
        issue_date: toDate(estimate.issue_date),
        expiry_date: toDate(estimate.expiry_date),
        created_at: toDate(estimate.created_at),
        updated_at: toDate(estimate.updated_at),
        items: estimate.items.map(mapEstimateItem),
    };
}

export function mapEstimateListResponse(estimates: Array<EstimateApiResponse | Estimate>): Estimate[] {
    return estimates.map(mapEstimateResponse);
}

export function mapEstimateSnapshotResponse(snapshot: EstimateSnapshotApiResponse | EstimateSnapshot): EstimateSnapshot {
    return {
        ...snapshot,
        snapshotted_at: toDate(snapshot.snapshotted_at),
    };
}

export function mapEstimateSnapshotListResponse(
    snapshots: Array<EstimateSnapshotApiResponse | EstimateSnapshot>,
): EstimateSnapshot[] {
    return snapshots.map(mapEstimateSnapshotResponse);
}
