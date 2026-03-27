export const quoteKeys = {
    all: ['quotes'] as const,
    byInquiry: (brandId: number | null, inquiryId: number | null) =>
        ['quotes', 'inquiry', brandId, inquiryId] as const,
    detail: (brandId: number | null, inquiryId: number | null, quoteId: number | null) =>
        ['quotes', 'detail', brandId, inquiryId, quoteId] as const,
};
