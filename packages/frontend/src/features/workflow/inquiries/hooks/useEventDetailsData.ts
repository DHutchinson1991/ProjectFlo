'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useEventTypes } from '@/features/catalog/event-types/hooks';
import { type Brand } from '@/features/platform/brand/types';
import { scheduleApi } from '@/features/workflow/scheduling/instance';
import { geocodeAddress } from '@/features/workflow/locations/api/geocoding.api';
import type { Inquiry, NeedsAssessmentSubmission } from '@/features/workflow/inquiries/types';

type CeremonySlotAddressFields = {
    address_line1?: string;
    address_line2?: string;
    city?: string;
    county?: string;
    country?: string;
    postcode?: string;
};

export interface CeremonySlotSummary {
    id: number;
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
    slotIndex: number;
    totalSlots: number;
    updatedAt: Date;
    addressFields?: CeremonySlotAddressFields;
}

function buildBrandAddress(currentBrand: Brand | null | undefined) {
    if (!currentBrand) return null;
    const parts = [
        currentBrand.address_line1,
        currentBrand.address_line2,
        currentBrand.city,
        currentBrand.state,
        currentBrand.postal_code,
        currentBrand.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
}

export function useEventDetailsData(
    inquiry: Inquiry,
    submission: NeedsAssessmentSubmission | null | undefined,
    currentBrand: Brand | null | undefined,
) {
    const eventTypesQuery = useEventTypes();

    const ceremonySlotQuery = useQuery({
        queryKey: ['workflow', 'inquiries', inquiry.id, 'ceremony-slot'],
        queryFn: async (): Promise<CeremonySlotSummary | null> => {
            const slots = await scheduleApi.instanceLocationSlots.getForInquiry(inquiry.id) as Array<Record<string, unknown>>;
            if (slots.length === 0) return null;

            const isCeremony = (slot: Record<string, unknown>) => {
                const projectActivity = slot.project_activity as { name?: string } | undefined;
                const assignments = slot.activity_assignments as Array<{ project_activity?: { name?: string } }> | undefined;

                return projectActivity?.name?.toLowerCase().includes('ceremony')
                    || assignments?.some((assignment) => assignment.project_activity?.name?.toLowerCase().includes('ceremony'))
                    || false;
            };

            const ceremony = slots.find(isCeremony)
                || slots.find((slot) => Boolean(slot.name || slot.address || slot.location));

            if (!ceremony) return null;

            const location = ceremony.location as {
                name?: string;
                address_line1?: string;
                address_line2?: string;
                city?: string;
                state?: string;
                postal_code?: string;
                country?: string;
            } | undefined;

            const slotName = typeof ceremony.name === 'string' ? ceremony.name : location?.name || '';
            const addressParts = [
                location?.address_line1,
                location?.address_line2,
                location?.city,
                location?.state,
                location?.postal_code,
            ].filter(Boolean);
            const fullAddress = typeof ceremony.address === 'string' && ceremony.address
                ? ceremony.address
                : addressParts.join(', ');

            if (!slotName && !fullAddress) return null;

            const coords = await geocodeAddress(fullAddress || slotName);
            const slotIndex = slots.indexOf(ceremony) + 1;

            return {
                id: ceremony.id as number,
                name: slotName,
                address: fullAddress,
                lat: coords?.lat ?? null,
                lng: coords?.lng ?? null,
                slotIndex,
                totalSlots: slots.length,
                updatedAt: new Date(ceremony.updated_at as string),
                addressFields: location ? {
                    address_line1: location.address_line1,
                    address_line2: location.address_line2,
                    city: location.city,
                    county: location.state,
                    country: location.country,
                    postcode: location.postal_code,
                } : undefined,
            };
        },
        enabled: Boolean(inquiry.id),
        staleTime: 1000 * 60 * 5,
    });

    const responses = useMemo(
        () => (submission?.responses ?? {}) as Record<string, unknown>,
        [submission?.responses],
    );

    const venueAddressText = useMemo(
        () => inquiry.venue_address
            || inquiry.venue_details
            || (responses.ceremony_location as string | undefined)
            || (responses.venue_details as string | undefined)
            || null,
        [inquiry.venue_address, inquiry.venue_details, responses.ceremony_location, responses.venue_details],
    );

    const venueCoordsQuery = useQuery({
        queryKey: ['workflow', 'inquiries', inquiry.id, 'venue-geocode', venueAddressText],
        queryFn: () => geocodeAddress(venueAddressText!),
        enabled: inquiry.venue_lat == null && inquiry.venue_lng == null && Boolean(venueAddressText),
        staleTime: 1000 * 60 * 30,
    });

    const brandAddress = useMemo(() => buildBrandAddress(currentBrand), [currentBrand]);

    const brandCoordsQuery = useQuery({
        queryKey: ['workflow', 'brand', currentBrand?.id ?? 'missing', 'geocode', brandAddress],
        queryFn: () => geocodeAddress(brandAddress!),
        enabled: Boolean(currentBrand?.id) && Boolean(brandAddress),
        staleTime: 1000 * 60 * 30,
    });

    return {
        eventTypeOptions: eventTypesQuery.data ?? [],
        ceremonySlot: ceremonySlotQuery.data ?? null,
        slotsLoading: ceremonySlotQuery.isPending,
        venueCoords: venueCoordsQuery.data ?? null,
        brandCoords: brandCoordsQuery.data ?? null,
    };
}