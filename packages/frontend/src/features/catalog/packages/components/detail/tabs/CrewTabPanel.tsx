'use client';

import React from 'react';
import { Box } from '@mui/material';
import { CrewCard } from '../cards';
import { tabPanelPadding } from '../detail-tokens';
import type { PackageActivityRecord, PackageCrewSlotRecord, CrewOption } from '../../../types';
import type { EventDay } from '@/features/workflow/scheduling/package-template';
import type { JobRole, TaskAutoGenerationPreview } from '@/features/catalog/task-library/types';

export interface CrewTabPanelProps {
    packageId: number | null;
    PackageCrewSlots: PackageCrewSlotRecord[];
    setPackageCrewSlots: React.Dispatch<React.SetStateAction<PackageCrewSlotRecord[]>>;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    crew: CrewOption[];
    jobRoles: JobRole[];
    taskPreview: TaskAutoGenerationPreview | null;
    currency: string;
    selectedCrewSlotId: number | null;
    onSelectCrewSlot: (id: number | null) => void;
}

export function CrewTabPanel({
    packageId, PackageCrewSlots, setPackageCrewSlots,
    packageEventDays, packageActivities,
    scheduleActiveDayId, selectedActivityId,
    crew, jobRoles, taskPreview, currency,
    selectedCrewSlotId, onSelectCrewSlot,
}: CrewTabPanelProps) {
    return (
        <Box sx={tabPanelPadding}>
            <CrewCard
                packageId={packageId} PackageCrewSlots={PackageCrewSlots}
                setPackageCrewSlots={setPackageCrewSlots}
                packageEventDays={packageEventDays} packageActivities={packageActivities}
                scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                crew={crew} jobRoles={jobRoles}
                taskPreview={taskPreview} currency={currency}
                selectedCrewSlotId={selectedCrewSlotId}
                onSelectCrewSlot={onSelectCrewSlot}
            />
        </Box>
    );
}
