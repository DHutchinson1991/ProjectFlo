export const clientKeys = {
  all: (brandId: number) => ['clients', brandId] as const,
  lists: (brandId: number) => [...clientKeys.all(brandId), 'list'] as const,
  detail: (brandId: number, id: number) =>
    [...clientKeys.all(brandId), 'detail', id] as const,
};
