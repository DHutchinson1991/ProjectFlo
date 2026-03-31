import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
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
    viewed_at: apiResponse.viewed_at ? new Date(apiResponse.viewed_at) : null,
    view_count: apiResponse.view_count ?? 0,
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
    section_views: apiResponse.section_views?.map((sv) => ({
      section_type: sv.section_type,
      viewed_at: new Date(sv.viewed_at),
      duration_seconds: sv.duration_seconds ?? 0,
    })),
    section_notes: apiResponse.section_notes?.map((sn) => ({
      section_type: sn.section_type,
      note: sn.note,
      created_at: sn.created_at,
      updated_at: sn.updated_at,
    })),
    contract: apiResponse.inquiry?.contracts?.[0]
      ? {
          id: apiResponse.inquiry.contracts[0].id,
          status: apiResponse.inquiry.contracts[0].status,
          sent_at: apiResponse.inquiry.contracts[0].sent_at ? new Date(apiResponse.inquiry.contracts[0].sent_at) : null,
          signed_date: apiResponse.inquiry.contracts[0].signed_date ? new Date(apiResponse.inquiry.contracts[0].signed_date) : null,
          signers: (apiResponse.inquiry.contracts[0].signers ?? []).map((s) => ({
            status: s.status,
            viewed_at: s.viewed_at ? new Date(s.viewed_at) : null,
            signed_at: s.signed_at ? new Date(s.signed_at) : null,
          })),
        }
      : null,
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

export function createPublicProposalsApi(client: ApiClient) {
  return {
    getByShareToken: (token: string, preview = false): Promise<PublicProposal> =>
      client.get<PublicProposal>(`/api/proposals/share/${encodeURIComponent(token)}${preview ? '?preview=true' : ''}`, { skipBrandContext: true, skipAuth: true }),

    respond: (token: string, response: ProposalClientResponse, message?: string): Promise<PublicProposal> =>
      client.post<PublicProposal>(`/api/proposals/share/${encodeURIComponent(token)}/respond`, { response, message }, { skipBrandContext: true, skipAuth: true }),

    trackSectionView: (token: string, sectionType: string, durationSeconds?: number): Promise<void> =>
      client.post(
        `/api/proposals/share/${encodeURIComponent(token)}/section-view`,
        { section_type: sectionType, duration_seconds: durationSeconds },
        { skipBrandContext: true, skipAuth: true },
      ),

    saveSectionNote: (token: string, sectionType: string, note: string): Promise<{ id: number; section_type: string; note: string }> =>
      client.post(`/api/proposals/share/${encodeURIComponent(token)}/section-note`, { section_type: sectionType, note }, { skipBrandContext: true, skipAuth: true }),
  };
}

export const proposalsApi = createProposalsApi(apiClient);
export const publicProposalsApi = createPublicProposalsApi(apiClient);

export type ProposalsApi = ReturnType<typeof createProposalsApi>;
export type PublicProposalsApi = ReturnType<typeof createPublicProposalsApi>;