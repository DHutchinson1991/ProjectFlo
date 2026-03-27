'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { searchNominatim, type NominatimResult } from '@/features/workflow/locations/api/geocoding.api';

const DEBOUNCE_MS = 600;

export function useAddressSearch(query: string) {
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [query]);

    const normalizedQuery = debouncedQuery.trim();

    const queryResult = useQuery({
        queryKey: ['workflow', 'address-search', normalizedQuery],
        queryFn: () => searchNominatim(normalizedQuery),
        enabled: normalizedQuery.length >= 3,
        staleTime: 1000 * 60 * 5,
    });

    const results = useMemo<NominatimResult[]>(() => queryResult.data ?? [], [queryResult.data]);

    return {
        results,
        loading: queryResult.isPending,
    };
}