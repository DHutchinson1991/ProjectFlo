import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { discoveryQuestionnaireTemplatesApi, inquiriesApi } from '../api';
import { paymentSchedulesApi } from '@/features/finance/payment-schedules';
import { inquiryWizardSubmissionsApi } from '@/features/workflow/inquiry-wizard';
import { discoveryQuestionnaireKeys } from '../constants/query-keys';
import type { SnapshotActivity } from '../types/schedule-snapshot';

export function useDiscoveryQuestionnaireTemplate() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ? String(currentBrand.id) : '';
    return useQuery({
        queryKey: discoveryQuestionnaireKeys.template(brandId),
        queryFn: () => discoveryQuestionnaireTemplatesApi.getActive(),
        enabled: !!brandId,
        staleTime: 1000 * 60 * 10,
    });
}

export function useScheduleSnapshotActivities(inquiryId: number) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ? String(currentBrand.id) : '';
    return useQuery({
        queryKey: discoveryQuestionnaireKeys.activities(brandId, inquiryId),
        queryFn: () =>
            inquiriesApi.scheduleSnapshot
                .getActivities(inquiryId)
                .then((acts) => (acts ?? []) as SnapshotActivity[])
                .catch((): SnapshotActivity[] => []),
        enabled: !!brandId && !!inquiryId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useInquiryPaymentSchedule(inquiryId: number, brandIdParam: number) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ? String(currentBrand.id) : '';
    return useQuery({
        queryKey: discoveryQuestionnaireKeys.paymentSchedule(brandId, inquiryId),
        queryFn: async () => {
            if (brandIdParam <= 0) return null;
            const inq = await inquiriesApi.getById(inquiryId);
            return inq.preferred_payment_schedule_template_id
                ? paymentSchedulesApi.getById(inq.preferred_payment_schedule_template_id)
                : paymentSchedulesApi.getDefault();
        },
        enabled: !!brandId && !!inquiryId && brandIdParam > 0,
        staleTime: 1000 * 60 * 5,
    });
}

export function useWizardResponses(inquiryId: number) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ? String(currentBrand.id) : '';
    return useQuery({
        queryKey: discoveryQuestionnaireKeys.wizardResponses(brandId, inquiryId),
        queryFn: () =>
            inquiryWizardSubmissionsApi
                .getByInquiryId(inquiryId)
                .then((subs) => (subs[0]?.responses ?? {}) as Record<string, unknown>)
                .catch(() => ({} as Record<string, unknown>)),
        enabled: !!brandId && !!inquiryId,
        staleTime: 1000 * 60 * 5,
    });
}
