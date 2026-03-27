"use client";

import { useState, useEffect } from "react";
import { equipmentApi } from "@/features/workflow/equipment/api";
import { filmsApi } from "../api";
import { EquipmentSummary, FilmEquipmentAssignmentsBySlot } from "@/features/content/films/types/film-equipment.types";
import { Equipment, EquipmentAvailability, EquipmentCategory } from "@/features/workflow/equipment/types/equipment.types";
import { buildAssignmentsBySlot } from "@/features/content/films/utils/equipmentAssignments";
import {
  buildSelectionState, buildSlotSelectionMap, checkAssignmentsComplete,
  checkAssignmentChanges, syncEquipmentAssignments,
} from "../utils/equipment-panel-utils";

export function useFilmEquipmentPanel(
  filmId: number,
  onEquipmentChange?: (summary: EquipmentSummary) => void,
  onEquipmentAssignmentsChange?: (assignments: FilmEquipmentAssignmentsBySlot) => void
) {
  const [summary, setSummary] = useState<EquipmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<{ cameras: number; audio: number } | null>(null);
  const [equipmentOptions, setEquipmentOptions] = useState<{ cameras: Equipment[]; audio: Equipment[] }>({
    cameras: [], audio: [],
  });
  const [assignmentsBySlot, setAssignmentsBySlot] = useState<FilmEquipmentAssignmentsBySlot>({});
  const [cameraSelections, setCameraSelections] = useState<Record<number, number | "">>({});
  const [audioSelections, setAudioSelections] = useState<Record<number, number | "">>({});
  const [cameraQty, setCameraQty] = useState(0);
  const [audioQty, setAudioQty] = useState(0);

  const loadEquipment = async (notifyChange = false) => {
    try {
      setLoading(true);
      setError(null);
      const [tracks, assignments, equipmentGrouped] = await Promise.all([
        filmsApi.tracks.getAll(filmId),
        filmsApi.equipmentAssignments.getAll(filmId),
        equipmentApi.getGroupedByCategory(),
      ]);

      const trackList = tracks as unknown as Array<{ type?: string }>;
      const cameras = trackList.filter((t) => t.type === "VIDEO").length;
      const audio = trackList.filter((t) => t.type === "AUDIO").length;

      const camerasLibrary = (equipmentGrouped[EquipmentCategory.CAMERA]?.equipment || [])
        .filter((item) => item.is_active && item.availability_status === EquipmentAvailability.AVAILABLE);
      const audioLibrary = (equipmentGrouped[EquipmentCategory.AUDIO]?.equipment || [])
        .filter((item) => item.is_active && item.availability_status === EquipmentAvailability.AVAILABLE);

      setEquipmentOptions({ cameras: camerasLibrary, audio: audioLibrary });
      setCameraQty(cameras);
      setAudioQty(audio);

      const slotMap = buildAssignmentsBySlot(assignments);
      setAssignmentsBySlot(slotMap);
      onEquipmentAssignmentsChange?.(slotMap);

      setCameraSelections((prev) => buildSelectionState(cameras, "camera", slotMap, prev));
      setAudioSelections((prev) => buildSelectionState(audio, "audio", slotMap, prev));

      const summaryData: EquipmentSummary = { cameras, audio, music: 0, totalTracks: cameras + audio, tracks };
      setSummary(summaryData);
      if (notifyChange) onEquipmentChange?.(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEquipment(); }, [filmId]);

  useEffect(() => {
    setCameraSelections((prev) => buildSelectionState(cameraQty, "camera", assignmentsBySlot, prev));
  }, [cameraQty, assignmentsBySlot]);

  useEffect(() => {
    setAudioSelections((prev) => buildSelectionState(audioQty, "audio", assignmentsBySlot, prev));
  }, [audioQty, assignmentsBySlot]);

  const syncAssignments = async () => {
    const nextSelections = buildSlotSelectionMap(cameraSelections, audioSelections);
    const updatedAssignments = await syncEquipmentAssignments(filmsApi, filmId, assignmentsBySlot, nextSelections);
    const updatedBySlot = buildAssignmentsBySlot(updatedAssignments);
    setAssignmentsBySlot(updatedBySlot);
    onEquipmentAssignmentsChange?.(updatedBySlot);
  };

  const saveEquipment = async (nextCameras: number, nextAudio: number, allowRemoval: boolean) => {
    try {
      setSaving(true);
      setError(null);
      await filmsApi.equipment.update(filmId, {
        num_cameras: nextCameras, num_audio: nextAudio, allow_removal: allowRemoval,
      });
      await syncAssignments();
      await loadEquipment(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save equipment");
    } finally {
      setSaving(false);
    }
  };

  const isComplete = () => checkAssignmentsComplete(cameraSelections, audioSelections, cameraQty, audioQty);

  const hasChanges = () => {
    if (!summary) return false;
    const nextSelections = buildSlotSelectionMap(cameraSelections, audioSelections);
    return cameraQty !== summary.cameras || audioQty !== summary.audio
      || checkAssignmentChanges(assignmentsBySlot, nextSelections);
  };

  const handleSave = async () => {
    if (!summary) return;
    if (!isComplete()) {
      setError("Please assign equipment for each camera and audio slot before saving.");
      return;
    }
    const isReducing = cameraQty < summary.cameras || audioQty < summary.audio;
    if (isReducing) {
      setPendingCounts({ cameras: cameraQty, audio: audioQty });
      setConfirmOpen(true);
      return;
    }
    await saveEquipment(cameraQty, audioQty, false);
  };

  const handleConfirmRemoval = async () => {
    if (!pendingCounts) { setConfirmOpen(false); return; }
    setConfirmOpen(false);
    await saveEquipment(pendingCounts.cameras, pendingCounts.audio, true);
    setPendingCounts(null);
  };

  return {
    summary, loading, saving, error, confirmOpen, setConfirmOpen,
    equipmentOptions, cameraSelections, setCameraSelections,
    audioSelections, setAudioSelections,
    cameraQty, setCameraQty, audioQty, setAudioQty,
    isComplete, hasChanges, handleSave, handleConfirmRemoval,
  };
}
