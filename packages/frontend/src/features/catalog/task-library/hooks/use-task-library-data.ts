import { useState, useEffect } from 'react';
import { useBrand } from '@/features/platform/brand';
import { taskLibraryApi } from '../api';
import { jobRolesApi, skillRoleMappingsApi, userAccountsApi } from '@/features/workflow/crew/api';
import type { TaskLibrary, TaskLibraryByPhase, JobRole, SkillRoleMapping, Crew } from '@/features/catalog/task-library/types';

export function useTaskLibraryData() {
    const { currentBrand } = useBrand();
    const [tasksByPhase, setTasksByPhase] = useState<TaskLibraryByPhase>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [allMappings, setAllMappings] = useState<SkillRoleMapping[]>([]);
    const [crew, setCrew] = useState<Crew[]>([]);

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
            const roles = await jobRolesApi.getAll();
            setJobRoles(roles);
        } catch (err) {
            console.error('Failed to load job roles:', err);
        }
    };

    const loadAllMappings = async () => {
        try {
            const mappings = await skillRoleMappingsApi.getAll();
            setAllMappings(mappings);
        } catch (err) {
            console.error('Failed to load skill-role mappings:', err);
        }
    };

    const loadCrew = async () => {
        try {
            const data = await userAccountsApi.getAll();
            setCrew(data);
        } catch (err) {
            console.error('Failed to load crew:', err);
        }
    };

    useEffect(() => {
        if (currentBrand) {
            loadTasks();
            loadJobRoles();
            loadAllMappings();
            loadCrew();
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
        crew: crew as Array<{ id: number; contact: { first_name?: string; last_name?: string } }>,
        loadTasks,
    };
}

export function useTaskLibraryPhaseExpand() {
    const [activePhase, setActivePhase] = useState<string>('Inquiry');
    const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

    const handlePhaseChange = (phase: string) => {
        setActivePhase(phase);
    };

    const handleToggleExpand = (taskId: number) => {
        setExpandedTaskId(prev => (prev === taskId ? null : taskId));
    };

    return { activePhase, expandedTaskId, handlePhaseChange, handleToggleExpand };
}
