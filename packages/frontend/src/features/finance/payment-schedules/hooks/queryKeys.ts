export const paymentScheduleKeys = {
    all: (brandId: number) => ['paymentSchedules', brandId] as const,
    lists: (brandId: number) => [...paymentScheduleKeys.all(brandId), 'list'] as const,
    default: (brandId: number) => [...paymentScheduleKeys.all(brandId), 'default'] as const,
    detail: (brandId: number, id: number) =>
        [...paymentScheduleKeys.all(brandId), 'detail', id] as const,
    estimateMilestones: (estimateId: number) =>
        ['paymentSchedules', 'estimateMilestones', estimateId] as const,
    quoteMilestones: (quoteId: number) =>
        ['paymentSchedules', 'quoteMilestones', quoteId] as const,
};
