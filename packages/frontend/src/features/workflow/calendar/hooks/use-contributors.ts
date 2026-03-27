// Hook for managing contributors data for calendar assignee selection
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/platform/auth';
import { useBrand } from '@/features/platform/brand';
import { calendarApi, type BackendContributor } from '../api';
import { calendarQueryKeys } from '../constants/query-keys';

export interface CrewMemberOption {
    id: string;
    name: string;
    email: string;
    initials: string;
    isCurrentUser: boolean;
}

function toName(c: BackendContributor): string {
    return [c.contact.first_name, c.contact.last_name].filter(Boolean).join(' ') || c.contact.email;
}

function toInitials(c: BackendContributor): string {
    const parts = [c.contact.first_name, c.contact.last_name].filter(Boolean) as string[];
    return parts.length > 0
        ? parts.map(p => p[0].toUpperCase()).join('')
        : c.contact.email[0].toUpperCase();
}

export function useCrewMembers() {
    const { user } = useAuth();
    const { currentBrand } = useBrand();

    const { data: raw = [], isPending: loading, error: queryError } = useQuery({
        queryKey: calendarQueryKeys.contributors(currentBrand?.id),
        queryFn: calendarApi.getContributors,
        enabled: !!currentBrand,
    });

    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load contributors' : null;

    const crewMemberOptions = useMemo<CrewMemberOption[]>(
        () => raw.map(c => ({
            id: c.id.toString(),
            name: toName(c),
            email: c.contact.email,
            initials: toInitials(c),
            isCurrentUser: user ? c.contact.email === user.email : false,
        })),
        [raw, user],
    );

    const currentUserCrewMember = useMemo(
        () => crewMemberOptions.find(o => o.isCurrentUser) ?? null,
        [crewMemberOptions],
    );

    const otherContributors = useMemo(
        () => crewMemberOptions.filter(o => !o.isCurrentUser),
        [crewMemberOptions],
    );

    return {
        crewMembers: crewMemberOptions,
        currentUserCrewMember,
        otherContributors,
        loading,
        error,
        getCrewMemberById: (id: string) => crewMemberOptions.find(c => c.id === id) ?? null,
    };
}

