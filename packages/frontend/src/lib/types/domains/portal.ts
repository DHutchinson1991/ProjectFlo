/**
 * Portal & Proposal shared domain types.
 *
 * Types that are used by both the portal dashboard and proposal viewer pages.
 * Page-specific types (e.g. PortalData sections, ProposalContent) remain in
 * their respective page files until Phase 2/4 extracts them into components.
 */

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

export interface PortalBrand {
    id: number;
    name: string;
    display_name: string | null;
    description: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    address_line1: string | null;
    address_line2?: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    logo_url: string | null;
    currency?: string | null;
}

/* ------------------------------------------------------------------ */
/* Proposal content (used when rendering a proposal)                   */
/* ------------------------------------------------------------------ */

export interface ProposalSection {
    id: string;
    type: string;
    isVisible: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>;
}

export interface ProposalContent {
    theme?: string;
    meta?: {
        personalVideoUrl?: string;
        expirationDate?: string;
        customCss?: string;
    };
    sections?: ProposalSection[];
}

/* ------------------------------------------------------------------ */
/* Estimate (shared shape for public endpoints)                        */
/* ------------------------------------------------------------------ */

export interface PortalEstimateItem {
    id: number;
    category: string | null;
    description: string;
    quantity: string | number;
    unit: string | null;
    unit_price: string | number;
}

export interface PortalEstimate {
    id: number;
    estimate_number: string;
    title: string | null;
    total_amount: string | number;
    tax_rate: string | number | null;
    deposit_required: string | number | null;
    notes: string | null;
    terms?: string | null;
    items: PortalEstimateItem[];
}

/* ------------------------------------------------------------------ */
/* Schedule (event days, activities, moments, subjects, locations)     */
/* ------------------------------------------------------------------ */

export interface PublicMoment {
    id: number;
    name: string;
    order_index: number;
    duration_seconds: number;
    is_required: boolean;
}

export interface PublicActivity {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    order_index: number;
    notes: string | null;
    moments: PublicMoment[];
}

export interface PublicSubject {
    id: number;
    name: string;
    real_name: string | null;
    count: number | null;
    category: string;
    order_index: number;
}

export interface PublicLocationSlot {
    id: number;
    name: string | null;
    address: string | null;
    order_index: number;
    location: {
        name: string;
        address_line1: string | null;
        city: string | null;
        state: string | null;
    } | null;
}

export interface PublicEventDay {
    id: number;
    name: string;
    date: string;
    start_time: string | null;
    end_time: string | null;
    order_index: number;
    activities: PublicActivity[];
    subjects: PublicSubject[];
    location_slots: PublicLocationSlot[];
}

export interface PublicFilm {
    id: number;
    order_index: number;
    film: {
        id: number;
        name: string;
        film_type: string;
        target_duration_min: number | null;
        target_duration_max: number | null;
    };
}

/* ------------------------------------------------------------------ */
/* Portal proposal section data (returned by Phase 3 backend)         */
/* ------------------------------------------------------------------ */

export type PortalProposalStatus = 'review_pending' | 'changes_requested' | 'accepted';

export interface PortalProposalSectionData {
    proposal_status: string;
    share_token: string | null;
    title: string | null;
    content: ProposalContent | null;
    client_response: string | null;
    client_response_at: string | null;
    client_response_message: string | null;
    event_days: PublicEventDay[];
    films: PublicFilm[];
}
