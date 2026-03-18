import { useCallback, useEffect, useMemo, useState } from "react";
import type { SceneSubjectAssignment, SubjectPriority } from "@/lib/types/domains/subjects";
import { request } from "@/hooks/utils/api";

interface UseMomentSubjectsProps {
  momentId?: number | null;
}

export const useMomentSubjects = ({ momentId }: UseMomentSubjectsProps) => {
  const [subjects, setSubjects] = useState<SceneSubjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeMomentId = useMemo(() => (typeof momentId === "number" ? momentId : null), [momentId]);

  const loadSubjects = useCallback(async () => {
    if (!safeMomentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<SceneSubjectAssignment[]>(`/subjects/moments/${safeMomentId}`);
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load moment subjects");
    } finally {
      setIsLoading(false);
    }
  }, [safeMomentId]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const addSubject = useCallback(async (subjectId: number, priority: SubjectPriority) => {
    if (!safeMomentId) return;
    const created = await request<SceneSubjectAssignment>(`/subjects/moments/${safeMomentId}/assign`, {
      method: "POST",
      body: JSON.stringify({ subject_id: subjectId, priority }),
    });
    setSubjects((prev) => {
      if (!created) return prev;
      if (prev.some((item) => item.subject_id === created.subject_id)) return prev;
      return [...prev, created];
    });
    return created;
  }, [safeMomentId]);

  const removeSubject = useCallback(async (subjectId: number) => {
    if (!safeMomentId) return;
    await request<void>(`/subjects/moments/${safeMomentId}/subjects/${subjectId}`, {
      method: "DELETE",
    });
    setSubjects((prev) => prev.filter((item) => item.subject_id !== subjectId));
  }, [safeMomentId]);

  return {
    subjects,
    isLoading,
    error,
    reload: loadSubjects,
    addSubject,
    removeSubject,
  };
};
