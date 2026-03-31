import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { discoveryQuestionnaireSubmissionsApi } from '../api';
import { discoveryQuestionnaireKeys } from '../constants/query-keys';
import type { CreateDiscoverySubmissionPayload, DiscoveryQuestionnaireSubmission } from '../types';

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
        mutationFn: async (params: SubmitParams): Promise<DiscoveryQuestionnaireSubmission> => {
            const payload: Partial<CreateDiscoverySubmissionPayload> & { template_id?: number; inquiry_id?: number } = {
                responses: params.responses,
                transcript: params.transcript || undefined,
                sentiment: Object.keys(params.sentiment ?? {}).length > 0 ? params.sentiment : undefined,
                call_duration_seconds: params.callDurationSeconds,
            };

            if (params.existingSubmissionId) {
                return discoveryQuestionnaireSubmissionsApi.update(params.existingSubmissionId, payload);
            }

            return discoveryQuestionnaireSubmissionsApi.create({
                template_id: params.templateId,
                inquiry_id: params.inquiryId,
                ...payload,
            } as CreateDiscoverySubmissionPayload);
        },
        onSuccess: (_data, params) => {
            queryClient.invalidateQueries({
                queryKey: discoveryQuestionnaireKeys.submission(brandId, params.inquiryId),
            });
        },
    });
}
