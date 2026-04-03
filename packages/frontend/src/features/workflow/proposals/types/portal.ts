/**
 * Portal Types — Canonical source.
 * Types for the client portal and public proposal viewer.
 */

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

export interface PortalProposalSection {
    id: string;
    type: string;
    isVisible: boolean;
    data: Record<string, any>;
}

export interface PortalProposalContent {
    theme?: string;
    meta?: {
        personalVideoUrl?: string;
        expirationDate?: string;
        customCss?: string;
    };
    sections?: PortalProposalSection[];
}

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
        lat: number | null;
        lng: number | null;
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

export type PortalProposalStatus = 'review_pending' | 'changes_requested' | 'accepted';

/* ── Journey Tracker ─────────────────────────────────────── */

export type JourneyStepStatus = 'completed' | 'active' | 'waiting' | 'upcoming' | 'locked';

export type JourneyStepSide = 'studio' | 'client';

export interface JourneyStep {
    key: string;
    label: string;
    status: JourneyStepStatus;
    icon: string;
    side: JourneyStepSide;
    waitingMessage?: string;
    completedAt?: string;
    cta?: { label: string; href: string };
    summary?: string;
}

export interface PortalProposalSectionData {
    proposal_status: string;
    share_token: string | null;
    title: string | null;
    content: PortalProposalContent | null;
    client_response: string | null;
    client_response_at: string | null;
    client_response_message: string | null;
    event_days: PublicEventDay[];
    films: PublicFilm[];
}
