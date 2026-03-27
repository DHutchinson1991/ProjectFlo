export const catalogEventTypeKeys = {
    all: (brandId: number) => ['catalog', 'event-types', brandId] as const,
    list: (brandId: number) => [...catalogEventTypeKeys.all(brandId), 'list'] as const,
    detail: (brandId: number, eventTypeId: number) =>
        [...catalogEventTypeKeys.all(brandId), 'detail', eventTypeId] as const,
};