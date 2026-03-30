export const crewPaymentTemplateKeys = {
    all: (brandId: number) => ['crewPaymentTemplates', brandId] as const,
    lists: (brandId: number) => [...crewPaymentTemplateKeys.all(brandId), 'list'] as const,
};
