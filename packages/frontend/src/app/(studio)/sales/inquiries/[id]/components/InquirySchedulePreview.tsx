'use client';

import React, { useState, useCallback } from 'react';
import InstanceScheduleEditor from '@/components/schedule/InstanceScheduleEditor';
import api from '@/lib/api';

interface InquirySchedulePreviewProps {
    inquiryId: number;
    /** Source package ID for task auto-gen preview */
    sourcePackageId?: number | null;
}

export default function InquirySchedulePreview({ inquiryId, sourcePackageId }: InquirySchedulePreviewProps) {
    const [syncing, setSyncing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSyncFromPackage = useCallback(async () => {
        if (!confirm('This will reset the schedule to match the original package. Any custom changes will be lost. Continue?')) return;
        try {
            setSyncing(true);
            await api.schedule.syncFromPackage.inquiry(inquiryId);
            // Increment key to force the editor to remount and re-fetch fresh data
            setRefreshKey(k => k + 1);
        } catch (err) {
            console.error('Sync from package failed:', err);
            alert('Failed to sync from package. Please try again.');
        } finally {
            setSyncing(false);
        }
    }, [inquiryId]);

    return (
        <InstanceScheduleEditor
            key={`schedule-${inquiryId}-${refreshKey}`}
            owner={{ type: 'inquiry', id: inquiryId }}
            onSyncFromPackage={handleSyncFromPackage}
            syncing={syncing}
            sourcePackageId={sourcePackageId}
        />
    );
}
