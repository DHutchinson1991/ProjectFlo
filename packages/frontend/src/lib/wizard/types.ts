import { NeedsAssessmentTemplate, ServicePackage } from "@/lib/types";
import { WelcomeSettings } from "@/lib/types/brand";

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRecord = Record<string, any>;

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
    currSym: string;

    // Brand
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentBrand: any;
    brandName: string;
    brandInitial: string;

    // Inquiry / template
    linkedInquiryId: number | null;
    template: NeedsAssessmentTemplate | null;
    createInquiry: boolean;
    setCreateInquiry: (v: boolean) => void;

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
