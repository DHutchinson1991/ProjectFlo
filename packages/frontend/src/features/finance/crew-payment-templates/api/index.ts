import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type {
  CrewPaymentTemplate,
  CreateCrewPaymentTemplateData,
  UpdateCrewPaymentTemplateData,
} from '../types';

export function createCrewPaymentTemplatesApi(client: ApiClient) {
  return {
    getAll: (brandId: number) =>
      client.get<CrewPaymentTemplate[]>(`/api/brands/${brandId}/crew-payment-templates`),
    getById: (brandId: number, id: number) =>
      client.get<CrewPaymentTemplate>(`/api/brands/${brandId}/crew-payment-templates/${id}`),
    create: (brandId: number, data: CreateCrewPaymentTemplateData) =>
      client.post<CrewPaymentTemplate>(`/api/brands/${brandId}/crew-payment-templates`, data),
    update: (brandId: number, id: number, data: UpdateCrewPaymentTemplateData) =>
      client.patch<CrewPaymentTemplate>(`/api/brands/${brandId}/crew-payment-templates/${id}`, data),
    delete: (brandId: number, id: number) =>
      client.delete<void>(`/api/brands/${brandId}/crew-payment-templates/${id}`),
  };
}

export const crewPaymentTemplatesApi = createCrewPaymentTemplatesApi(apiClient);

export type CrewPaymentTemplatesApi = ReturnType<typeof createCrewPaymentTemplatesApi>;
