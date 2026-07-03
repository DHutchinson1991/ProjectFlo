import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { inquiryWizardSubmissionsApi } from '../api';
import { discoveryQuestionnaireKeys } from '../constants/query-keys';
import type { InquiryWizardSubmissionPayload, UpdateInquiryWizardSubmissionPayload, InquiryWizardSubmission } from '../types';

interface SubmitParams {
    existingSubmissionId?: number;
    templateId: number;
    inquiryId: number;
    responses: Record<string, string | string[]>;
    transcript?: string;
    sentiment?: Record<string, string>;
    callDurationSeconds?: number;
}

export function useSubmitDiscoveryQuestionnaire() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ? String(currentBrand.id) : '';
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: SubmitParams): Promise<InquiryWizardSubmission> => {
            const payload: UpdateInquiryWizardSubmissionPayload = {
                responses: params.responses,
                transcript: params.transcript || undefined,
                sentiment: Object.keys(params.sentiment ?? {}).length > 0 ? params.sentiment : undefined,
                call_duration_seconds: params.callDurationSeconds,
            };

            if (params.existingSubmissionId) {
                return inquiryWizardSubmissionsApi.update(params.existingSubmissionId, payload);
            }

            return inquiryWizardSubmissionsApi.create({
                template_id: params.templateId,
                inquiry_id: params.inquiryId,
                ...payload,
            } as InquiryWizardSubmissionPayload);
        },
        onSuccess: (_data, params) => {
            queryClient.invalidateQueries({
                queryKey: discoveryQuestionnaireKeys.submission(brandId, params.inquiryId),
            });
        },
    });
}
