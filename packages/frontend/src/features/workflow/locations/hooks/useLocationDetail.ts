'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { locationsApi } from '../api';
import type { LocationsLibrary } from '../types';

export const locationDetailKeys = {
    detail: (id: number) => ['locations', 'detail', id] as const,
};

export function useLocationDetail(locationId: number) {
    const queryClient = useQueryClient();
    const initialized = useRef(false);

    const [locationForm, setLocationForm] = useState<Partial<LocationsLibrary>>({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const query = useQuery({
        queryKey: locationDetailKeys.detail(locationId),
        queryFn: () => locationsApi.getById(locationId),
        enabled: !!locationId,
    });

    // Initialise the form once the first fetch resolves
    useEffect(() => {
        if (query.data && !initialized.current) {
            initialized.current = true;
            setLocationForm(query.data);
        }
    }, [query.data]);

    const updateMutation = useMutation({
        mutationFn: (payload: Partial<LocationsLibrary>) =>
            locationsApi.update(locationId, payload),
        onSuccess: (updated) => {
            queryClient.setQueryData(locationDetailKeys.detail(locationId), updated);
            setLocationForm(updated);
            setSnackbarOpen(true);
        },
    });

    const handleSaveLocation = (overrideForm?: Partial<LocationsLibrary>) => {
        updateMutation.mutate(overrideForm ?? locationForm);
    };

    return {
        location: query.data ?? null,
        locationForm,
        setLocationForm,
        loading: query.isPending,
        saving: updateMutation.isPending,
        error:
            query.error instanceof Error
                ? query.error.message
                : updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : '',
        snackbarOpen,
        setSnackbarOpen,
        handleSaveLocation,
    };
}
