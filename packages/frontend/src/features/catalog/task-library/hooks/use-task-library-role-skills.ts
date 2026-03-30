import { taskLibraryApi } from '../api';
import type { TaskLibrary, TaskLibraryByPhase, JobRole } from '@/features/catalog/task-library/types';

interface Props {
    setTasksByPhase: React.Dispatch<React.SetStateAction<TaskLibraryByPhase>>;
    setError: (err: string | null) => void;
    jobRoles: JobRole[];
    loadAllMappings: () => void;
}

function applyTaskUpdate(
    tasksByPhase: TaskLibraryByPhase,
    taskId: number,
    apply: (t: TaskLibrary) => TaskLibrary,
): TaskLibraryByPhase {
    const next = { ...tasksByPhase };
    for (const [phase, tasks] of Object.entries(next)) {
        let found = false;
        const updated = tasks.map(t => {
            let r = t;
            if (t.id === taskId) { r = apply(r); found = true; }
            if (t.children) {
                const ci = t.children.findIndex(c => c.id === taskId);
                if (ci !== -1) {
                    found = true;
                    r = { ...r, children: [...t.children.slice(0, ci), apply(t.children[ci]), ...t.children.slice(ci + 1)] };
                }
            }
            return r;
        });
        if (found) { next[phase] = updated; break; }
    }
    return next;
}

export function useTaskLibraryRoleSkills({ setTasksByPhase, setError, jobRoles, loadAllMappings }: Props) {
    const handleUpdateRoleSkills = async (
        taskId: number,
        data: { default_job_role_id?: number | null; skills_needed?: string[] },
    ) => {
        const updated = await taskLibraryApi.update(taskId, { ...data, default_job_role_id: data.default_job_role_id ?? undefined });
        loadAllMappings();
        setTasksByPhase(prev => applyTaskUpdate(prev, taskId, t => {
            const r = { ...t };
            if (data.default_job_role_id !== undefined) {
                r.default_job_role_id = data.default_job_role_id;
                r.default_job_role = data.default_job_role_id ? (jobRoles.find(jr => jr.id === data.default_job_role_id) ?? null) : null;
            }
            if (data.skills_needed !== undefined) r.skills_needed = data.skills_needed;
            if (updated) { r.default_crew_id = updated.default_crew_id ?? null; r.default_crew = updated.default_crew ?? null; }
            return r;
        }));
    };

    const handleUpdateCrew = async (taskId: number, crewId: number | null) => {
        try {
            const updated = await taskLibraryApi.update(taskId, { default_crew_id: crewId as number });
            const newId = updated?.default_crew_id ?? crewId;
            const newContrib = updated?.default_crew ?? null;
            setTasksByPhase(prev => applyTaskUpdate(prev, taskId, t => ({
                ...t, default_crew_id: newId, default_crew: newContrib,
            })));
        } catch (err) {
            console.error('Failed to update crew:', err);
            setError('Failed to save crew assignment.');
        }
    };

    return { handleUpdateRoleSkills, handleUpdateCrew };
}
