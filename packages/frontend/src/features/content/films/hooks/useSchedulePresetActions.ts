import { useCallback } from "react";
import { scheduleApi } from "@/features/workflow/scheduling/api";
import type { SceneSchedule, SchedulePreset } from "../types/schedule-panel.types";

interface UseSchedulePresetActionsParams {
  brandId?: number;
  presetList: SchedulePreset[];
  selectedPresetId: number | null;
  setSelectedPresetId: React.Dispatch<React.SetStateAction<number | null>>;
  presetNameDraft: string;
  setPresetNameDraft: React.Dispatch<React.SetStateAction<string>>;
  scheduleMap: Map<number, SceneSchedule>;
  setScheduleMap: React.Dispatch<React.SetStateAction<Map<number, SceneSchedule>>>;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  pushHistorySnapshot: (snapshot: Map<number, SceneSchedule>) => void;
  loadPresets: () => Promise<void>;
}

export function useSchedulePresetActions({
  brandId, presetList, selectedPresetId, setSelectedPresetId,
  presetNameDraft, setPresetNameDraft, scheduleMap, setScheduleMap,
  setDirty, setError, pushHistorySnapshot, loadPresets,
}: UseSchedulePresetActionsParams) {
  const handleSavePreset = useCallback(() => {
    const run = async () => {
      if (!brandId) { setError("Brand is required to save shared presets."); return; }
      const name = presetNameDraft.trim();
      if (!name) { setError("Enter a preset name first."); return; }
      const saved = await scheduleApi.presets.upsert(brandId, { name, schedule_data: Array.from(scheduleMap.values()) }) as { id: number; name: string };
      await loadPresets();
      setSelectedPresetId(saved.id);
      setPresetNameDraft(saved.name);
      setError(null);
    };
    run().catch(() => setError("Failed to save preset"));
  }, [brandId, presetNameDraft, scheduleMap, loadPresets]);

  const handleApplyPreset = useCallback(() => {
    const selectedPreset = presetList.find((p) => p.id === selectedPresetId);
    if (!selectedPreset) { setError("Select a preset to apply."); return; }
    pushHistorySnapshot(scheduleMap);
    const next = new Map<number, SceneSchedule>();
    for (const schedule of selectedPreset.schedule_data ?? []) next.set(schedule.scene_id, schedule);
    setScheduleMap(next);
    setDirty(true);
    setError(null);
  }, [selectedPresetId, presetList, scheduleMap, pushHistorySnapshot]);

  const handleRenamePreset = useCallback(() => {
    const run = async () => {
      if (!brandId) { setError("Brand is required to rename shared presets."); return; }
      if (!selectedPresetId) { setError("Select a preset to rename."); return; }
      const newName = presetNameDraft.trim();
      if (!newName) { setError("Enter a new preset name."); return; }
      const renamed = await scheduleApi.presets.rename(brandId, selectedPresetId, newName) as { id: number; name: string };
      await loadPresets();
      setSelectedPresetId(renamed.id);
      setPresetNameDraft(renamed.name);
      setError(null);
    };
    run().catch(() => setError("Failed to rename preset"));
  }, [brandId, selectedPresetId, presetNameDraft, loadPresets]);

  const handleDeletePreset = useCallback(() => {
    const run = async () => {
      if (!brandId) { setError("Brand is required to delete shared presets."); return; }
      if (!selectedPresetId) { setError("Select a preset to delete."); return; }
      const selected = presetList.find((p) => p.id === selectedPresetId);
      if (typeof window !== "undefined" && !window.confirm(`Delete preset "${selected?.name ?? "this preset"}"?`)) return;
      await scheduleApi.presets.delete(brandId, selectedPresetId);
      await loadPresets();
      setError(null);
    };
    run().catch(() => setError("Failed to delete preset"));
  }, [brandId, selectedPresetId, presetList, loadPresets]);

  return { handleSavePreset, handleApplyPreset, handleRenamePreset, handleDeletePreset };
}
