'use client';

import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { LocationsCard } from '../cards';
import { tabPanelPadding } from '../detail-tokens';
import type { PackageActivityRecord, PackageLocationSlotRecord } from '../../../types';
import type { EventDay } from '@/features/workflow/scheduling/package-template';

export interface LocationsTabPanelProps {
    packageId: number | null;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    packageLocationSlots: PackageLocationSlotRecord[];
    setPackageLocationSlots: React.Dispatch<React.SetStateAction<PackageLocationSlotRecord[]>>;
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    cardSx: SxProps<Theme>;
    selectedLocationSlotId: number | null;
    selectedSpaceSlotId: number | null;
    onSelectLocation: (id: number | null) => void;
    onSelectSpace: (id: number | null) => void;
}

export function LocationsTabPanel({
    packageId, packageEventDays, packageActivities,
    packageLocationSlots, setPackageLocationSlots,
    scheduleActiveDayId, selectedActivityId, cardSx,
    selectedLocationSlotId, selectedSpaceSlotId,
    onSelectLocation, onSelectSpace,
}: LocationsTabPanelProps) {
    return (
        <Box sx={tabPanelPadding}>
            <LocationsCard
                packageId={packageId} packageEventDays={packageEventDays}
                packageActivities={packageActivities}
                packageLocationSlots={packageLocationSlots} setPackageLocationSlots={setPackageLocationSlots}
                scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                cardSx={cardSx}
                selectedLocationSlotId={selectedLocationSlotId}
                selectedSpaceSlotId={selectedSpaceSlotId}
                onSelectLocation={onSelectLocation}
                onSelectSpace={onSelectSpace}
            />
        </Box>
    );
}
