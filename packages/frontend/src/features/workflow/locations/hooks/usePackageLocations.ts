import { useQuery } from '@tanstack/react-query';
import { locationsApi } from '../api';

export const packageLocationsKeys = {
    all: ['package-locations'] as const,
    slots: (packageId: number) => [...packageLocationsKeys.all, 'slots', packageId] as const,
    eventDays: (packageId: number) => [...packageLocationsKeys.all, 'event-days', packageId] as const,
};

export const usePackageLocations = (packageId?: number | null) => {
    const slotsQuery = useQuery({
        queryKey: packageLocationsKeys.slots(packageId!),
        queryFn: () => locationsApi.packageLocationSlots.getAll(packageId!),
        enabled: !!packageId,
    });

    const eventDaysQuery = useQuery({
        queryKey: packageLocationsKeys.eventDays(packageId!),
        queryFn: () => locationsApi.packageEventDays.getAll(packageId!),
        enabled: !!packageId,
    });

    return {
        slots: slotsQuery.data ?? [],
        eventDays: eventDaysQuery.data ?? [],
        isLoading: slotsQuery.isLoading || eventDaysQuery.isLoading,
        error: slotsQuery.error ?? eventDaysQuery.error,
        errorMessage: slotsQuery.error instanceof Error
            ? slotsQuery.error.message
            : eventDaysQuery.error instanceof Error
                ? eventDaysQuery.error.message
                : null,
    };
};
