/**
 * Estimate API Response Types
 *
 * Types matching the exact structure returned by the backend API for estimates.
 */

export interface EstimateItemApiResponse {
    id?: number;
    category?: string;
    description: string;
    service_date?: string | null;
    start_time?: string;
    end_time?: string;
    quantity: number;
    unit?: string;
    unit_price: number;
}

export interface EstimateApiResponse {
    id: number;
    inquiry_id: number;
    project_id: number | null;
    estimate_number: string;
    title?: string;
    status: string;
    issue_date: string;
    expiry_date: string;
    total_amount: number;
    tax_rate?: number;
    deposit_required?: number;
    notes?: string;
    terms?: string;
    version?: number;
    items: EstimateItemApiResponse[];
    created_at: string;
    updated_at: string;
}
