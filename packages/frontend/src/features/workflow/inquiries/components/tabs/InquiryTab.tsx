'use client';

import React from 'react';
import { Grid, Stack } from '@mui/material';
import { WorkflowCard } from '@/shared/ui/WorkflowCard';
import {
    EventDetailsCard,
    AvailabilityCard,
    PackageScopeCard,
    DiscoveryCallCard,
    EstimatesCard,
    InquirySubjectsCard,
} from '..';
import type { InquiryTabWithContextProps } from './types';

interface InquiryTabProps extends InquiryTabWithContextProps {
    onScheduleClick: () => void;
    packageId?: number | null;
    inquiryId: number;
}

export default function InquiryTab({
    inquiry,
    onRefresh,
    inquiryTasks,
    submission,
    currentPhase,
    phaseColor,
    onTasksChanged,
    onScheduleClick,
    packageId,
    inquiryId,
}: InquiryTabProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responses = (submission?.responses ?? {}) as Record<string, any>;

    return (
        <Grid container spacing={3} columns={10}>
            {/* Col 1 — Event Details + Subjects */}
            <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                    <div id="needs-assessment-section">
                        <EventDetailsCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'needs-assessment'}
                            activeColor={phaseColor('needs-assessment')}
                            submission={submission}
                            WorkflowCard={WorkflowCard}
                        />
                    </div>
                    {packageId && (
                        <div id="subjects-section">
                            <InquirySubjectsCard inquiryId={inquiryId} guestCount={responses.guest_count ?? null} />
                        </div>
                    )}
                </Stack>
            </Grid>

            {/* Col 2 — Availability */}
            <Grid item xs={12} md={3}>
                <Stack spacing={3}>
                    <div id="availability-section">
                        <AvailabilityCard
                            inquiry={inquiry}
                            inquiryTasks={inquiryTasks}
                            isActive={currentPhase === 'needs-assessment'}
                            activeColor={phaseColor('needs-assessment')}
                            onTasksChanged={onTasksChanged}
                            WorkflowCard={WorkflowCard}
                        />
                    </div>
                </Stack>
            </Grid>

            {/* Col 3 — Package + Estimates + Discovery Call */}
            <Grid item xs={12} md={3}>
                <Stack spacing={3}>
                    <div id="package-scope-section">
                        <PackageScopeCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'needs-assessment'}
                            activeColor={phaseColor('needs-assessment')}
                            submission={submission}
                            WorkflowCard={WorkflowCard}
                            onPackageDetailsClick={onScheduleClick}
                        />
                    </div>
                    <div id="estimates-section">
                        <EstimatesCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'estimates'}
                            activeColor={phaseColor('estimates')}
                            collapsedByDefault
                        />
                    </div>
                    <div id="calls-section">
                        <DiscoveryCallCard
                            inquiry={inquiry}
                            onRefresh={onRefresh}
                            isActive={currentPhase === 'calls'}
                            activeColor={phaseColor('calls')}
                            submission={submission}
                        />
                    </div>
                </Stack>
            </Grid>
        </Grid>
    );
}
