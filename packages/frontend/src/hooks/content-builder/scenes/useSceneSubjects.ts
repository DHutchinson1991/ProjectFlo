import { useCallback, useEffect, useMemo, useState } from "react";
import type { SceneSubjectAssignment, SubjectPriority } from "@/lib/types/domains/subjects";
import { request } from "@/hooks/utils/api";

interface UseSceneSubjectsProps {
    sceneIds: number[];
}

export const useSceneSubjects = ({ sceneIds }: UseSceneSubjectsProps) => {
    const [subjects, setSubjects] = useState<SceneSubjectAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const primarySceneId = useMemo(() => sceneIds.find((id) => typeof id === "number") ?? null, [sceneIds]);

    const loadSubjects = useCallback(async () => {
        if (!primarySceneId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await request<SceneSubjectAssignment[]>(`/subjects/scenes/${primarySceneId}`);
            setSubjects(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load scene subjects");
        } finally {
            setIsLoading(false);
        }
    }, [primarySceneId]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    const addSubject = useCallback(async (subjectId: number, priority: SubjectPriority) => {
        if (!sceneIds.length) return;
        const results = await Promise.all(
            sceneIds.map((sceneId) => request<SceneSubjectAssignment>(`/subjects/scenes/${sceneId}/assign`, {
                method: "POST",
                body: JSON.stringify({ subject_id: subjectId, priority }),
            }))
        );
        const primary = results[0];
        setSubjects((prev) => {
            if (!primary) return prev;
            if (prev.some((item) => item.subject_id === primary.subject_id)) return prev;
            return [...prev, primary];
        });
        return primary;
    }, [sceneIds]);

    const removeSubject = useCallback(async (subjectId: number) => {
        if (!sceneIds.length) return;
        await Promise.all(
            sceneIds.map((sceneId) => request<void>(`/subjects/scenes/${sceneId}/subjects/${subjectId}`, {
                method: "DELETE",
            }))
        );
        setSubjects((prev) => prev.filter((item) => item.subject_id !== subjectId));
    }, [sceneIds]);

    return {
        subjects,
        isLoading,
        error,
        reload: loadSubjects,
        addSubject,
        removeSubject,
    };
};
