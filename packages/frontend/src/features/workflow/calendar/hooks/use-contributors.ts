// Hook for managing contributors data for calendar assignee selection
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import { useBrand } from '@/app/providers/BrandProvider';
import { calendarApi, type BackendContributor } from '../api';
import { calendarQueryKeys } from '../constants/query-keys';

export interface ContributorOption {
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

export function useContributors() {
    const { user } = useAuth();
    const { currentBrand } = useBrand();

    const { data: raw = [], isPending: loading, error: queryError } = useQuery({
        queryKey: calendarQueryKeys.contributors(currentBrand?.id),
        queryFn: calendarApi.getContributors,
        enabled: !!currentBrand,
    });

    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load contributors' : null;

    const contributorOptions = useMemo<ContributorOption[]>(
        () => raw.map(c => ({
            id: c.id.toString(),
            name: toName(c),
            email: c.contact.email,
            initials: toInitials(c),
            isCurrentUser: user ? c.contact.email === user.email : false,
        })),
        [raw, user],
    );

    const currentUserContributor = useMemo(
        () => contributorOptions.find(o => o.isCurrentUser) ?? null,
        [contributorOptions],
    );

    const otherContributors = useMemo(
        () => contributorOptions.filter(o => !o.isCurrentUser),
        [contributorOptions],
    );

    return {
        contributors: contributorOptions,
        currentUserContributor,
        otherContributors,
        loading,
        error,
        getContributorById: (id: string) => contributorOptions.find(c => c.id === id) ?? null,
    };
}

