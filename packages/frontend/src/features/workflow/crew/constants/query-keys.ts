export const crewKeys = {
  all: (brandId: number) => ['crew', brandId] as const,
  lists: (brandId: number) => [...crewKeys.all(brandId), 'list'] as const,
  byRole: (brandId: number, jobRoleId: number) =>
    [...crewKeys.all(brandId), 'by-role', jobRoleId] as const,
  workload: (brandId: number) =>
    [...crewKeys.all(brandId), 'workload'] as const,
  detail: (brandId: number, id: number) =>
    [...crewKeys.all(brandId), 'detail', id] as const,
  roster: (brandId: number) => ['crew', 'roster', brandId] as const,
};
