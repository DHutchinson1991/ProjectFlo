export const discoveryQuestionnaireKeys = {
    all: (brandId: string) => ['discovery-questionnaire', brandId] as const,
    template: (brandId: string) => [...discoveryQuestionnaireKeys.all(brandId), 'template'] as const,
    activities: (brandId: string, inquiryId: number) =>
        [...discoveryQuestionnaireKeys.all(brandId), 'activities', inquiryId] as const,
    paymentSchedule: (brandId: string, inquiryId: number) =>
        [...discoveryQuestionnaireKeys.all(brandId), 'payment-schedule', inquiryId] as const,
    wizardResponses: (brandId: string, inquiryId: number) =>
        [...discoveryQuestionnaireKeys.all(brandId), 'wizard-responses', inquiryId] as const,
    submission: (brandId: string, inquiryId: number) =>
        [...discoveryQuestionnaireKeys.all(brandId), 'submission', inquiryId] as const,
};
