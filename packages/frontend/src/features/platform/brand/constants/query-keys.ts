export const brandKeys = {
  all: () => ['brands'] as const,
  lists: () => [...brandKeys.all(), 'list'] as const,
  detail: (id: number) => [...brandKeys.all(), 'detail', id] as const,
  BrandMembers: (userId: number) => [...brandKeys.all(), 'user', userId] as const,
  context: (brandId: number, userId: number) =>
    [...brandKeys.all(), 'context', brandId, userId] as const,
};
