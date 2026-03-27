/**
 * Proposal Section Types — Canonical source.
 * Section types for the proposal editor/builder.
 */

import type { OutputData } from '@editorjs/editorjs';
import type { ServicePackageItem } from '@/features/catalog/packages/types/service-package.types';

export type SectionType =
    | 'hero'
    | 'text'
    | 'pricing'
    | 'media'
    | 'interactive'
    | 'schedule'
    | 'films'
    | 'subjects'
    | 'locations'
    | 'event-details'
    | 'package-details'
    | 'crew'
    | 'equipment'
    | 'terms';

export interface BaseSection {
    id: string;
    type: SectionType;
    isVisible: boolean;
}

export interface HeroSection extends BaseSection {
    type: 'hero';
    data: {
        title: string;
        date?: string;
        subtitle?: string;
        backgroundImageUrl?: string;
        backgroundVideoUrl?: string;
        scrollText?: string;
    };
}

export interface TextSection extends BaseSection {
    type: 'text';
    data: {
        blocks: any[];
    };
}

export interface PricingSection extends BaseSection {
    type: 'pricing';
    data: {
        quoteId?: number;
        packageId?: number;
        items?: ServicePackageItem[];
        showLineItems: boolean;
        showTotal: boolean;
        allowAddons: boolean;
    };
}

export interface MediaSection extends BaseSection {
    type: 'media';
    data: {
        items: Array<{
            id: string;
            type: 'video' | 'image';
            url: string;
            thumbnailUrl?: string;
            caption?: string;
        }>;
        layout: 'grid' | 'filmstrip' | 'featured';
    };
}

export interface InteractiveSection extends BaseSection {
    type: 'interactive';
    data: {
        question: string;
        options: Array<{
            id: string;
            label: string;
            value: string;
            thumbnailUrl?: string;
        }>;
        selectedOptionId?: string;
    };
}

export interface ScheduleSection extends BaseSection {
    type: 'schedule';
    data: {
        ownerType: 'inquiry' | 'project';
        ownerId: number;
        title?: string;
        showDetails?: boolean;
    };
}

export interface FilmsSection extends BaseSection {
    type: 'films';
    data: {
        title?: string;
        showDuration?: boolean;
    };
}

export interface SubjectsSection extends BaseSection {
    type: 'subjects';
    data: {
        title?: string;
        showRealNames?: boolean;
    };
}

export interface LocationsSection extends BaseSection {
    type: 'locations';
    data: {
        title?: string;
        showAddress?: boolean;
    };
}

export interface EventDetailsSection extends BaseSection {
    type: 'event-details';
    data: {
        title?: string;
        showVenue?: boolean;
        showDate?: boolean;
    };
}

export interface PackageDetailsSection extends BaseSection {
    type: 'package-details';
    data: {
        title?: string;
        showDescription?: boolean;
        showItems?: boolean;
    };
}

export interface CrewSection extends BaseSection {
    type: 'crew';
    data: {
        title?: string;
    };
}

export interface EquipmentSection extends BaseSection {
    type: 'equipment';
    data: {
        title?: string;
    };
}

export interface TermsSection extends BaseSection {
    type: 'terms';
    data: {
        title?: string;
        customTerms?: string;
    };
}

export type ProposalSection =
    | HeroSection
    | TextSection
    | PricingSection
    | MediaSection
    | InteractiveSection
    | ScheduleSection
    | FilmsSection
    | SubjectsSection
    | LocationsSection
    | EventDetailsSection
    | PackageDetailsSection
    | CrewSection
    | EquipmentSection
    | TermsSection;

export interface ProposalContent {
    theme: 'cinematic-dark' | 'clean-light' | 'soft-romance';
    meta: {
        personalVideoUrl?: string;
        expirationDate?: string;
        customCss?: string;
    };
    sections: ProposalSection[];
}
