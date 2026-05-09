'use client';

import React from 'react';
import { Box } from '@mui/material';
import { SubjectsCard } from '../cards';
import { tabPanelPadding } from '../detail-tokens';
import type { PackageActivityRecord, PackageEventDaySubjectRecord, SubjectType } from '../../../types';
import type { UsePlanningProgressReturn } from '../../../hooks/usePlanningProgress';
import type { EventDay } from '@/features/workflow/scheduling/package-template';

export interface PeopleTabPanelProps {
    packageId: number | null;
    packageEventDays: EventDay[];
    packageActivities: PackageActivityRecord[];
    packageSubjects: PackageEventDaySubjectRecord[];
    setPackageSubjects: React.Dispatch<React.SetStateAction<PackageEventDaySubjectRecord[]>>;
    subjectTemplates: SubjectType[];
    scheduleActiveDayId: number | null;
    selectedActivityId: number | null;
    selectedMomentId: number | null;
    selectedSubjectId: number | null;
    onSelectSubject: (id: number | null) => void;
    planning?: UsePlanningProgressReturn;
}

export function PeopleTabPanel({
    packageId, packageEventDays, packageActivities,
    packageSubjects, setPackageSubjects, subjectTemplates,
    scheduleActiveDayId, selectedActivityId, selectedMomentId,
    selectedSubjectId, onSelectSubject, planning,
}: PeopleTabPanelProps) {
    return (
        <Box sx={tabPanelPadding}>
            <SubjectsCard
                packageId={packageId} packageEventDays={packageEventDays}
                packageActivities={packageActivities}
                packageSubjects={packageSubjects} setPackageSubjects={setPackageSubjects}
                subjectTemplates={subjectTemplates}
                scheduleActiveDayId={scheduleActiveDayId} selectedActivityId={selectedActivityId}
                selectedMomentId={selectedMomentId}
                activitiesWithMoments={packageActivities}
                selectedSubjectId={selectedSubjectId}
                onSelectSubject={onSelectSubject}
                planning={planning}
            />
        </Box>
    );
}
