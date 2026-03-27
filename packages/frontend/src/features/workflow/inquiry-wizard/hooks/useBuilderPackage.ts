import { useEffect, useState } from 'react';
import { wizardStudioDataApi } from '../api';
import type { AnyRecord, PriceEstimate } from '../types';
import type { EventType } from '@/features/catalog/event-types/types';

interface UseBuilderPackageReturn {
    builderPackageId: number | null;
    priceEstimate: PriceEstimate | null;
    priceLoading: boolean;
    saveBuilderPackage: (responses: AnyRecord) => void;
    resolveBuilderPackageId: (responses: AnyRecord) => Promise<number | null>;
}

export function useBuilderPackage(currentScreenId: string, eventTypes: EventType[]): UseBuilderPackageReturn {
    const [builderPackageId, setBuilderPackageId] = useState<number | null>(null);
    const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
    const [priceLoading, setPriceLoading] = useState(false);

    // Reset when user goes back to builder
    useEffect(() => {
        if (currentScreenId === 'builder' && builderPackageId) {
            setBuilderPackageId(null);
            setPriceEstimate(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentScreenId]);

    const createBuilderPackage = async (responses: AnyRecord): Promise<number | null> => {
        const builderActivities: number[] = responses.builder_activities || [];
        const builderFilms: Array<{ type: string; activityPresetId?: number; activityName?: string }> = responses.builder_films || [];
        const etName = (responses.event_type || '').toLowerCase();
        const matchedET = eventTypes.find((e: EventType) => e.name?.toLowerCase() === etName);
        if (!matchedET || builderActivities.length === 0) return null;
        const customPkg = await wizardStudioDataApi.createPackageFromBuilder({
            eventTypeId: matchedET.id,
            selectedActivityPresetIds: builderActivities,
            operatorCount: responses.operator_count ?? 1,
            cameraCount: responses.camera_count ?? responses.operator_count ?? 1,
            filmPreferences: builderFilms,
            clientName: responses.contact_first_name,
        });
        return customPkg?.id ?? null;
    };

    const saveBuilderPackage = (responses: AnyRecord) => {
        if (builderPackageId) return; // already saved
        setPriceLoading(true);
        (async () => {
            try {
                const pkgId = await createBuilderPackage(responses);
                if (pkgId) {
                    setBuilderPackageId(pkgId);
                    try {
                        const estimate = await wizardStudioDataApi.estimatePackagePrice(pkgId);
                        setPriceEstimate(estimate);
                    } catch (err) {
                        console.error('Failed to fetch price estimate:', err);
                    }
                }
            } catch (err) {
                console.error('Failed to save builder package:', err);
            } finally {
                setPriceLoading(false);
            }
        })();
    };

    const resolveBuilderPackageId = async (responses: AnyRecord): Promise<number | null> => {
        if (builderPackageId) return builderPackageId;
        try {
            const pkgId = await createBuilderPackage(responses);
            if (pkgId) setBuilderPackageId(pkgId);
            return pkgId;
        } catch (err) {
            console.error('Failed to create custom package:', err);
            return null;
        }
    };

    return { builderPackageId, priceEstimate, priceLoading, saveBuilderPackage, resolveBuilderPackageId };
}
