import { useState, useEffect } from 'react';
import { useBrand } from '@/app/providers/BrandProvider';
import { taskLibraryApi } from '../api';
import { api } from '@/lib/api';
import type { TaskLibrary, TaskLibraryByPhase, JobRole, SkillRoleMapping, Contributor } from '@/lib/types';

export function useTaskLibraryData() {
    const { currentBrand } = useBrand();
    const [tasksByPhase, setTasksByPhase] = useState<TaskLibraryByPhase>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [allMappings, setAllMappings] = useState<SkillRoleMapping[]>([]);
    const [contributors, setContributors] = useState<Contributor[]>([]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const grouped = await taskLibraryApi.getGroupedByPhase();
            setTasksByPhase(grouped);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const loadJobRoles = async () => {
        try {
            const roles = await api.jobRoles.getAll();
            setJobRoles(roles);
        } catch (err) {
            console.error('Failed to load job roles:', err);
        }
    };

    const loadAllMappings = async () => {
        try {
            const mappings = await api.skillRoleMappings.getAll();
            setAllMappings(mappings);
        } catch (err) {
            console.error('Failed to load skill-role mappings:', err);
        }
    };

    const loadContributors = async () => {
        try {
            const data = await api.contributors.getAll();
            setContributors(data);
        } catch (err) {
            console.error('Failed to load contributors:', err);
        }
    };

    useEffect(() => {
        if (currentBrand) {
            loadTasks();
            loadJobRoles();
            loadAllMappings();
            loadContributors();
        }
    }, [currentBrand]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        tasksByPhase,
        setTasksByPhase,
        loading,
        error,
        setError,
        jobRoles,
        allMappings,
        loadAllMappings,
        contributors: contributors as Array<{ id: number; contact: { first_name?: string; last_name?: string } }>,
        loadTasks,
    };
}

export function useTaskLibraryPhaseExpand() {
    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
    const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

    const handlePhaseToggle = (phase: string) => {
        setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
    };

    const handlePhaseCardClick = (phase: string) => {
        const newExpanded: Record<string, boolean> = {};
        ['Lead', 'Inquiry', 'Booking', 'Creative_Development', 'Pre_Production', 'Production', 'Post_Production', 'Delivery'].forEach(p => {
            newExpanded[p] = p === phase;
        });
        setExpandedPhases(newExpanded);
    };

    const handleToggleExpand = (taskId: number) => {
        setExpandedTaskId(prev => (prev === taskId ? null : taskId));
    };

    return { expandedPhases, expandedTaskId, handlePhaseToggle, handlePhaseCardClick, handleToggleExpand };
}
