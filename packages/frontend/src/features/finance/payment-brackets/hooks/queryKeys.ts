export const paymentBracketKeys = {
    all: () => ['paymentBrackets'] as const,
    lists: () => [...paymentBracketKeys.all(), 'list'] as const,
    list: (filters?: { includeInactive?: boolean }) =>
        [...paymentBracketKeys.lists(), filters] as const,
    byRole: (brandId?: number) =>
        [...paymentBracketKeys.all(), 'byRole', brandId] as const,
    byJobRole: (jobRoleId: number, includeInactive?: boolean) =>
        [...paymentBracketKeys.all(), 'byJobRole', jobRoleId, { includeInactive }] as const,
    detail: (id: number) =>
        [...paymentBracketKeys.all(), 'detail', id] as const,
    crewBrackets: (crewId: number) =>
        [...paymentBracketKeys.all(), 'crew', crewId] as const,
    effectiveRate: (crewId: number, jobRoleId: number) =>
        [...paymentBracketKeys.all(), 'effectiveRate', crewId, jobRoleId] as const,
};
