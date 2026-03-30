import type { Decimal } from '@prisma/client/runtime/library';
import { roundMoney } from '@finance/shared/pricing.utils';
import {
    resolveHourlyRate,
    resolveDayRate,
    usesDayRate,
    PLANNING_CATEGORIES,
    POST_PRODUCTION_CATEGORIES,
} from '@projectflo/shared';
import type { CrewAccum } from '@projectflo/shared';

export type AutoEstimateItem = {
    category?: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
};

interface EquipmentRelation {
    equipment_id?: number | null;
    equipment?: {
        id?: number;
        item_name?: string | null;
        model?: string | null;
        rental_price_per_day?: number | string | Decimal | null;
    } | null;
}

export interface CrewSlotRecord {
    crew_id?: number | null;
    job_role_id?: number | null;
    hours?: number | string | Decimal | null;
    crew?: {
        contact?: { first_name?: string | null; last_name?: string | null } | null;
        job_role_assignments?: { job_role_id?: number | null; is_primary?: boolean; payment_bracket?: { hourly_rate?: unknown; half_day_rate?: unknown; day_rate?: unknown; overtime_rate?: unknown; } | null; }[];
    } | null;
    job_role?: {
        name?: string | null;
        display_name?: string | null;
        category?: string | null;
    } | null;
    equipment?: EquipmentRelation[];
}

export { roundMoney } from '@finance/shared/pricing.utils';
export { resolveHourlyRate, resolveDayRate, usesDayRate } from '@projectflo/shared';

export function buildEquipmentItems(crewSlots: CrewSlotRecord[]): AutoEstimateItem[] {
    const items: AutoEstimateItem[] = [];
    const seen = new Set<number>();
    for (const op of crewSlots) {
        for (const rel of op.equipment || []) {
            const eqId = rel.equipment_id ?? rel.equipment?.id;
            if (!eqId || seen.has(eqId)) continue;
            seen.add(eqId);
            const price = Number(rel.equipment?.rental_price_per_day || 0);
            const name = [rel.equipment?.item_name, rel.equipment?.model].filter(Boolean).join(' ');
            items.push({ description: name || `Equipment #${eqId}`, category: 'Equipment', quantity: 1, unit: 'Day', unit_price: roundMoney(price) });
        }
    }
    return items;
}

function buildCrewItems(crewMap: Map<string, CrewAccum>, category: string): AutoEstimateItem[] {
    const items: AutoEstimateItem[] = [];
    for (const crew of crewMap.values()) {
        items.push({
            description: crew.role ? `${crew.name} - ${crew.role}` : crew.name,
            category,
            quantity: crew.useDayRate && crew.dayRate > 0 ? crew.days : roundMoney(crew.hours),
            unit: crew.useDayRate && crew.dayRate > 0 ? 'Days' : 'Hours',
            unit_price: roundMoney(crew.useDayRate && crew.dayRate > 0 ? crew.dayRate : crew.hourlyRate),
        });
    }
    return items;
}

function accumulateCrew(op: CrewSlotRecord, bucket: Map<string, CrewAccum>): void {
    if (!op.crew_id && !op.job_role_id) return;
    const key = `${op.crew_id ?? 0}|${op.job_role_id ?? 0}`;
    const name = op.crew
        ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim()
        : (op.job_role?.display_name || op.job_role?.name || 'TBC');
    const role = op.job_role?.display_name || op.job_role?.name || '';
    const hours = Number(op.hours || 0);
    const existing = bucket.get(key);
    if (existing) { existing.hours += hours; existing.days += 1; return; }
    bucket.set(key, { name, role, hours, days: 1, hourlyRate: resolveHourlyRate(op), dayRate: resolveDayRate(op), useDayRate: usesDayRate(op) });
}

export function buildItemsFromCrewSlots(crewSlots: CrewSlotRecord[]): AutoEstimateItem[] {
    const planningCrew = new Map<string, CrewAccum>();
    const coverageCrew = new Map<string, CrewAccum>();
    const postProdCrew = new Map<string, CrewAccum>();

    for (const op of crewSlots) {
        const category = op.job_role?.category?.toLowerCase() || '';
        const bucket = PLANNING_CATEGORIES.has(category) ? planningCrew
            : POST_PRODUCTION_CATEGORIES.has(category) ? postProdCrew
            : coverageCrew;
        accumulateCrew(op, bucket);
    }

    return [
        ...buildCrewItems(planningCrew, 'Planning'),
        ...buildCrewItems(coverageCrew, 'Coverage'),
        ...buildCrewItems(postProdCrew, 'Post-Production'),
    ];
}
