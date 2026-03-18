import { useCallback, useState } from "react";
import type {
  CameraSubjectAssignment,
  CreateCameraSubjectAssignmentDto,
  CreateMomentRecordingSetupDto,
  MomentRecordingSetup,
  UpdateCameraSubjectAssignmentDto,
  UpdateMomentRecordingSetupDto,
} from "../../lib/types/domains/recording-setup";
import { request } from "../utils/api";

export const useRecordingSetup = () => {
  const [setup, setSetup] = useState<MomentRecordingSetup | null>(null);
  const [assignments, setAssignments] = useState<CameraSubjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSetup = useCallback(async (momentId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await request<MomentRecordingSetup>(`/recording-setup?momentId=${momentId}`);
      setSetup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recording setup");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSetup = useCallback(async (payload: CreateMomentRecordingSetupDto) => {
    const created = await request<MomentRecordingSetup>("/recording-setup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setSetup(created);
    return created;
  }, []);

  const updateSetup = useCallback(async (id: number, payload: UpdateMomentRecordingSetupDto) => {
    const updated = await request<MomentRecordingSetup>(`/recording-setup/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setSetup(updated);
    return updated;
  }, []);

  const deleteSetup = useCallback(async (id: number) => {
    await request<void>(`/recording-setup/${id}`, { method: "DELETE" });
    setSetup(null);
  }, []);

  const loadAssignments = useCallback(async (setupId: number) => {
    const data = await request<CameraSubjectAssignment[]>(`/camera-assignments?setupId=${setupId}`);
    setAssignments(data);
    return data;
  }, []);

  const createAssignment = useCallback(async (payload: CreateCameraSubjectAssignmentDto) => {
    const created = await request<CameraSubjectAssignment>("/camera-assignments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setAssignments((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateAssignment = useCallback(async (id: number, payload: UpdateCameraSubjectAssignmentDto) => {
    const updated = await request<CameraSubjectAssignment>(`/camera-assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setAssignments((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
    return updated;
  }, []);

  const deleteAssignment = useCallback(async (id: number) => {
    await request<void>(`/camera-assignments/${id}`, { method: "DELETE" });
    setAssignments((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  return {
    setup,
    assignments,
    isLoading,
    error,
    loadSetup,
    createSetup,
    updateSetup,
    deleteSetup,
    loadAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
