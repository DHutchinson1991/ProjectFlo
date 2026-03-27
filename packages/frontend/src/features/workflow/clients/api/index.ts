import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { Client, ClientListItem, CreateClientData, UpdateClientData } from '../types';
import type { Contact, NewContactData, UpdateContactDto } from '@/shared/types/users';
import type { ContactApiResponse } from '@/shared/types/user-api';
import { mapContactResponse } from '@/shared/types/user-mappers';

export function createClientsApi(client: ApiClient) {
  return {
    getAll: () =>
      client.get<ClientListItem[]>('/api/clients'),

    getById: (id: number) =>
      client.get<Client>(`/api/clients/${id}`),

    create: (data: CreateClientData) =>
      client.post<ClientListItem>('/api/clients', data),

    update: (id: number, data: UpdateClientData) =>
      client.put<ClientListItem>(`/api/clients/${id}`, data),

    delete: (id: number) =>
      client.delete<void>(`/api/clients/${id}`),
  };
}

export function createContactsApi(client: ApiClient) {
  return {
    getAll: async (): Promise<Contact[]> => {
      const raw = await client.get<ContactApiResponse[]>('/api/contacts');
      return raw.map(mapContactResponse);
    },

    getById: async (id: number): Promise<Contact> => {
      const raw = await client.get<ContactApiResponse>(`/api/contacts/${id}`);
      return mapContactResponse(raw);
    },

    create: async (data: NewContactData): Promise<Contact> => {
      const raw = await client.post<ContactApiResponse>('/api/contacts', data);
      return mapContactResponse(raw);
    },

    update: async (id: number, data: UpdateContactDto): Promise<Contact> => {
      const raw = await client.patch<ContactApiResponse>(`/api/contacts/${id}`, data);
      return mapContactResponse(raw);
    },

    delete: (id: number) =>
      client.delete<void>(`/api/contacts/${id}`),
  };
}

export const clientsApi = createClientsApi(apiClient);
export const contactsApi = createContactsApi(apiClient);

export type ClientsApi = ReturnType<typeof createClientsApi>;
export type ContactsApi = ReturnType<typeof createContactsApi>;
