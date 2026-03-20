export interface DiscoveryQuestion {
    id: number;
    template_id: number;
    order_index: number;
    section?: string | null;
    prompt: string;
    script_hint?: string | null;
    field_type: string;
    field_key?: string | null;
    required: boolean;
    options?: { values?: string[] } | Record<string, unknown> | null;
    visibility?: string | null;
    created_at: string;
    updated_at: string;
}

export interface DiscoveryQuestionnaireTemplate {
    id: number;
    brand_id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    questions: DiscoveryQuestion[];
}

export interface DiscoveryQuestionnaireSubmission {
    id: number;
    template_id: number;
    brand_id: number;
    inquiry_id?: number | null;
    responses: Record<string, unknown>;
    call_notes?: string | null;
    transcript?: string | null;
    sentiment?: Record<string, unknown> | null;
    call_duration_seconds?: number | null;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    template?: DiscoveryQuestionnaireTemplate;
}

export interface CreateDiscoverySubmissionPayload {
    template_id: number;
    inquiry_id?: number;
    responses: Record<string, unknown>;
    call_notes?: string;
    transcript?: string;
    sentiment?: Record<string, unknown>;
    call_duration_seconds?: number;
}
