import type { AnyRecord } from '../types';

export function normalizeCategory(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
}

export function readBlueprintVersionId(responses: AnyRecord): number | null {
    const v = responses.source_day_blueprint_version_id ?? responses.sourceDayBlueprintVersionId;
    return typeof v === 'number' && v > 0 ? v : null;
}

export function readBlueprintId(responses: AnyRecord): number | null {
    const v = responses.source_day_blueprint_id ?? responses.sourceDayBlueprintId;
    return typeof v === 'number' && v > 0 ? v : null;
}

export function readBlueprintName(responses: AnyRecord): string | undefined {
    const v = responses.source_day_blueprint_name ?? responses.sourceDayBlueprintName;
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export function readSelectedBlueprintActivityIds(responses: AnyRecord): number[] {
    const raw =
        responses.selected_day_blueprint_activity_ids ??
        responses.selectedDayBlueprintActivityIds;
    return Array.isArray(raw)
        ? raw.filter((id): id is number => typeof id === 'number')
        : [];
}

export function readBlueprintDayMappingsRecord(responses: AnyRecord): Record<number, number> {
    const raw = responses.blueprint_day_mappings ?? responses.blueprintDayMappings;
    if (!raw) return {};
    if (Array.isArray(raw)) {
        const out: Record<number, number> = {};
        for (const row of raw) {
            if (
                row &&
                typeof row === 'object' &&
                typeof (row as { blueprintDayId?: unknown }).blueprintDayId === 'number' &&
                typeof (row as { eventTypeDayLinkId?: unknown }).eventTypeDayLinkId === 'number'
            ) {
                out[(row as { blueprintDayId: number }).blueprintDayId] = (
                    row as { eventTypeDayLinkId: number }
                ).eventTypeDayLinkId;
            }
        }
        return out;
    }
    if (typeof raw === 'object') {
        const out: Record<number, number> = {};
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
            const bpId = Number(k);
            const linkId = Number(v);
            if (Number.isFinite(bpId) && Number.isFinite(linkId)) out[bpId] = linkId;
        }
        return out;
    }
    return {};
}

export function writeBlueprintDayMappings(
    handleChange: (key: string, value: unknown) => void,
    record: Record<number, number>,
) {
    handleChange(
        'blueprint_day_mappings',
        Object.entries(record).map(([blueprintDayId, eventTypeDayLinkId]) => ({
            blueprintDayId: Number(blueprintDayId),
            eventTypeDayLinkId,
        })),
    );
}

export function initBlueprintDayMappings(
    blueprintDays: Array<{ id: number; order_index: number }>,
    templateDays: Array<{ id: number; order_index: number }>,
): Record<number, number> {
    const sortedBp = [...blueprintDays].sort((a, b) => a.order_index - b.order_index);
    const sortedTpl = [...templateDays].sort((a, b) => a.order_index - b.order_index);
    const next: Record<number, number> = {};
    for (let i = 0; i < sortedBp.length; i++) {
        const tpl = sortedTpl[i];
        if (!tpl) break;
        next[sortedBp[i].id] = tpl.id;
    }
    return next;
}

/** Returns false when builder sub-step 1 cannot advance (blueprint mode incomplete). */
export function canAdvanceBuilderStep1(responses: AnyRecord): boolean {
    const versionId = readBlueprintVersionId(responses);
    if (!versionId) return true;
    return readSelectedBlueprintActivityIds(responses).length > 0;
}
