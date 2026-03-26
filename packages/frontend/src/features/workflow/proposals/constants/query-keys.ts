export const proposalKeys = {
  all: ['proposals'] as const,
  byInquiry: (brandId: number | null, inquiryId: number | null) =>
    ['proposals', 'inquiry', brandId, inquiryId] as const,
  detail: (brandId: number | null, inquiryId: number | null, proposalId: number | null) =>
    ['proposals', 'detail', brandId, inquiryId, proposalId] as const,
  inquiryHeader: (brandId: number | null, inquiryId: number | null) =>
    ['proposals', 'inquiry-header', brandId, inquiryId] as const,
  publicDetail: (token: string | null) => ['proposals', 'public', token] as const,
};