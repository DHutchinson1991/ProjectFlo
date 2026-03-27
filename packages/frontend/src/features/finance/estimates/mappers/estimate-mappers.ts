/**
 * Estimate Mappers - API Response to Domain Transformation
 *
 * Transform backend estimate API responses to frontend domain models.
 */

import type { Estimate } from '@/features/finance/estimates/types';
import type { EstimateApiResponse } from '@/features/finance/estimates/types/estimate-api';

export function mapEstimateResponse(apiResponse: EstimateApiResponse): Estimate {
    return {
        id: apiResponse.id,
        inquiry_id: apiResponse.inquiry_id,
        project_id: apiResponse.project_id,
        estimate_number: apiResponse.estimate_number,
        title: apiResponse.title,
        status: apiResponse.status,
        issue_date: new Date(apiResponse.issue_date),
        expiry_date: new Date(apiResponse.expiry_date),
        total_amount: apiResponse.total_amount,
        tax_rate: apiResponse.tax_rate,
        deposit_required: apiResponse.deposit_required,
        notes: apiResponse.notes,
        terms: apiResponse.terms,
        version: apiResponse.version ?? 1,
        items: apiResponse.items.map(item => ({
            id: item.id,
            category: item.category,
            description: item.description,
            service_date: item.service_date ? new Date(item.service_date) : null,
            start_time: item.start_time,
            end_time: item.end_time,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
        })),
        created_at: new Date(apiResponse.created_at),
        updated_at: new Date(apiResponse.updated_at),
    };
}
