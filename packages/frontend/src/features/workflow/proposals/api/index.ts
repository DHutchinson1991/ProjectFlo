import { apiClient } from '@/lib/api';
import type { ApiClient, PublicApiClient } from '@/lib/api/api-client.types';
import type {
  CreateProposalData,
  Proposal,
  ProposalApiResponse,
  ProposalClientResponse,
  ProposalShareTokenResponse,
  PublicProposal,
  UpdateProposalData,
} from '../types';

function mapProposalApiResponse(apiResponse: ProposalApiResponse): Proposal {
  return {
    id: apiResponse.id,
    inquiry_id: apiResponse.inquiry_id,
    project_id: apiResponse.project_id,
    title: apiResponse.title,
    content: apiResponse.content,
    status: apiResponse.status,
    version: apiResponse.version,
    sent_at: apiResponse.sent_at ? new Date(apiResponse.sent_at) : null,
    share_token: apiResponse.share_token ?? null,
    client_response: apiResponse.client_response ?? null,
    client_response_at: apiResponse.client_response_at ? new Date(apiResponse.client_response_at) : null,
    client_response_message: apiResponse.client_response_message ?? null,
    created_at: new Date(apiResponse.created_at),
    updated_at: new Date(apiResponse.updated_at),
    inquiry: apiResponse.inquiry?.contact
      ? {
          id: apiResponse.inquiry.id,
          contact: {
            first_name: apiResponse.inquiry.contact.first_name,
            last_name: apiResponse.inquiry.contact.last_name,
            email: apiResponse.inquiry.contact.email,
          },
        }
      : undefined,
    project: apiResponse.project ?? null,
  };
}

export function createProposalsApi(client: ApiClient) {
  return {
    getById: async (inquiryId: number, proposalId: number): Promise<Proposal> => {
      const response = await client.get<ProposalApiResponse>(`/api/inquiries/${inquiryId}/proposals/${proposalId}`);
      return mapProposalApiResponse(response);
    },

    getAllByInquiry: async (inquiryId: number): Promise<Proposal[]> => {
      const response = await client.get<ProposalApiResponse[]>(`/api/inquiries/${inquiryId}/proposals`);
      return response.map(mapProposalApiResponse);
    },

    create: async (inquiryId: number, data: CreateProposalData): Promise<Proposal> => {
      const response = await client.post<ProposalApiResponse>(`/api/inquiries/${inquiryId}/proposals`, data);
      return mapProposalApiResponse(response);
    },

    update: async (inquiryId: number, proposalId: number, data: UpdateProposalData): Promise<Proposal> => {
      const response = await client.put<ProposalApiResponse>(`/api/inquiries/${inquiryId}/proposals/${proposalId}`, data);
      return mapProposalApiResponse(response);
    },

    delete: (inquiryId: number, proposalId: number): Promise<void> =>
      client.delete(`/api/inquiries/${inquiryId}/proposals/${proposalId}`),

    sendProposal: async (inquiryId: number, proposalId: number): Promise<Proposal> => {
      const response = await client.post<ProposalApiResponse>(`/api/inquiries/${inquiryId}/proposals/${proposalId}/send`);
      return mapProposalApiResponse(response);
    },

    getOne: async (inquiryId: number, proposalId: number): Promise<Proposal> => {
      const response = await client.get<ProposalApiResponse>(`/api/inquiries/${inquiryId}/proposals/${proposalId}`);
      return mapProposalApiResponse(response);
    },

    generateShareToken: async (inquiryId: number, proposalId: number): Promise<string> => {
      const response = await client.post<ProposalShareTokenResponse>(`/api/inquiries/${inquiryId}/proposals/${proposalId}/share-token`);
      return response.share_token;
    },
  };
}

export function createPublicProposalsApi(client: PublicApiClient) {
  return {
    getByShareToken: (token: string): Promise<PublicProposal> =>
      client.publicGet<PublicProposal>(`/api/proposals/share/${encodeURIComponent(token)}`),

    respond: (token: string, response: ProposalClientResponse, message?: string): Promise<PublicProposal> =>
      client.publicPost<PublicProposal>(`/api/proposals/share/${encodeURIComponent(token)}/respond`, { response, message }),
  };
}

export const proposalsApi = createProposalsApi(apiClient as unknown as ApiClient);
export const publicProposalsApi = createPublicProposalsApi(apiClient as unknown as PublicApiClient);

export type ProposalsApi = ReturnType<typeof createProposalsApi>;
export type PublicProposalsApi = ReturnType<typeof createPublicProposalsApi>;