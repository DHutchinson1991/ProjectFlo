export const contractKeys = {
    all: (brandId: number | null) => ['contracts', brandId] as const,
    byInquiry: (brandId: number | null, inquiryId: number | null) =>
        ['contracts', 'inquiry', brandId, inquiryId] as const,
    detail: (brandId: number | null, inquiryId: number | null, contractId: number | null) =>
        ['contracts', 'detail', brandId, inquiryId, contractId] as const,
    templates: (brandId: number | null) => ['contractTemplates', brandId] as const,
    template: (brandId: number | null, id: number | null) =>
        ['contractTemplates', 'detail', brandId, id] as const,
    variables: (brandId: number | null) => ['contractVariables', brandId] as const,
    clauseCategories: (brandId: number | null) => ['contractClauseCategories', brandId] as const,
    signing: (token: string | null) => ['contractSigning', token] as const,
};
