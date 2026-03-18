// Hook for managing contributors data for calendar assignee selection
import { useState, useEffect, useMemo } from 'react';
import { Contributor } from '@/lib/types';
import { useAuth } from '@/app/providers/AuthProvider';
import { useBrand } from '@/app/providers/BrandProvider';
import { api } from '@/lib/api';

export interface ContributorOption {
    id: string;
    name: string;
    email: string;
    initials: string;
    isCurrentUser: boolean;
}

export function useContributors() {
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { currentBrand } = useBrand();

    // Fetch contributors from API
    useEffect(() => {
        const fetchContributors = async () => {
            // Don't fetch if brand context isn't available yet
            if (!currentBrand) {
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const contributorsData = await api.contributors.getAll();
                setContributors(contributorsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load contributors');
                console.error('Error fetching contributors:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchContributors();
    }, [currentBrand]); // Add brand dependency

    // Convert contributors to options for dropdown
    const contributorOptions = useMemo<ContributorOption[]>(() => {
        return contributors.map(contributor => ({
            id: contributor.id.toString(),
            name: contributor.full_name,
            email: contributor.email,
            initials: contributor.initials,
            isCurrentUser: user ? contributor.email === user.email : false
        }));
    }, [contributors, user]);

    // Get current user as contributor
    const currentUserContributor = useMemo<ContributorOption | null>(() => {
        if (!user) return null;
        return contributorOptions.find(option => option.isCurrentUser) || null;
    }, [contributorOptions, user]);

    // Get contributors excluding current user
    const otherContributors = useMemo<ContributorOption[]>(() => {
        return contributorOptions.filter(option => !option.isCurrentUser);
    }, [contributorOptions]);

    return {
        contributors: contributorOptions,
        currentUserContributor,
        otherContributors,
        loading,
        error,
        // Helper function to find contributor by ID
        getContributorById: (id: string) => contributorOptions.find(c => c.id === id) || null,
    };
}
