export interface WizardStep {
    key: string;
    label: string;
    description?: string;
    type?: 'questions' | 'package_select' | 'discovery_call';
}

export interface NeedsAssessmentQuestion {
    id?: number;
    order_index: number;
    prompt: string;
    field_type: string;
    field_key?: string;
    required?: boolean;
    options?: { values?: string[] } | Record<string, unknown> | null;
    condition_json?: Record<string, unknown> | null;
    help_text?: string | null;
    category?: string | null;
}

export interface NeedsAssessmentTemplate {
    id: number;
    brand_id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    status?: string;
    version?: string;
    published_at?: string | null;
    steps_config?: WizardStep[] | null;
    created_at: string;
    updated_at: string;
    questions: NeedsAssessmentQuestion[];
}

export interface NeedsAssessmentSubmission {
    id: number;
    template_id: number;
    brand_id: number;
    inquiry_id?: number | null;
    contact_id?: number | null;
    status: string;
    responses: Record<string, unknown>;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    template?: NeedsAssessmentTemplate;
    inquiry?: Record<string, unknown> | null;
    contact?: Record<string, unknown> | null;
    review_notes?: string | null;
    reviewed_at?: string | null;
    review_checklist_state?: Record<string, boolean> | null;
}

export interface NaDateConflictResult {
    wedding_date: string | null;
    booked_conflicts: { type: string; id: number; name: string; status: string }[];
    soft_conflicts: { type: string; id: number; name: string; status: string }[];
}

export interface NaCrewConflictResult {
    conflicts: { contributor_id: number; name: string; role: string; event_type: string; event_title: string }[];
}

export interface NeedsAssessmentSubmissionPayload {
    template_id: number;
    responses: Record<string, unknown>;
    status?: string;
    create_inquiry?: boolean;
    contact?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_number?: string;
    };
    inquiry?: {
        wedding_date?: string;
        venue_details?: string;
        guest_count?: string;
        notes?: string;
        lead_source?: string;
        lead_source_details?: string;
        selected_package_id?: number;
    };
}
