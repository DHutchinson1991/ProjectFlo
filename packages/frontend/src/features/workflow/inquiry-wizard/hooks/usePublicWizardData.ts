'use client';
import { useState, useEffect, useMemo } from 'react';
import { publicInquiryWizardApi } from '../api';
import type { PublicWizardTemplate, InquiryWizardTemplate } from '../types';
import type { ServicePackage } from '@/features/catalog/packages/types/service-package.types';
import type { PackageSet } from '@/features/catalog/packages/types/package-set.types';
import type { EventType } from '@/features/catalog/event-types/types';
import { DEFAULT_CURRENCY } from '@projectflo/shared';

interface PublicWizardData {
    template: InquiryWizardTemplate | null;
    rawTemplate: PublicWizardTemplate | null;
    allPackages: ServicePackage[];
    packageSets: PackageSet[];
    eventTypes: EventType[];
    maxVideographers: number;
    maxCamerasPerOp: number;
    welcomeSettings: null;
    brand: PublicWizardTemplate['brand'];
    brandName: string;
    brandInitial: string;
    currencyCode: string;
    loading: boolean;
    error: string | null;
}

/**
 * Fetches the public inquiry wizard template by share token (unauthenticated)
 * and adapts it into the shape expected by useWizardComputed + studio step components.
 */
export function usePublicWizardData(token: string): PublicWizardData {
    const [rawTemplate, setRawTemplate] = useState<PublicWizardTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const data = await publicInquiryWizardApi.getByShareToken(token);
                if (!cancelled) setRawTemplate(data as unknown as PublicWizardTemplate);
            } catch {
                if (!cancelled) setError('This questionnaire could not be found or may have expired.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [token]);

    // ── Adapt package_sets: PublicPackageSetData → PackageSet-compatible shape ──
    const packageSets = useMemo((): PackageSet[] => {
        if (!rawTemplate) return [];
        return rawTemplate.package_sets.map((s) => ({
            id: s.id,
            event_type_id: s.category?.event_type_id ?? null,
            event_type: s.category
                ? ({ id: s.category.id, name: s.category.name, icon: null, color: null } as unknown as PackageSet['event_type'])
                : null,
            slots: (s.slots ?? []).map((slot) => ({
                id: slot.id,
                service_package_id: slot.service_package_id ?? null,
                slot_label: slot.slot_label ?? '',
                order_index: slot.order_index,
            })),
        })) as unknown as PackageSet[];
    }, [rawTemplate]);

    // ── Derive EventType[] from adapted package_sets ───────────────────────────
    const eventTypes = useMemo((): EventType[] => {
        const seen = new Map<number | string, EventType>();
        for (const s of rawTemplate?.package_sets ?? []) {
            if (!s.category) continue;
            const key = s.category.event_type_id ?? s.category.name;
            if (!seen.has(key)) {
                seen.set(key, {
                    id: s.category.event_type_id ?? 0,
                    name: s.category.name,
                } as unknown as EventType);
            }
        }
        return Array.from(seen.values());
    }, [rawTemplate]);

    // ── Cast packages: PublicPackageData → ServicePackage (structurally compat) ─
    const allPackages = useMemo((): ServicePackage[] => {
        return (rawTemplate?.packages ?? []) as unknown as ServicePackage[];
    }, [rawTemplate]);

    // ── Core template (strip public-only fields for studio hooks) ──────────────
    const template = useMemo((): InquiryWizardTemplate | null => {
        if (!rawTemplate) return null;
        return rawTemplate as unknown as InquiryWizardTemplate;
    }, [rawTemplate]);

    // ── Brand helpers ──────────────────────────────────────────────────────────
    const brand = rawTemplate?.brand ?? null;
    const brandName = brand?.display_name || brand?.name || '';
    const brandInitial = brandName.charAt(0).toUpperCase();
    const currencyCode = brand?.currency ?? DEFAULT_CURRENCY;

    return {
        template,
        rawTemplate,
        allPackages,
        packageSets,
        eventTypes,
        maxVideographers: 1,
        maxCamerasPerOp: 3,
        welcomeSettings: null,
        brand,
        brandName,
        brandInitial,
        currencyCode,
        loading,
        error,
    };
}
