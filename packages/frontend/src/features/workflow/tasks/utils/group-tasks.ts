import React from 'react';
import type { ActiveTask } from '@/features/workflow/tasks/types';
import {
    STATUS_CONFIG, STATUS_ORDER, PHASE_COLORS, PHASE_LABELS, PHASE_ORDER,
    DATE_GROUP_ORDER, DATE_GROUP_COLORS, type GroupMode,
} from '../constants';
import { getDateGroup, avatarColor } from './task-display-utils';
import {
    ProjectGroupIcon, StatusGroupIcon, PersonGroupIcon, DateGroupIcon,
} from '../components/GroupIcons';

export interface TaskGroupData {
    key: string;
    title: string;
    color: string;
    tasks: ActiveTask[];
    icon?: React.ReactNode;
    badge?: string;
}

export function groupTasks(tasks: ActiveTask[], mode: GroupMode, timezone = 'UTC'): TaskGroupData[] {
    switch (mode) {
        case 'project': {
            const map = new Map<string, ActiveTask[]>();
            tasks.forEach(t => {
                const key = t.source === 'project' ? `project-${t.project_id}` : `inquiry-${t.inquiry_id}`;
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(t);
            });
            return [...map.entries()].map(([key, items]) => {
                const first = items[0];
                const isProject = first.source === 'project';
                return {
                    key,
                    title: first.context_label,
                    color: isProject ? '#579BFC' : '#00C875',
                    tasks: items,
                    icon: React.createElement(ProjectGroupIcon, { isProject }),
                    badge: first.event_date
                        ? new Date(first.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : undefined,
                };
            });
        }
        case 'status': {
            return STATUS_ORDER
                .map(status => ({
                    key: status,
                    title: STATUS_CONFIG[status]?.label || status,
                    color: STATUS_CONFIG[status]?.bg || '#676879',
                    tasks: tasks.filter(t => t.status === status),
                    icon: React.createElement(StatusGroupIcon, { status }),
                }))
                .filter(g => g.tasks.length > 0);
        }
        case 'person': {
            const map = new Map<string, ActiveTask[]>();
            tasks.forEach(t => {
                const key = t.assignee ? `person-${t.assignee.id}` : 'unassigned';
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(t);
            });
            return [...map.entries()]
                .sort((a, b) => {
                    if (a[0] === 'unassigned') return -1;
                    if (b[0] === 'unassigned') return 1;
                    return a[1][0].assignee!.name.localeCompare(b[1][0].assignee!.name);
                })
                .map(([key, items]) => {
                    const assignee = items[0].assignee;
                    const color = assignee ? avatarColor(assignee.name) : '#676879';
                    return {
                        key,
                        title: assignee ? assignee.name : 'Unassigned',
                        color,
                        tasks: items,
                        icon: React.createElement(PersonGroupIcon, { assignee: assignee ?? null }),
                        badge: assignee?.email,
                    };
                });
        }
        case 'date': {
            return DATE_GROUP_ORDER
                .map(group => ({
                    key: group,
                    title: group,
                    color: DATE_GROUP_COLORS[group] || '#676879',
                    tasks: tasks.filter(t => getDateGroup(t.due_date, timezone) === group),
                    icon: React.createElement(DateGroupIcon, { group }),
                }))
                .filter(g => g.tasks.length > 0);
        }
        case 'phase':
        default: {
            return PHASE_ORDER
                .map(phase => ({
                    key: phase,
                    title: PHASE_LABELS[phase] || phase.replace(/_/g, ' '),
                    color: PHASE_COLORS[phase] || '#579BFC',
                    tasks: tasks.filter(t => t.phase === phase),
                }))
                .filter(g => g.tasks.length > 0);
        }
    }
}
