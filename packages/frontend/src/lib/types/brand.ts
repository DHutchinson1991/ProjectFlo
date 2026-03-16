/**
 * Brand-related types for ProjectFlo
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
    is_active: boolean;
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
    available_days: number[]; // 0=Sun, 1=Mon ... 6=Sat
    available_from: string;   // "09:00"
    available_to: string;     // "17:00"
    google_meet_link: string;
}

export interface UserBrand {
    id: number;
    user_id: number;
    brand_id: number;
    role: 'Owner' | 'Admin' | 'Manager' | 'Member';
    is_active: boolean;
    joined_at: string;
    brand: Brand;
}

export interface BrandContextType {
    // Current brand state
    currentBrand: Brand | null;
    availableBrands: Brand[];
    isLoading: boolean;
    error: string | null;

    // Actions
    switchBrand: (brandId: number) => Promise<void>;
    refreshBrands: () => Promise<void>;

    // Utils
    isBrandSelected: boolean;
    getCurrentBrandId: () => number | null;
}

export interface BrandSwitchResponse {
    brand: Brand;
    role: string;
    permissions: string[];
}

// API Response types
export interface BrandApiResponse extends Brand {
    user_brands?: UserBrand[];
    brand_settings?: BrandSetting[];
    _count?: {
        projects: number;
        contacts: number;
        filmLibrary: number;
        scenes: number;
    };
}
