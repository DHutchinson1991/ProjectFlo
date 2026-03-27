export const settingsKeys = {
  all: (brandId: number) => ['settings', brandId] as const,
  lists: (brandId: number) => [...settingsKeys.all(brandId), 'list'] as const,
  listByCategory: (brandId: number, category: string) =>
    [...settingsKeys.lists(brandId), category] as const,
  detail: (brandId: number, key: string) =>
    [...settingsKeys.all(brandId), 'detail', key] as const,
  meeting: (brandId: number) =>
    [...settingsKeys.all(brandId), 'meeting'] as const,
  welcome: (brandId: number) =>
    [...settingsKeys.all(brandId), 'welcome'] as const,
};
