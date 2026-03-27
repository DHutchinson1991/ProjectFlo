"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { crewMembersApi } from '@/features/workflow/crew/api';
import type { ActiveTask, CrewMember } from '@/features/workflow/tasks/types';
import { taskLibraryApi } from '@/features/catalog/task-library';
import { activeTasksApi } from '../api';
import { groupTasks } from '../utils/group-tasks';
import { getNavigationUrl } from '../utils/task-display-utils';
import type { GroupMode } from '../constants';

export function useActiveTasks() {
    const router = useRouter();
    const [tasks, setTasks] = useState<ActiveTask[]>([]);
    const [crewMembers, setContributors] = useState<CrewMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [groupMode, setGroupMode] = useState<GroupMode>('project');
    const [showAuto, setShowAuto] = useState(() => {
        if (typeof window === 'undefined') return true;
        const s = localStorage.getItem('pfo_tasks_show_auto');
        return s === null ? true : s === 'true';
    });

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const [data, contribs] = await Promise.all([
                activeTasksApi.getAll(),
                crewMembersApi.getAll(), // TODO: migrate when contributors feature is created
            ]);
            setTasks(data);
            setContributors(contribs);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    const handleSyncFromLibrary = useCallback(async () => {
        try {
            setSyncing(true);
            await taskLibraryApi.syncContributors();
            await loadTasks();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sync failed');
        } finally {
            setSyncing(false);
        }
    }, [loadTasks]);

    const handleAssign = useCallback(async (taskId: number, source: 'inquiry' | 'project', assigneeId: number | null, taskKind: 'task' | 'subtask' = 'task') => {
        if (taskKind === 'subtask') return;
        const contributor = assigneeId ? contributors.find(c => c.id === assigneeId) : null;
        const newAssignee = contributor ? { id: crewMember.id, name: contributor.full_name, email: contributor.email } : null;
        setTasks(prev => prev.map(t => t.id === taskId && t.source === source ? { ...t, assignee: newAssignee } : t));
        try { await activeTasksApi.assign(taskId, source, assigneeId, taskKind); } catch { loadTasks(); }
    }, [crewMembers, loadTasks]);

    const handleNavigateToTask = useCallback((task: ActiveTask) => {
        const url = getNavigationUrl(task);
        if (url) router.push(url);
    }, [router]);

    const handleToggle = useCallback(async (task: ActiveTask) => {
        if (task.is_auto_only || task.is_task_group) return;
        const newStatus = task.status === 'Completed' ? 'To_Do' : 'Completed';
        setTasks(prev => {
            let updated = prev.map(t =>
                t.id === task.id && t.source === task.source
                    ? { ...t, status: newStatus, completed_at: newStatus === 'Completed' ? new Date().toISOString() : null }
                    : t
            );
            if (task.task_kind === 'subtask' && task.subtask_parent_id) {
                const siblings = updated.filter(t => t.subtask_parent_id === task.subtask_parent_id);
                const allDone = siblings.every(t => t.status === 'Completed');
                updated = updated.map(t =>
                    t.id === task.subtask_parent_id && t.source === task.source
                        ? { ...t, status: allDone ? 'Completed' : 'To_Do', completed_at: allDone ? new Date().toISOString() : null } : t
                );
            } else if (task.parent_task_id) {
                const siblings = updated.filter(t => t.parent_task_id === task.parent_task_id && !t.is_task_group && t.task_kind !== 'subtask');
                const allDone = siblings.every(t => t.status === 'Completed');
                updated = updated.map(t =>
                    t.id === task.parent_task_id && t.source === task.source
                        ? { ...t, status: allDone ? 'Completed' : 'To_Do', completed_at: allDone ? new Date().toISOString() : null } : t
                );
            }
            return updated;
        });
        try { await activeTasksApi.toggle(task.id, task.source, task.task_kind ?? 'task'); } catch { loadTasks(); }
    }, [loadTasks]);

    const handleShowAutoToggle = useCallback(() => {
        const next = !showAuto;
        setShowAuto(next);
        localStorage.setItem('pfo_tasks_show_auto', String(next));
    }, [showAuto]);

    const filteredTasks = useMemo(() => tasks.filter(t => {
        if (t.task_kind === 'subtask') return true;
        if (!showAuto && t.is_auto_only) return false;
        if (statusFilter === 'active' && (t.status === 'Completed' || t.status === 'Archived')) return false;
        if (statusFilter !== 'active' && statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                t.name.toLowerCase().includes(q) || t.context_label.toLowerCase().includes(q) ||
                t.assignee?.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) ||
                t.phase.toLowerCase().replace(/_/g, ' ').includes(q)
            );
        }
        return true;
    }), [tasks, statusFilter, sourceFilter, searchQuery, showAuto]);

    const groups = useMemo(() => groupTasks(filteredTasks, groupMode), [filteredTasks, groupMode]);

    return {
        tasks, crewMembers, loading, syncing, error,
        searchQuery, statusFilter, sourceFilter, groupMode, showAuto,
        filteredTasks, groups,
        setSearchQuery, setStatusFilter, setSourceFilter, setGroupMode,
        loadTasks, handleSyncFromLibrary, handleAssign, handleNavigateToTask, handleToggle, handleShowAutoToggle,
    };
}
