import { useQuery } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { paymentSchedulesApi } from '../api';
import { paymentScheduleKeys } from './queryKeys';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePaymentScheduleTemplates() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: brandId ? paymentScheduleKeys.lists(brandId) : ['paymentSchedules', 'unscoped'],
        queryFn: () => paymentSchedulesApi.getAll(),
        enabled: !!brandId,
    });
}
