'use client';

import React, { useState, useCallback } from 'react';
import { Project } from '../../../app/(studio)/projects/types/project.types';
import InstanceScheduleEditor from '../../../components/schedule/InstanceScheduleEditor';
import api from '../../../lib/api';

interface PackageScheduleTabProps {
    project: Project;
    onRefresh?: () => void;
}

// ─── Main Component ──────────────────────────────────────────────────

export default function PackageScheduleTab({ project, onRefresh }: PackageScheduleTabProps) {
    const [syncing, setSyncing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSyncFromPackage = useCallback(async () => {
        if (!confirm('This will reset the schedule to match the original package. Any custom changes will be lost. Continue?')) return;
        try {
            setSyncing(true);
            await api.schedule.syncFromPackage.project(project.id);
            onRefresh?.();
            // Increment key to force the editor to remount and re-fetch fresh data
            setRefreshKey(k => k + 1);
        } catch (err) {
            console.error('Sync from package failed:', err);
            alert('Failed to sync from package. Please try again.');
        } finally {
            setSyncing(false);
        }
    }, [project.id, onRefresh]);

    return (
        <InstanceScheduleEditor
            key={`schedule-${project.id}-${refreshKey}`}
            owner={{ type: 'project', id: project.id }}
            sourcePackageId={project.source_package_id}
            onSyncFromPackage={handleSyncFromPackage}
            syncing={syncing}
        />
    );
}
