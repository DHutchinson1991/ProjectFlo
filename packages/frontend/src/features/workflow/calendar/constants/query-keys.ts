export const calendarQueryKeys = {
    all: ['calendar'] as const,
    byBrand: (brandId: number | null | undefined) => ['calendar', 'brand', brandId ?? 'no-brand'] as const,
    events: (brandId: number | null | undefined) => [...calendarQueryKeys.byBrand(brandId), 'events'] as const,
    eventsRange: (brandId: number | null | undefined, startDate: string, endDate: string) =>
        [...calendarQueryKeys.events(brandId), 'range', startDate, endDate] as const,
    todayEvents: (brandId: number | null | undefined, crewMemberId?: number) =>
        [...calendarQueryKeys.events(brandId), 'today', crewMemberId ?? 'all'] as const,
    upcomingEvents: (brandId: number | null | undefined, crewMemberId?: number, limit = 10) =>
        [...calendarQueryKeys.events(brandId), 'upcoming', crewMemberId ?? 'all', limit] as const,
    tasks: (brandId: number | null | undefined) => [...calendarQueryKeys.byBrand(brandId), 'tasks'] as const,
    tasksRange: (brandId: number | null | undefined, startDate: string, endDate: string) =>
        [...calendarQueryKeys.tasks(brandId), 'range', startDate, endDate] as const,
    stats: (brandId: number | null | undefined, userId?: number) =>
        [...calendarQueryKeys.byBrand(brandId), 'stats', userId ?? 'current'] as const,
    tags: (brandId: number | null | undefined) => [...calendarQueryKeys.byBrand(brandId), 'tags'] as const,
    crewMembers: (brandId: number | null | undefined) =>
        [...calendarQueryKeys.byBrand(brandId), 'contributors'] as const,
    proposalReviewMeetings: (brandId: number | null | undefined, inquiryId: number) =>
        [...calendarQueryKeys.events(brandId), 'proposal-review', inquiryId] as const,
    discoveryCallMeetings: (brandId: number | null | undefined, inquiryId: number) =>
        [...calendarQueryKeys.events(brandId), 'discovery-call', inquiryId] as const,
};
