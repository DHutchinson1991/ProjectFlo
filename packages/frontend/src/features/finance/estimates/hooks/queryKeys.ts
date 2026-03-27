export const estimateKeys = {
    all: ['estimates'] as const,
    byInquiry: (brandId: number | null, inquiryId: number | null) =>
        ['estimates', 'inquiry', brandId, inquiryId] as const,
    detail: (brandId: number | null, inquiryId: number | null, estimateId: number | null) =>
        ['estimates', 'detail', brandId, inquiryId, estimateId] as const,
    snapshots: (brandId: number | null, inquiryId: number | null, estimateId: number | null) =>
        ['estimates', 'snapshots', brandId, inquiryId, estimateId] as const,
};
