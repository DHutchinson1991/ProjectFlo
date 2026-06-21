export type PackageEditTabId =
    | 'blueprint'
    | 'people'
    | 'locations'
    | 'roles'
    | 'equipment'
    | 'tasks'
    | 'content'
    | 'deliverables';

export const PACKAGE_EDIT_TAB_LABELS: Record<PackageEditTabId, string> = {
    blueprint: 'Blueprint',
    people: 'People',
    locations: 'Locations',
    roles: 'Roles',
    equipment: 'Equipment',
    tasks: 'Tasks',
    content: 'Content',
    deliverables: 'Deliverables',
};

export const DEFAULT_PACKAGE_EDIT_TAB_ORDER: PackageEditTabId[] = [
    'blueprint',
    'people',
    'locations',
    'roles',
    'equipment',
    'tasks',
    'content',
    'deliverables',
];

const PACKAGE_EDIT_TAB_ORDER_STORAGE_KEY = 'projectflo:package-edit-tab-order:v1';

const PACKAGE_EDIT_TAB_ID_SET = new Set<string>(DEFAULT_PACKAGE_EDIT_TAB_ORDER);

export function isPackageEditTabId(value: string): value is PackageEditTabId {
    return PACKAGE_EDIT_TAB_ID_SET.has(value);
}

export function normalizePackageEditTabOrder(order: string[] | null | undefined): PackageEditTabId[] {
    const seen = new Set<PackageEditTabId>();
    const normalized: PackageEditTabId[] = [];

    for (const id of order ?? []) {
        if (!isPackageEditTabId(id) || seen.has(id)) continue;
        seen.add(id);
        normalized.push(id);
    }

    for (const id of DEFAULT_PACKAGE_EDIT_TAB_ORDER) {
        if (!seen.has(id)) normalized.push(id);
    }

    return normalized;
}

export function loadPackageEditTabOrder(): PackageEditTabId[] {
    if (typeof window === 'undefined') return [...DEFAULT_PACKAGE_EDIT_TAB_ORDER];

    try {
        const raw = window.localStorage.getItem(PACKAGE_EDIT_TAB_ORDER_STORAGE_KEY);
        if (!raw) return [...DEFAULT_PACKAGE_EDIT_TAB_ORDER];
        return normalizePackageEditTabOrder(JSON.parse(raw) as string[]);
    } catch {
        return [...DEFAULT_PACKAGE_EDIT_TAB_ORDER];
    }
}

export function savePackageEditTabOrder(order: PackageEditTabId[]): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(
            PACKAGE_EDIT_TAB_ORDER_STORAGE_KEY,
            JSON.stringify(normalizePackageEditTabOrder(order)),
        );
    } catch {
        // Ignore quota / private browsing errors.
    }
}
