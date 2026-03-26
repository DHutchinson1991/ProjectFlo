import { useQuery } from '@tanstack/react-query';
import { wizardPaymentSchedulesApi } from '../api';
import { useBrand } from '@/app/providers/BrandProvider';

export function useWizardPaymentSchedules() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id;

    return useQuery({
        queryKey: ['wizard', 'paymentSchedules', brandId],
        queryFn: () => wizardPaymentSchedulesApi.getAll(),
        enabled: !!brandId,
        staleTime: 5 * 60 * 1000,
    });
}
