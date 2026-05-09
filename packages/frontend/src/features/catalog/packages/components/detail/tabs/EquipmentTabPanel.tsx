'use client';

import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { EquipmentCard } from '../cards';
import { tabPanelPadding } from '../detail-tokens';
import type {
    PackageActivityRecord, PackageCrewSlotRecord,
    EquipmentRecord, UnmannedEquipmentRecord,
} from '../../../types';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { ServicePackage } from '../../../types/service-package.types';

export interface EquipmentTabPanelProps {
    packageId: number | null;
    safeBrandId: number | undefined;
    formData: Partial<ServicePackage>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<ServicePackage>>>;
    PackageCrewSlots: PackageCrewSlotRecord[];
    setPackageCrewSlots: React.Dispatch<React.SetStateAction<PackageCrewSlotRecord[]>>;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    allEquipment: EquipmentRecord[];
    unmannedEquipment: UnmannedEquipmentRecord[];
    setUnmannedEquipment: React.Dispatch<React.SetStateAction<UnmannedEquipmentRecord[]>>;
    currency: string;
    cardSx: SxProps<Theme>;
    selectedEquipmentId: number | null;
    onSelectEquipment: (id: number | null) => void;
}

export function EquipmentTabPanel({
    packageId, safeBrandId, formData, setFormData,
    PackageCrewSlots, setPackageCrewSlots,
    packageEventDays, packageActivities,
    scheduleActiveDayId, selectedActivityId,
    allEquipment, unmannedEquipment, setUnmannedEquipment,
    currency, cardSx, selectedEquipmentId, onSelectEquipment,
}: EquipmentTabPanelProps) {
    return (
        <Box sx={tabPanelPadding}>
            <EquipmentCard
                packageId={packageId} safeBrandId={safeBrandId}
                formData={formData} setFormData={setFormData}
                PackageCrewSlots={PackageCrewSlots} setPackageCrewSlots={setPackageCrewSlots}
                packageEventDays={packageEventDays} packageActivities={packageActivities}
                scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                allEquipment={allEquipment}
                unmannedEquipment={unmannedEquipment} setUnmannedEquipment={setUnmannedEquipment}
                currency={currency} cardSx={cardSx}
                selectedEquipmentId={selectedEquipmentId}
                onSelectEquipment={onSelectEquipment}
            />
        </Box>
    );
}
