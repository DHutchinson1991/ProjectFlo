export const projectKeys = {
  all: (brandId: string | number | null) => ['projects', brandId] as const,
  lists: (brandId: string | number | null) => [...projectKeys.all(brandId), 'list'] as const,
  list: (brandId: string | number | null, filters?: Record<string, unknown>) =>
    [...projectKeys.lists(brandId), filters] as const,
  detail: (brandId: string | number | null, id: number) =>
    [...projectKeys.all(brandId), 'detail', id] as const,
  schedule: (brandId: string | number | null, id: number) =>
    [...projectKeys.detail(brandId, id), 'schedule'] as const,
  eventDays: (brandId: string | number | null, id: number) =>
    [...projectKeys.schedule(brandId, id), 'event-days'] as const,
  films: (brandId: string | number | null, id: number) =>
    [...projectKeys.schedule(brandId, id), 'films'] as const,
};
