// Hook for managing crew data for calendar assignee selection
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/platform/auth';
import { useBrand } from '@/features/platform/brand';
import { calendarApi, type BackendUserAccount } from '../api';
import { calendarQueryKeys } from '../constants/query-keys';

export interface CrewOption {
    id: string;
    name: string;
    email: string;
    initials: string;
    isCurrentUser: boolean;
}

function toName(c: BackendUserAccount): string {
    return [c.contact.first_name, c.contact.last_name].filter(Boolean).join(' ') || c.contact.email;
}

function toInitials(c: BackendUserAccount): string {
    const parts = [c.contact.first_name, c.contact.last_name].filter(Boolean) as string[];
    return parts.length > 0
        ? parts.map(p => p[0].toUpperCase()).join('')
        : c.contact.email[0].toUpperCase();
}

export function useCrew() {
    const { user } = useAuth();
    const { currentBrand } = useBrand();

    const { data: raw = [], isPending: loading, error: queryError } = useQuery({
        queryKey: calendarQueryKeys.userAccounts(currentBrand?.id),
        queryFn: calendarApi.getUserAccounts,
        enabled: !!currentBrand,
    });

    const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load user accounts' : null;

    const crewOptions = useMemo<CrewOption[]>(
        () => raw.map(c => ({
            id: c.id.toString(),
            name: toName(c),
            email: c.contact.email,
            initials: toInitials(c),
            isCurrentUser: user ? c.contact.email === user.email : false,
        })),
        [raw, user],
    );

    const currentUserCrew = useMemo(
        () => crewOptions.find(o => o.isCurrentUser) ?? null,
        [crewOptions],
    );

    const otherCrew = useMemo(
        () => crewOptions.filter(o => !o.isCurrentUser),
        [crewOptions],
    );

    return {
        crew: crewOptions,
        currentUserCrew,
        otherCrew,
        loading,
        error,
        getCrewById: (id: string) => crewOptions.find(c => c.id === id) ?? null,
    };
}

