import { useQuery } from '@tanstack/react-query';
import { paymentBracketsApi } from '../api';
import { paymentBracketKeys } from './queryKeys';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePaymentBrackets(includeInactive = false) {
    return useQuery({
        queryKey: paymentBracketKeys.list({ includeInactive }),
        queryFn: () => paymentBracketsApi.getAll(includeInactive),
    });
}

export function usePaymentBracketsByRole(brandId?: number) {
    return useQuery({
        queryKey: paymentBracketKeys.byRole(brandId),
        queryFn: () => paymentBracketsApi.getByRole(brandId),
        enabled: !!brandId,
    });
}
