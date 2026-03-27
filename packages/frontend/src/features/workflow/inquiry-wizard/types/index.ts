import type { Brand } from '@/features/platform/brand/types';
import type { ServicePackage } from '@/features/catalog/packages/types/service-package.types';
import { WelcomeSettings } from '@/features/platform/brand/types';
import { EventType } from '@/features/catalog/event-types/types';

export interface WizardStep {
    key: string;
    label: string;
    description?: string;
    type?: 'questions' | 'package_select' | 'discovery_call';
}

export interface InquiryWizardQuestion {
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

export interface InquiryWizardTemplate {
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
    questions: InquiryWizardQuestion[];
}

export interface InquiryWizardSubmission {
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
    template?: InquiryWizardTemplate;
    inquiry?: Record<string, unknown> | null;
    contact?: Record<string, unknown> | null;
    review_notes?: string | null;
    reviewed_at?: string | null;
    review_checklist_state?: Record<string, boolean> | null;
}

export interface IwDateConflictResult {
    wedding_date: string | null;
    booked_conflicts: { type: string; id: number; name: string; status: string }[];
    soft_conflicts: { type: string; id: number; name: string; status: string }[];
}

export interface IwCrewConflictResult {
    conflicts: { crew_member_id: number; name: string; role: string; event_type: string; event_title: string }[];
}

// Portal / public wizard types
export interface PublicBrand {
    id: number;
    name: string;
    display_name: string | null;
    description: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    logo_url: string | null;
    currency: string | null;
}

export interface PublicPackageData {
    id: number;
    name: string;
    description?: string | null;
    base_price?: string | number | null;
    price?: string | number | null;
    currency?: string;
    category?: string | null;
    contents?: { items?: { description: string; price?: number; type?: string }[] } | null;
    is_active?: boolean;
}

export interface PublicPackageSetData {
    id: number;
    category?: { id: number; name: string; event_type_id?: number | null } | null;
    slots?: { id: number; slot_label?: string; service_package_id?: number | null; order_index: number }[];
}

export interface PublicWizardTemplate {
    id: number;
    brand_id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    steps_config?: WizardStep[] | null;
    questions: InquiryWizardQuestion[];
    brand: PublicBrand | null;
    packages: PublicPackageData[];
    package_sets: PublicPackageSetData[];
}

export interface InquiryWizardSubmissionPayload {
    template_id: number;
    responses: Record<string, unknown>;
    status?: string;
    create_inquiry?: boolean;
    selected_package_id?: number | null;
    preferred_payment_schedule_template_id?: number;
    inquiry_id?: number;
    contact?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_number?: string;
    };
    inquiry?: {
        wedding_date?: string;
        guest_count?: string;
        notes?: string;
        lead_source?: string;
        lead_source_details?: string;
        selected_package_id?: number | null;
        preferred_payment_schedule_template_id?: number;
        event_type_id?: number;
    };
}

export type ScreenId =
    | "welcome" | "event_type" | "date" | "guests" | "partner"
    | "birthday_contact" | "venue" | "fork"
    | "budget" | "packages"
    | "activities" | "coverage" | "deliverables" | "operators"
    | "builder"
    | "payment_terms"
    | "special" | "source" | "call_offer" | "call_details"
    | "contact" | "summary";

export type Direction = "forward" | "back";
export type AnyRecord = Record<string, unknown>;

export interface ActivityOption {
    key: string;
    label: string;
    emoji: string;
}

export interface EventTypeConfig {
    dateLabel: string;
    guestsLabel: string;
    showGuests: boolean;
    guestsOptions: { label: string; desc: string; value: string }[];
    showPartner: boolean;
    partnerLabel: string;
    venueLabel: string;
    activities: ActivityOption[];
}

export interface NominatimResult {
    place_id: number;
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
    address?: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
        country?: string;
        county?: string;
    };
}

export interface PriceEstimate {
    packageId: number;
    packageName: string;
    currency: string;
    equipment: { cameras: number; audio: number; totalItems: number; dailyCost: number; items: Array<{ name: string; category: string; dailyRate: number }> };
    crew: { operatorCount: number; totalHours: number; totalCost: number; operators: Array<{ position: string; hours: number; rate: number; cost: number }> };
    tasks: { totalTasks: number; totalHours: number; totalCost: number; byPhase: Record<string, { taskCount: number; hours: number; cost: number }> };
    summary: { equipmentCost: number; crewCost: number; subtotal: number };
}

/** Shared context object passed to every screen component as a single `ctx` prop  */
export interface NACtx {
    responses: AnyRecord;
    handleChange: (key: string, value: unknown) => void;
    singleSelect: (key: string, value: string) => void;
    multiToggle: (key: string, value: string) => void;
    autoAdvance: () => void;
    handleContinue: () => void;
    goNext: () => void;
    goTo: (id: ScreenId) => void;

    // Derived
    eventType: string;
    eventConfig: EventTypeConfig;
    eventTypeOptions: { key: string; label: string; emoji: string; desc: string; color: string | null }[];
    filteredPackages: ServicePackage[];
    slotLabels: Map<number, string>;
    budgetLabels: string[];
    budgetMax: number | null;
    currency: string;

    // Brand
    currentBrand: Brand | null;
    brandName: string;
    brandInitial: string;

    // Inquiry / template
    linkedInquiryId: number | null;
    template: InquiryWizardTemplate | null;
    createInquiry: boolean;
    setCreateInquiry: (v: boolean) => void;

    // Event types (loaded from studio data)
    eventTypes: EventType[];

    // Builder
    maxVideographers: number;
    maxCamerasPerOp: number;

    // Pricing
    priceEstimate: PriceEstimate | null;
    priceLoading: boolean;

    // Welcome settings (social proof, trust badges, copy)
    welcomeSettings: WelcomeSettings | null;

    // Discovery-call slots
    callSlots: { time: string; available: boolean }[];
    callSlotsLoading: boolean;
    callSlotsDuration: number;
    fetchCallSlots: (date: string) => void;
}
