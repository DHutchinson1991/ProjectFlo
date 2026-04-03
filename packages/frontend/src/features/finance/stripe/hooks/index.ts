import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stripeApi } from '../api';

const stripeKeys = {
  all: ['stripe'] as const,
  connectStatus: () => [...stripeKeys.all, 'connect-status'] as const,
};

export function useStripeConnectStatus() {
  return useQuery({
    queryKey: stripeKeys.connectStatus(),
    queryFn: () => stripeApi.getConnectStatus(),
  });
}

export function useCreateStripeAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => stripeApi.createConnectAccount(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stripeKeys.connectStatus() });
    },
  });
}

export function useStripeOnboardingLink() {
  return useMutation({
    mutationFn: () => stripeApi.getOnboardingLink(),
  });
}

export function useStripeDashboardLink() {
  return useMutation({
    mutationFn: () => stripeApi.getDashboardLink(),
  });
}

export function useStripeCheckout() {
  return useMutation({
    mutationFn: ({
      invoiceId,
      portalToken,
    }: {
      invoiceId: number;
      portalToken: string;
    }) => stripeApi.createCheckout(invoiceId, portalToken),
  });
}
