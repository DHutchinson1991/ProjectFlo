'use client';
import { useMemo, useState, useEffect } from 'react';
import { publicInquiryWizardApi } from '../api';
import { DEFAULT_STEPS } from '../constants/public-wizard-theme';
import type { PublicWizardTemplate, PublicPackageData, WizardStep } from '../types';
import { DEFAULT_CURRENCY } from '@projectflo/shared';

export function usePublicWizardTemplate(token: string) {
    const [template, setTemplate] = useState<PublicWizardTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [steps, setSteps] = useState<WizardStep[]>(DEFAULT_STEPS);
    const [selectedEventType, setSelectedEventType] = useState<string | null>(null);

    const api = publicInquiryWizardApi;

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const data = await api.getByShareToken(token);
                if (cancelled) return;
                setTemplate(data);
                if (data.steps_config?.length) {
                    const fromConfig = data.steps_config as WizardStep[];
                    const hasCall = fromConfig.some((s: WizardStep) => s.key === 'call');
                    setSteps(hasCall ? fromConfig : [
                        ...fromConfig,
                        { key: 'call', label: 'Discovery Call', description: 'How would you like to connect?', type: 'discovery_call' },
                    ]);
                }
            } catch {
                if (!cancelled) setError('This questionnaire could not be found or may have expired.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [token, api]);

    const eventTypeOptions = useMemo(() => {
        const seen = new Set<string>();
        const options: string[] = [];
        for (const set of (template?.package_sets ?? [])) {
            const name = set.category?.name;
            if (name && !seen.has(name)) { seen.add(name); options.push(name); }
        }
        return options;
    }, [template?.package_sets]);

    const packages = useMemo((): PublicPackageData[] => {
        const allPackages = template?.packages ?? [];
        const packageSets = template?.package_sets ?? [];
        const activeSets = selectedEventType
            ? packageSets.filter((s) => (s.category?.name ?? '').toLowerCase() === selectedEventType.toLowerCase())
            : packageSets;
        const activeIds = new Set<number>();
        for (const set of activeSets) {
            for (const slot of (set.slots ?? [])) {
                if (slot.service_package_id != null) activeIds.add(slot.service_package_id);
            }
        }
        return activeIds.size > 0 ? allPackages.filter((pkg) => activeIds.has(pkg.id)) : allPackages;
    }, [template?.packages, template?.package_sets, selectedEventType]);

    const brand = template?.brand ?? null;
    const brandName = brand?.display_name || brand?.name || '';
    const brandInitial = brandName.charAt(0).toUpperCase();
    const currencyCode = useMemo(() => brand?.currency ?? DEFAULT_CURRENCY, [brand?.currency]);

    return { template, loading, error, steps, eventTypeOptions, packages, selectedEventType, setSelectedEventType, brand, brandName, brandInitial, currencyCode };
}
