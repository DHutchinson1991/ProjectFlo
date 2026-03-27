import { useState, useEffect, useCallback } from "react";
import { scheduleApi } from "@/features/workflow/scheduling/api";
import type { SchedulePreset } from "../types/schedule-panel.types";

export function useSchedulePresets(brandId: number | undefined) {
  const [presetList, setPresetList] = useState<SchedulePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [presetNameDraft, setPresetNameDraft] = useState("");

  const loadPresets = useCallback(async () => {
    if (!brandId) {
      setPresetList([]);
      setSelectedPresetId(null);
      return;
    }
    const presets = await scheduleApi.presets.getAll(brandId);
    const normalized = (presets as SchedulePreset[]) ?? [];
    setPresetList(normalized);

    if (normalized.length === 0) {
      setSelectedPresetId(null);
      setPresetNameDraft("");
      return;
    }

    setSelectedPresetId((prev) => {
      const keep = prev && normalized.some((p) => p.id === prev) ? prev : normalized[0].id;
      const selected = normalized.find((p) => p.id === keep);
      setPresetNameDraft(selected?.name ?? "");
      return keep;
    });
  }, [brandId]);

  useEffect(() => {
    loadPresets().catch((err) => {
      console.error("Failed to load schedule presets", err);
    });
  }, [loadPresets]);

  return {
    presetList,
    selectedPresetId,
    setSelectedPresetId,
    presetNameDraft,
    setPresetNameDraft,
    loadPresets,
  };
}
