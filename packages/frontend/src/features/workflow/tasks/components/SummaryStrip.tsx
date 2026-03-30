"use client";

import React from 'react';
import type { ActiveTask } from '@/features/workflow/tasks/types';
import { sumEstimatedHours } from '@/shared/utils/hours';
import { isDateOverdue } from '@/shared/utils/taskDates';
import { useBrandTimezone } from '@/features/platform/brand';
import { TaskSummaryStrip } from '@/shared/ui/tasks';

export function SummaryStrip({ tasks }: { tasks: ActiveTask[] }) {
    const timezone = useBrandTimezone();
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'To_Do').length;
    const ready = tasks.filter(t => t.status === 'Ready_to_Start').length;
    const inProgress = tasks.filter(t => t.status === 'In_Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const overdue = tasks.filter(t => isDateOverdue(t.due_date, t.status, timezone)).length;
    const totalHours = sumEstimatedHours(tasks);

    const items = [
        { label: 'Total', value: total, color: '#579BFC' },
        { label: 'To Do', value: todo, color: '#C4C4C4' },
        { label: 'Ready', value: ready, color: '#FDAB3D' },
        { label: 'Working', value: inProgress, color: '#579BFC' },
        { label: 'Done', value: completed, color: '#00C875' },
        ...(overdue > 0 ? [{ label: 'Overdue', value: overdue, color: '#D83A52' }] : []),
        { label: 'Hours', value: `${totalHours.toFixed(1)}h`, color: '#A25DDC' },
    ];

    return <TaskSummaryStrip items={items} />;
}
