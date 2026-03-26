import { useEffect, useMemo } from 'react';
import { BUDGET_RANGES, EVENT_CONFIGS, DEFAULT_CONFIG, EVENT_LABELS, EVENT_EMOJIS, EVENT_DESCS } from '../constants/wizard-config';
import type { AnyRecord, EventTypeConfig } from '../types';
import type { PackageSet } from '@/features/catalog/packages/types/package-set.types';
import type { EventType } from '@/features/catalog/event-types/types';
import type { ServicePackage } from '@/lib/types';

interface WizardComputedInput {
    responses: AnyRecord;
    packageSets: PackageSet[];
    allPackages: ServicePackage[];
    eventTypes: EventType[];
    currSym: string;
    setResponses: React.Dispatch<React.SetStateAction<AnyRecord>>;
}

interface WizardComputedValues {
    eventType: string;
    eventConfig: EventTypeConfig;
    selectedEventTypeId: number | null;
    eventTypeOptions: Array<{ key: string; label: string; emoji: string; desc: string; color: string | null }>;
    filteredPackages: ServicePackage[];
    slotLabels: Map<number, string>;
    budgetLabels: string[];
    budgetMax: number | null;
}

export function useWizardComputed({ responses, packageSets, allPackages, eventTypes, currSym, setResponses }: WizardComputedInput): WizardComputedValues {
    const eventType = (responses.event_type || '').toLowerCase();
    const eventConfig: EventTypeConfig = EVENT_CONFIGS[eventType] || DEFAULT_CONFIG;

    const selectedEventTypeId = useMemo(() => {
        if (!responses.event_type) return null;
        const match = eventTypes.find((et: EventType) => et.name.toLowerCase() === eventType);
        return match?.id ?? null;
    }, [responses.event_type, eventType, eventTypes]);

    const eventTypeOptions = useMemo(() => {
        const seen = new Map<string | number, { key: string; label: string; emoji: string; desc: string; color: string | null }>();
        for (const s of packageSets) {
            const et = s.event_type;
            const name: string | undefined = et?.name;
            if (!name) continue;
            const etId: number | null = s.event_type_id ?? null;
            const key = name.toLowerCase();
            const dedupeKey = etId ?? key;
            if (seen.has(dedupeKey)) continue;
            seen.set(dedupeKey, {
                key, label: EVENT_LABELS[key] || `A ${name}`,
                emoji: et?.icon || EVENT_EMOJIS[key] || '🎬',
                desc: EVENT_DESCS[key] || '', color: et?.color || null,
            });
        }
        return Array.from(seen.values());
    }, [packageSets]);

    const filteredPackages = useMemo(() => {
        const activeSets = responses.event_type
            ? packageSets.filter((s: AnyRecord) => {
                if (selectedEventTypeId != null && s.event_type_id != null) return s.event_type_id === selectedEventTypeId;
                return (s.event_type?.name ?? '').toLowerCase() === eventType;
            })
            : packageSets;
        const ids = new Set<number>();
        for (const set of activeSets)
            for (const slot of (set.slots ?? []))
                if (slot.service_package_id != null) ids.add(slot.service_package_id);
        return allPackages.filter((p) => ids.has(p.id));
    }, [allPackages, packageSets, responses.event_type, eventType, selectedEventTypeId]);

    const slotLabels = useMemo(() => {
        const m = new Map<number, string>();
        for (const s of packageSets)
            for (const slot of (s.slots || []))
                if (slot.service_package_id && slot.slot_label) m.set(slot.service_package_id, slot.slot_label);
        return m;
    }, [packageSets]);

    const budgetLabels = useMemo(() =>
        BUDGET_RANGES.map(([lo, hi]) =>
            hi === null
                ? `${currSym}${lo.toLocaleString()}+`
                : `${currSym}${lo.toLocaleString()} \u2013 ${currSym}${hi.toLocaleString()}`
        ), [currSym]);

    const budgetMax = useMemo(() => {
        const label = responses.budget_range;
        if (!label) return null;
        const nums = String(label).match(/[\d,]+/g)?.map((s: string) => parseInt(s.replace(/,/g, ''), 10)) || [];
        return nums.length > 1 ? nums[1] : null;
    }, [responses.budget_range]);

    // Auto-populate guest_count when a package with group subjects is selected
    useEffect(() => {
        const pkgId = responses.selected_package ? Number(responses.selected_package) : null;
        if (!pkgId || responses.guest_count) return;
        const pkg = allPackages.find((p) => p.id === pkgId);
        if (!pkg?.typical_guest_count) return;
        const count = pkg.typical_guest_count;
        const opts = eventConfig.guestsOptions;
        if (!opts?.length) return;
        const parseUpper = (val: string): number => {
            const m = val.match(/(\d+)\s*[\-–]\s*(\d+)/);
            if (m) return parseInt(m[2], 10);
            const plus = val.match(/(\d+)\s*\+/);
            return plus ? Infinity : parseInt(val, 10) || 0;
        };
        const bucket = opts.find((o: { value: string }) => parseUpper(o.value) >= count) ?? opts[opts.length - 1];
        if (bucket) setResponses((prev) => ({ ...prev, guest_count: bucket.value }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [responses.selected_package, allPackages]);

    return { eventType, eventConfig, selectedEventTypeId, eventTypeOptions, filteredPackages, slotLabels, budgetLabels, budgetMax };
}
