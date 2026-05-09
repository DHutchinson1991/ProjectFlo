'use client';

import React, { useState, useCallback } from 'react';
import { InstanceScheduleEditor } from '@/features/workflow/scheduling/instance';
import { scheduleApi } from '@/features/workflow/scheduling/instance';

interface ProjectScheduleTabProps {
    projectId: number;
    sourcePackageId?: number | null;
}

/**
 * Schedule tab for projects. Uses InstanceScheduleEditor with owner type 'project'.
 */
export function ProjectScheduleTab({ projectId, sourcePackageId }: ProjectScheduleTabProps) {
    const [syncing, setSyncing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSyncFromPackage = useCallback(async () => {
        if (!confirm('This will reset the schedule to match the original package. Any custom changes will be lost. Continue?')) return;
        try {
            setSyncing(true);
            await scheduleApi.syncFromPackage.project(projectId);
            setRefreshKey((k) => k + 1);
        } catch (err) {
            console.error('Sync from package failed:', err);
            alert('Failed to sync from package. Please try again.');
        } finally {
            setSyncing(false);
        }
    }, [projectId]);

    return (
        <InstanceScheduleEditor
            key={`schedule-${projectId}-${refreshKey}`}
            owner={{ type: 'project', id: projectId }}
            onSyncFromPackage={handleSyncFromPackage}
            syncing={syncing}
            sourcePackageId={sourcePackageId}
        />
    );
}
