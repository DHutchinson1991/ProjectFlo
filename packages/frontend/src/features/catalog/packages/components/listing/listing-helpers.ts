import type { ServicePackage } from '@/features/catalog/packages/types/service-package.types';
import type { PackageSetSlot } from '../../types/package-set.types';

// ─── Constants ───────────────────────────────────────────────────────

export const MAX_SLOTS = 5;
export const TIER_LABELS = ['Budget', 'Basic', 'Standard', 'Premium', 'Ultimate'] as const;

/** Color-psychology tier palette optimised for dark theme */
export const TIER_COLORS: Record<string, string> = {
    Budget:   '#F97316',   // Value Orange — affordability & friendliness
    Basic:    '#3B82F6',   // Trust Blue — reliability & solid foundation
    Standard: '#EC4899',   // Quality Magenta — creativity & popular sweet-spot
    Premium:  '#EAB308',   // Luxury Gold — exclusivity & top-tier
    Ultimate: '#22D3EE',   // Platinum Ice Cyan — elite & bespoke
};

export const CATEGORY_COLORS: Record<string, string> = {
    'Wedding': '#EC4899', 'Elopement': '#a855f7', 'Corporate': '#3b82f6',
    'Event': '#f59e0b', 'Music Video': '#10b981', 'Commercial': '#0ea5e9',
    'Uncategorized': '#64748b',
};

export const CATEGORY_EMOJIS: Record<string, string> = {
    'Wedding': '💒', 'Weddings': '💒',
    'Birthday': '🎂', 'Birthdays': '🎂',
    'Engagement': '💍', 'Engagements': '💍',
    'Elopement': '🌿', 'Corporate': '🏢',
    'Event': '🎉', 'Music Video': '🎵',
    'Commercial': '🎬',
};

export function getCategoryEmoji(categoryName: string | null | undefined): string {
    if (!categoryName) return '📦';
    return CATEGORY_EMOJIS[categoryName] ?? '📦';
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function getTierColor(tier: string): string {
    return TIER_COLORS[tier] ?? '#648CFF';
}

/**
 * Resolve tier labels for all slots in a set, ensuring no duplicates.
 * Slots with valid tier labels keep theirs; slots with invalid labels (e.g. "Package")
 * get the next unassigned tier.
 */
export function resolveSlotTiers(slots: PackageSetSlot[]): Map<number, string> {
    const result = new Map<number, string>();
    const usedTiers = new Set<string>();
    const validTiers: readonly string[] = TIER_LABELS;

    // First pass: honour slots that already have a valid tier label
    for (const slot of slots) {
        if (validTiers.includes(slot.slot_label) && !usedTiers.has(slot.slot_label)) {
            result.set(slot.id, slot.slot_label);
            usedTiers.add(slot.slot_label);
        }
    }

    // Second pass: assign remaining tiers to slots without a valid label
    const remainingTiers = TIER_LABELS.filter(t => !usedTiers.has(t));
    let tierIdx = 0;
    for (const slot of slots) {
        if (!result.has(slot.id)) {
            result.set(slot.id, remainingTiers[tierIdx] ?? TIER_LABELS[TIER_LABELS.length - 1]);
            tierIdx++;
        }
    }

    return result;
}

export function getCategoryColor(cat: string | null): string {
    if (!cat) return '#64748b';
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
        if (cat.toLowerCase().includes(key.toLowerCase())) return color;
    }
    const hash = cat.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const palette = ['#648CFF', '#EC4899', '#10b981', '#f59e0b', '#a855f7', '#0ea5e9'];
    return palette[hash % palette.length];
}

export function getPackageStats(pkg: ServicePackage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = pkg as any;
    const counts = data?._count || {};
    const dayCount = typeof counts.package_event_days === 'number'
        ? counts.package_event_days
        : (pkg.contents?.day_coverage ? Object.keys(pkg.contents.day_coverage).length : 0);
    const locationCount = typeof counts.package_location_slots === 'number'
        ? counts.package_location_slots : 0;
    const crewCount = typeof data?._crewCount === 'number' ? data._crewCount : 0;
    const eqCounts = data?._equipmentCounts || {};
    const cameraCount = eqCounts.cameras || 0;
    const audioCount = eqCounts.audio || 0;
    const totalCost = typeof data?._totalCost === 'number' ? data._totalCost : 0;
    const typicalGuestCount = typeof data?.typical_guest_count === 'number' ? data.typical_guest_count : null;
    return { dayCount, locationCount, crewCount, cameraCount, audioCount, totalCost, typicalGuestCount };
}
