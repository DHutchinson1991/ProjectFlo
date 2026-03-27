import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentBracketsApi } from '../api';
import { paymentBracketKeys } from './queryKeys';
import type {
    AssignBracketData,
    CreatePaymentBracketData,
    UpdatePaymentBracketData,
} from '../types';

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

export function usePaymentBracketsByJobRole(jobRoleId: number, includeInactive = false) {
    return useQuery({
        queryKey: paymentBracketKeys.byJobRole(jobRoleId, includeInactive),
        queryFn: () => paymentBracketsApi.getByJobRole(jobRoleId, includeInactive),
        enabled: !!jobRoleId,
    });
}

export function usePaymentBracketDetail(bracketId: number) {
    return useQuery({
        queryKey: paymentBracketKeys.detail(bracketId),
        queryFn: () => paymentBracketsApi.getById(bracketId),
        enabled: !!bracketId,
    });
}

export function useCrewMemberBrackets(crewMemberId: number) {
    return useQuery({
        queryKey: paymentBracketKeys.crewMemberBrackets(crewMemberId),
        queryFn: () => paymentBracketsApi.getCrewMemberBrackets(crewMemberId),
        enabled: !!crewMemberId,
    });
}

export function useEffectiveRate(crewMemberId: number, jobRoleId: number) {
    return useQuery({
        queryKey: paymentBracketKeys.effectiveRate(crewMemberId, jobRoleId),
        queryFn: () => paymentBracketsApi.getEffectiveRate(crewMemberId, jobRoleId),
        enabled: !!crewMemberId && !!jobRoleId,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePaymentBracket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePaymentBracketData) => paymentBracketsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentBracketKeys.all() });
        },
    });
}

export function useUpdatePaymentBracket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePaymentBracketData }) =>
            paymentBracketsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentBracketKeys.all() });
        },
    });
}

export function useDeletePaymentBracket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => paymentBracketsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentBracketKeys.all() });
        },
    });
}

export function useAssignBracket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AssignBracketData) => paymentBracketsApi.assign(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentBracketKeys.all() });
        },
    });
}

export function useUnassignBracket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ crewMemberId, jobRoleId }: { crewMemberId: number; jobRoleId: number }) =>
            paymentBracketsApi.unassign(crewMemberId, jobRoleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentBracketKeys.all() });
        },
    });
}

export function useToggleUnmanned() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ crewMemberId, jobRoleId, isUnmanned }: {
            crewMemberId: number;
            jobRoleId: number;
            isUnmanned: boolean;
        }) => paymentBracketsApi.toggleUnmanned(crewMemberId, jobRoleId, isUnmanned),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: paymentBracketKeys.all() });
        },
    });
}
