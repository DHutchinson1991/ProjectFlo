export interface Estimate {
    id: number;
    inquiry_id: number;
    project_id?: number | null;
    estimate_number: string;
    status: string;
    issue_date: Date;
    expiry_date: Date;
    total_amount: number;
    created_at: Date;
    updated_at: Date;
}

export interface EstimateItem {
    id: number;
    estimate_id: number;
    description: string;
    quantity: number;
    unit_price: number;
}
