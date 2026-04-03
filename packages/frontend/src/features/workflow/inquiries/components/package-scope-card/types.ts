import type { Inquiry, NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types';

/* ------------------------------------------------------------------ */
/*  Local interfaces                                                    */
/* ------------------------------------------------------------------ */

/** Metadata about which set/tier a package belongs to */
export interface PackageSetInfo {
    setName: string;
    setEmoji: string;
    tierLabel: string;
}

export interface InquiryFilmRecord {
    id: number;
    film_id?: number;
    film?: {
        id: number;
        name?: string | null;
    } | null;
}

export interface PackageScopeCardProps {
    inquiry: Inquiry & { activity_logs?: unknown[] };
    onRefresh?: () => Promise<void>;
    isActive?: boolean;
    activeColor?: string;
    submission?: NeedsAssessmentSubmission | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    WorkflowCard: React.ComponentType<any>;
    onPackageDetailsClick?: () => void;
}

export interface PackageSelectorProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availablePackages: any[];
    groupedBySet: { setName: string; setEmoji: string; packages: any[] }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    packageSetInfoMap: Map<number, PackageSetInfo>;
    assignPackageId: number | '';
    setAssignPackageId: (val: number | '') => void;
    assigning: boolean;
    onAssign: () => Promise<void>;
    currencyCode: string;
    getEffectivePrice: (pkg: { _totalCost?: number | string | null }) => number;
    /** For swap mode: which package is currently selected (to exclude from list) */
    excludePackageId?: number | null;
    /** Budget suggestion */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suggestedPackage?: any;
    budgetRange?: string;
    /** Swap-specific UI variant */
    variant?: 'assign' | 'swap';
    onCancel?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PackageDetailsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedPkg: any;
    stats: {
        dayCount: number;
        crewCount: number;
        cameraCount: number;
        audioCount: number;
        locationCount: number;
    };
    selectedSetInfo: PackageSetInfo | null;
    displayCost: number;
    displayTax: { rate: number; amount: number; totalWithTax: number } | null;
    estimateBelowLive: boolean;
    estimateDiffPct: number;
    displayFilms: { id?: number; description?: string }[];
    currencyCode: string;
    catColor: string;
    tierColor: string;
}
