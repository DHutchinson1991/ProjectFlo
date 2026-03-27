/**
 * Brand Types — Canonical source.
 */

export interface Brand {
    id: number;
    name: string;
    display_name?: string;
    description?: string;
    business_type?: string;
    website?: string;
    email?: string;
    phone?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country: string;
    postal_code?: string;
    timezone: string;
    currency: string;
    logo_url?: string;
    default_tax_rate?: number;
    tax_number?: string;
    default_payment_method?: string;
    payment_terms_days?: number;
    bank_name?: string;
    bank_account_name?: string;
    bank_sort_code?: string;
    bank_account_number?: string;
    late_fee_percent?: number;
    cancellation_tier1_days?: number;
    cancellation_tier2_days?: number;
    cancellation_tier1_percent?: number;
    crew_payment_terms?: string;
    crew_response_deadline_days?: number;
    inquiry_validity_days?: number;
    is_active: boolean;
    service_types?: string[];
    created_at: string;
    updated_at: string;
}

export interface BrandSetting {
    id: number;
    brand_id: number;
    key: string;
    value: string;
    data_type: string;
    category?: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface MeetingSettings {
    duration_minutes: number;
    description: string;
    available_days: number[];
    available_from: string;
    available_to: string;
    google_meet_link: string;
}

export interface Testimonial {
    name: string;
    text: string;
    rating: number;
    image_url: string;
}

export interface WelcomeSettings {
    headline: string;
    subtitle: string;
    cta_text: string;
    trust_badges: Array<{ icon: string; text: string }>;
    social_proof_text: string;
    social_proof_count: number;
    social_proof_start: number;
    social_links: Array<{ platform: string; url: string }>;
    testimonials: Testimonial[];
    time_estimate: string;
}

export interface BrandMember {
    id: number;
    user_id: number;
    brand_id: number;
    role: 'Owner' | 'Admin' | 'Manager' | 'Member';
    is_active: boolean;
    joined_at: string;
    brand: Brand;
}

export interface BrandContextType {
    currentBrand: Brand | null;
    availableBrands: Brand[];
    isLoading: boolean;
    error: string | null;
    switchBrand: (brandId: number) => Promise<void>;
    refreshBrands: () => Promise<void>;
    isBrandSelected: boolean;
    getCurrentBrandId: () => number | null;
}

export interface BrandSwitchResponse {
    brand: Brand;
    role: string;
    permissions: string[];
}

export interface BrandApiResponse extends Brand {
    brand_memberships?: BrandMember[];
    brand_settings?: BrandSetting[];
    _count?: {
        projects: number;
        contacts: number;
        filmLibrary: number;
        scenes: number;
    };
}
