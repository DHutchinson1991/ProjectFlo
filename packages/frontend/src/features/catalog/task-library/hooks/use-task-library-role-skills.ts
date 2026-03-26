import { taskLibraryApi } from '../api';
import type { TaskLibrary, TaskLibraryByPhase, JobRole } from '@/lib/types';

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
            if (updated) { r.default_contributor_id = updated.default_contributor_id ?? null; r.default_contributor = updated.default_contributor ?? null; }
            return r;
        }));
    };

    const handleUpdateContributor = async (taskId: number, contributorId: number | null) => {
        try {
            const updated = await taskLibraryApi.update(taskId, { default_contributor_id: contributorId as number });
            const newId = updated?.default_contributor_id ?? contributorId;
            const newContrib = updated?.default_contributor ?? null;
            setTasksByPhase(prev => applyTaskUpdate(prev, taskId, t => ({
                ...t, default_contributor_id: newId, default_contributor: newContrib,
            })));
        } catch (err) {
            console.error('Failed to update contributor:', err);
            setError('Failed to save contributor assignment.');
        }
    };

    return { handleUpdateRoleSkills, handleUpdateContributor };
}
