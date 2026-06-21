export type DayBlueprintEditTabId = 'blueprint' | 'people' | 'spaces';

export const DAY_BLUEPRINT_EDIT_TAB_LABELS: Record<DayBlueprintEditTabId, string> = {
    blueprint: 'Blueprint',
    people: 'People',
    spaces: 'Spaces',
};

export const DEFAULT_DAY_BLUEPRINT_EDIT_TAB_ORDER: DayBlueprintEditTabId[] = [
    'blueprint',
    'people',
    'spaces',
];

const DAY_BLUEPRINT_EDIT_TAB_ORDER_STORAGE_KEY = 'projectflo:day-blueprint-edit-tab-order:v1';

const DAY_BLUEPRINT_EDIT_TAB_ID_SET = new Set<string>(DEFAULT_DAY_BLUEPRINT_EDIT_TAB_ORDER);

function isDayBlueprintEditTabId(value: string): value is DayBlueprintEditTabId {
    return DAY_BLUEPRINT_EDIT_TAB_ID_SET.has(value);
}

export function normalizeDayBlueprintEditTabOrder(order: string[] | null | undefined): DayBlueprintEditTabId[] {
    const seen = new Set<DayBlueprintEditTabId>();
    const normalized: DayBlueprintEditTabId[] = [];

    for (const id of order ?? []) {
        if (!isDayBlueprintEditTabId(id) || seen.has(id)) continue;
        seen.add(id);
        normalized.push(id);
    }

    for (const id of DEFAULT_DAY_BLUEPRINT_EDIT_TAB_ORDER) {
        if (!seen.has(id)) normalized.push(id);
    }

    return normalized;
}

export function loadDayBlueprintEditTabOrder(): DayBlueprintEditTabId[] {
    if (typeof window === 'undefined') return [...DEFAULT_DAY_BLUEPRINT_EDIT_TAB_ORDER];

    try {
        const raw = window.localStorage.getItem(DAY_BLUEPRINT_EDIT_TAB_ORDER_STORAGE_KEY);
        if (!raw) return [...DEFAULT_DAY_BLUEPRINT_EDIT_TAB_ORDER];
        return normalizeDayBlueprintEditTabOrder(JSON.parse(raw) as string[]);
    } catch {
        return [...DEFAULT_DAY_BLUEPRINT_EDIT_TAB_ORDER];
    }
}

export function saveDayBlueprintEditTabOrder(order: DayBlueprintEditTabId[]): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(
            DAY_BLUEPRINT_EDIT_TAB_ORDER_STORAGE_KEY,
            JSON.stringify(normalizeDayBlueprintEditTabOrder(order)),
        );
    } catch {
        // Ignore quota / private browsing errors.
    }
}
