import { useState, useCallback } from "react";
import type { SceneSchedule } from "../types/schedule-panel.types";
import { cloneScheduleMap } from "../utils/schedule-helpers";

export function useScheduleHistory(scheduleMap: Map<number, SceneSchedule>, setScheduleMap: (m: Map<number, SceneSchedule>) => void, setDirty: (d: boolean) => void) {
  const [history, setHistory] = useState<Map<number, SceneSchedule>[]>([]);
  const [future, setFuture] = useState<Map<number, SceneSchedule>[]>([]);

  const pushHistorySnapshot = useCallback((snapshot: Map<number, SceneSchedule>) => {
    setHistory((prev) => {
      const next = [...prev, cloneScheduleMap(snapshot)];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
    setFuture([]);
  }, []);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setFuture((f) => [...f, cloneScheduleMap(scheduleMap)]);
      setScheduleMap(cloneScheduleMap(last));
      setDirty(true);
      return prev.slice(0, -1);
    });
  }, [scheduleMap, setScheduleMap, setDirty]);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setHistory((h) => [...h, cloneScheduleMap(scheduleMap)]);
      setScheduleMap(cloneScheduleMap(last));
      setDirty(true);
      return prev.slice(0, -1);
    });
  }, [scheduleMap, setScheduleMap, setDirty]);

  return { history, setHistory, future, setFuture, pushHistorySnapshot, handleUndo, handleRedo };
}
