import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { PackageTemplate, EventType } from '../types';
import { toEventType } from '../types/legacy';

function normalizeTemplateLabel(value?: string | null): string {
    return value?.trim().toLowerCase() ?? '';
}

function getVisibleServiceTemplates(templates: PackageTemplate[]): PackageTemplate[] {
    const source = templates.filter((template) => template.is_active);
    const visibleSource = source.length > 0 ? source : templates;
    const grouped = new Map<string, PackageTemplate[]>();

    for (const template of visibleSource) {
        const key = normalizeTemplateLabel(template.event_category) || normalizeTemplateLabel(template.name);
        if (!key) continue;
        const existing = grouped.get(key);
        if (existing) {
            existing.push(template);
            continue;
        }
        grouped.set(key, [template]);
    }

    const chooseCanonicalTemplate = (group: PackageTemplate[]): PackageTemplate => {
        return [...group].sort((left, right) => {
            const leftCategory = normalizeTemplateLabel(left.event_category);
            const rightCategory = normalizeTemplateLabel(right.event_category);
            const leftExactMatch = Number(normalizeTemplateLabel(left.name) === leftCategory);
            const rightExactMatch = Number(normalizeTemplateLabel(right.name) === rightCategory);

            if (leftExactMatch !== rightExactMatch) return rightExactMatch - leftExactMatch;
            if (left.is_system_seeded !== right.is_system_seeded) return Number(left.is_system_seeded) - Number(right.is_system_seeded);
            if (left.order_index !== right.order_index) return left.order_index - right.order_index;
            return left.id - right.id;
        })[0];
    };

    return Array.from(grouped.values())
        .map(chooseCanonicalTemplate)
        .sort((left, right) => {
            if (left.order_index !== right.order_index) return left.order_index - right.order_index;
            return normalizeTemplateLabel(left.event_category ?? left.name).localeCompare(
                normalizeTemplateLabel(right.event_category ?? right.name),
            );
        });
}

export function createPackageTemplatesApi(client: ApiClient) {
    return {
        getAll: () => client.get<PackageTemplate[]>('/api/package-templates'),
        getById: (id: number) => client.get<PackageTemplate>(`/api/package-templates/${id}`),
        getSystemSeeded: () => client.get<PackageTemplate[]>('/api/package-templates/system-seeded'),
        getBrandSpecific: () => client.get<PackageTemplate[]>('/api/package-templates/brand-specific'),
        /** Legacy-shape adapter for consumers still using the EventType model. */
        getAllAsEventTypes: async (): Promise<EventType[]> => {
            const templates = await client.get<PackageTemplate[]>('/api/package-templates');
            return getVisibleServiceTemplates(templates).map((template) => {
                const eventType = toEventType(template);
                const visibleName = template.event_category?.trim() || template.name;

                return {
                    ...eventType,
                    name: visibleName,
                    event_category: template.event_category ?? visibleName,
                };
            });
        },
    };
}

export const packageTemplatesApi = createPackageTemplatesApi(apiClient);
export type PackageTemplatesApi = ReturnType<typeof createPackageTemplatesApi>;
