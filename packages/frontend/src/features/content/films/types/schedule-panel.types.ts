import type { VisualTimelineScene } from "@/features/workflow/scheduling/shared";

export interface EventDay {
  id: number;
  name: string;
  description?: string | null;
  order_index: number;
}

export interface MomentScheduleItem {
  moment_id: number;
  start_time: string | null;
  duration_minutes: number | null;
}

export interface BeatScheduleItem {
  beat_id: number;
  start_time: string | null;
  duration_minutes: number | null;
}

export interface SceneSchedule {
  id?: number;
  scene_id: number;
  event_day_template_id?: number | null;
  package_activity_id?: number | null;
  scheduled_start_time?: string | null;
  scheduled_duration_minutes?: number | null;
  moment_schedules?: MomentScheduleItem[] | null;
  beat_schedules?: BeatScheduleItem[] | null;
  notes?: string | null;
  event_day?: EventDay | null;
}

export interface ActivityOption {
  id: number;
  name: string;
  color?: string | null;
  package_event_day_id: number;
  start_time?: string | null;
  end_time?: string | null;
}

export interface ScheduleScene {
  id: number;
  name: string;
  mode: "MOMENTS" | "MONTAGE";
  order_index: number;
  duration_seconds?: number | null;
  moments?: Array<{ id: number; name: string; order_index: number; duration: number }>;
  beats?: Array<{ id: number; name: string; order_index: number; duration_seconds: number }>;
  schedule?: SceneSchedule | null;
}

export interface SchedulePreset {
  id: number;
  name: string;
  schedule_data: SceneSchedule[];
}

export interface FilmSchedulePanelProps {
  filmId: number;
  scenes: ScheduleScene[];
  brandId?: number;
  filmName?: string;
  mode?: "film" | "package" | "project";
  contextId?: number;
  packageId?: number | null;
  readOnly?: boolean;
  onScheduleChange?: () => void;
  showEventDayManager?: boolean;
}

export interface UseScheduleActionsParams {
  filmId: number;
  mode: "film" | "package" | "project";
  contextId?: number;
  orderedScenes: ScheduleScene[];
  scheduleMap: Map<number, SceneSchedule>;
  setScheduleMap: React.Dispatch<React.SetStateAction<Map<number, SceneSchedule>>>;
  filmScenes: ScheduleScene[];
  setFilmScenes: React.Dispatch<React.SetStateAction<ScheduleScene[]>>;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  pushHistorySnapshot: (snapshot: Map<number, SceneSchedule>) => void;
  onScheduleChange?: () => void;
}

export { type VisualTimelineScene };
