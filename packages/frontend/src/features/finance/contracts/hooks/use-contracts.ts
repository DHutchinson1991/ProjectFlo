'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrand } from '@/features/platform/brand';
import { contractsApi, contractTemplatesApi, contractClausesApi, contractSigningApi } from '../api';
import type {
    UpdateContractData,
    SendContractData,
    CreateContractTemplateData,
    UpdateContractTemplateData,
    CreateContractClauseCategoryData,
    UpdateContractClauseCategoryData,
    CreateContractClauseData,
    UpdateContractClauseData,
} from '../types';
import { contractKeys } from './queryKeys';

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useInquiryContracts(inquiryId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ?? null;
    const id = inquiryId ?? null;

    const query = useQuery({
        queryKey: contractKeys.byInquiry(brandId, id),
        queryFn: () => contractsApi.getAllByInquiry(id!),
        enabled: !!brandId && !!id,
        staleTime: 1000 * 60 * 2,
    });

    return {
        contracts: query.data ?? [],
        isLoading: query.isPending,
        error: query.error instanceof Error ? query.error.message : null,
    };
}

export function useContract(inquiryId: number | null, contractId: number | null) {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ?? null;

    return useQuery({
        queryKey: contractKeys.detail(brandId, inquiryId, contractId),
        queryFn: () => contractsApi.getById(inquiryId!, contractId!),
        enabled: !!brandId && !!inquiryId && !!contractId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useContractTemplates() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ?? null;

    return useQuery({
        queryKey: contractKeys.templates(brandId),
        queryFn: () => contractTemplatesApi.getAll(),
        enabled: !!brandId,
        staleTime: 1000 * 60 * 5,
    });
}

export function useContractVariables() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ?? null;

    return useQuery({
        queryKey: contractKeys.variables(brandId),
        queryFn: () => contractTemplatesApi.getVariables(),
        enabled: !!brandId,
        staleTime: 1000 * 60 * 10,
    });
}

export function useContractClauseCategories() {
    const { currentBrand } = useBrand();
    const brandId = currentBrand?.id ?? null;

    return useQuery({
        queryKey: contractKeys.clauseCategories(brandId),
        queryFn: () => contractClausesApi.getCategories(),
        enabled: !!brandId,
        staleTime: 1000 * 60 * 5,
    });
}

/** Public — no brand context required */
export function useSigningContract(token: string | null | undefined) {
    return useQuery({
        queryKey: contractKeys.signing(token ?? null),
        queryFn: () => contractSigningApi.getContract(token!),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
        retry: false,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Contract-level mutations for an inquiry's contracts list */
export function useContractListMutations(inquiryId: number | null | undefined) {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;
    const id = inquiryId ?? null;

    const invalidateList = () =>
        queryClient.invalidateQueries({ queryKey: contractKeys.byInquiry(brandId, id) });

    const sendContract = useMutation({
        mutationFn: ({ contractId, data }: { contractId: number; data: SendContractData }) =>
            contractsApi.send(id!, contractId, data),
        onSuccess: invalidateList,
    });

    return { sendContract };
}

/** Contract-detail mutations (update, sync, send) */
export function useContractDetailMutations(inquiryId: number | null, contractId: number | null) {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;

    const invalidateDetail = () =>
        queryClient.invalidateQueries({ queryKey: contractKeys.detail(brandId, inquiryId, contractId) });

    const invalidateList = () =>
        queryClient.invalidateQueries({ queryKey: contractKeys.byInquiry(brandId, inquiryId) });

    const updateContract = useMutation({
        mutationFn: (data: UpdateContractData) => contractsApi.update(inquiryId!, contractId!, data),
        onSuccess: () => { invalidateDetail(); invalidateList(); },
    });

    const syncTemplate = useMutation({
        mutationFn: () => contractsApi.syncTemplate(inquiryId!, contractId!),
        onSuccess: () => { invalidateDetail(); invalidateList(); },
    });

    const sendContract = useMutation({
        mutationFn: (data: SendContractData) => contractsApi.send(inquiryId!, contractId!, data),
        onSuccess: () => { invalidateDetail(); invalidateList(); },
    });

    const previewTemplate = useMutation({
        mutationFn: ({ templateId }: { templateId: number }) =>
            contractTemplatesApi.preview(templateId, inquiryId ?? undefined),
    });

    return { updateContract, syncTemplate, sendContract, previewTemplate };
}

/** Template management mutations */
export function useContractTemplateMutations() {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;

    const invalidateTemplates = () =>
        queryClient.invalidateQueries({ queryKey: contractKeys.templates(brandId) });

    const createTemplate = useMutation({
        mutationFn: (data: CreateContractTemplateData) => contractTemplatesApi.create(data),
        onSuccess: invalidateTemplates,
    });

    const updateTemplate = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateContractTemplateData }) =>
            contractTemplatesApi.update(id, data),
        onSuccess: invalidateTemplates,
    });

    const deleteTemplate = useMutation({
        mutationFn: (id: number) => contractTemplatesApi.delete(id),
        onSuccess: invalidateTemplates,
    });

    const previewTemplate = useMutation({
        mutationFn: ({ id, inquiryId }: { id: number; inquiryId?: number }) =>
            contractTemplatesApi.preview(id, inquiryId),
    });

    return { createTemplate, updateTemplate, deleteTemplate, previewTemplate };
}

/** Clause & category mutations */
export function useContractClauseMutations() {
    const { currentBrand } = useBrand();
    const queryClient = useQueryClient();
    const brandId = currentBrand?.id ?? null;

    const invalidateCategories = () =>
        queryClient.invalidateQueries({ queryKey: contractKeys.clauseCategories(brandId) });

    const createCategory = useMutation({
        mutationFn: (data: CreateContractClauseCategoryData) => contractClausesApi.createCategory(data),
        onSuccess: invalidateCategories,
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateContractClauseCategoryData }) =>
            contractClausesApi.updateCategory(id, data),
        onSuccess: invalidateCategories,
    });

    const deleteCategory = useMutation({
        mutationFn: (id: number) => contractClausesApi.deleteCategory(id),
        onSuccess: invalidateCategories,
    });

    const createClause = useMutation({
        mutationFn: (data: CreateContractClauseData) => contractClausesApi.create(data),
        onSuccess: invalidateCategories,
    });

    const updateClause = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateContractClauseData }) =>
            contractClausesApi.update(id, data),
        onSuccess: invalidateCategories,
    });

    const deleteClause = useMutation({
        mutationFn: (id: number) => contractClausesApi.delete(id),
        onSuccess: invalidateCategories,
    });

    const seedDefaults = useMutation({
        mutationFn: (countryCode: string) => contractClausesApi.seedDefaults(countryCode),
        onSuccess: invalidateCategories,
    });

    return { createCategory, updateCategory, deleteCategory, createClause, updateClause, deleteClause, seedDefaults };
}

/** Public signature submission */
export function useSubmitSignature(token: string | null | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (signatureText: string) =>
            contractSigningApi.submitSignature(token!, signatureText),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: contractKeys.signing(token ?? null) }),
    });
}
