export interface Proposal {
    id: number;
    project_id: number;
    title: string;
    status: string; // "Draft", "Sent", "Accepted"
    created_at: string;
    updated_at: string;
}

export interface Contract {
    id: number;
    project_id: number;
    title: string;
    status: string; // "Draft", "Sent", "Signed"
    sent_at?: string;
    signed_date?: string;
}

export interface Invoice {
    id: number;
    project_id: number;
    invoice_number: string;
    status: string; // "Draft", "Sent", "Paid", "Overdue"
    issue_date: string;
    due_date: string;
    amount: number;
}

export interface Project {
    id: number;
    project_name: string;
    wedding_date: string;
    booking_date?: string;
    edit_start_date?: string;
    phase?: string;
    brand_id?: number;
    client_id?: number;
    workflow_template_id?: number;
    brand?: {
        id: number;
        name: string;
        display_name?: string;
    };
    client?: {
        id: number;
        contact: {
            first_name?: string;
            last_name?: string;
            email: string;
            phone_number?: string;
        };
    };
    // NEW: Documents & Financials
    proposals?: Proposal[];
    contracts?: Contract[];
    invoices?: Invoice[];
}

export interface CreateProjectRequest {
    project_name: string;
    wedding_date?: string;
    booking_date?: string;
    edit_start_date?: string;
    phase?: string;
    client_id?: number;
    workflow_template_id?: number;
}

export interface UpdateProjectRequest {
    project_name?: string;
    wedding_date?: string;
    booking_date?: string;
    edit_start_date?: string;
    phase?: string;
    client_id?: number;
    workflow_template_id?: number;
}
