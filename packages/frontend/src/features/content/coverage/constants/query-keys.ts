export const coverageKeys = {
  all: (brandId: number) => ['coverage', brandId] as const,
  lists: (brandId: number) => [...coverageKeys.all(brandId), 'list'] as const,
  listByType: (brandId: number, type: string) =>
    [...coverageKeys.lists(brandId), type] as const,
  detail: (brandId: number, id: number) =>
    [...coverageKeys.all(brandId), 'detail', id] as const,
};
