import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  PaymentMethod,
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
} from '../types';

export function createPaymentMethodsApi(client: ApiClient) {
  return {
    getAll: () =>
      client.get<PaymentMethod[]>('/api/payment-methods'),

    getById: (id: number) =>
      client.get<PaymentMethod>(`/api/payment-methods/${id}`),

    create: (data: CreatePaymentMethodData) =>
      client.post<PaymentMethod>('/api/payment-methods', data),

    update: (id: number, data: UpdatePaymentMethodData) =>
      client.patch<PaymentMethod>(`/api/payment-methods/${id}`, data),

    delete: (id: number) =>
      client.delete<{ success: boolean }>(`/api/payment-methods/${id}`),

    reorder: (ids: number[]) =>
      client.post<PaymentMethod[]>('/api/payment-methods/reorder', { ids }),
  };
}

export const paymentMethodsApi = createPaymentMethodsApi(apiClient);

export type PaymentMethodsApi = ReturnType<typeof createPaymentMethodsApi>;
