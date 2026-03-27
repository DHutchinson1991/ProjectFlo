"use client";

import React from 'react';
import type { ActiveTask } from '@/features/workflow/tasks/types';
import { sumEstimatedHours } from '@/shared/utils/hours';
import { TaskSummaryStrip } from '@/shared/ui/tasks';

export function SummaryStrip({ tasks }: { tasks: ActiveTask[] }) {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'To_Do').length;
    const ready = tasks.filter(t => t.status === 'Ready_to_Start').length;
    const inProgress = tasks.filter(t => t.status === 'In_Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const overdue = tasks.filter(t => {
        if (!t.due_date || t.status === 'Completed') return false;
        return new Date(t.due_date) < new Date();
    }).length;
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
