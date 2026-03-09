/**
 * useScheduleSnapshotData — shared hook for fetching cloned schedule snapshot data.
 *
 * Works with both project-owned and inquiry-owned snapshots via the
 * dual-owner API endpoints added in Phase 2.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────

export type SnapshotOwner =
  | { type: 'project'; id: number }
  | { type: 'inquiry'; id: number };

export interface ScheduleSnapshotSummary {
  owner_id: number;
  owner_type: string;
  source_package_id: number | null;
  source_package_name: string | null;
  event_day_count: number;
  activity_count: number;
  operator_count: number;
  subject_count: number;
  location_slot_count: number;
  film_count: number;
}

export interface ScheduleSnapshotData {
  summary: ScheduleSnapshotSummary | null;
  eventDays: any[];
  activities: any[];
  operators: any[];
  subjects: any[];
  locations: any[];
  films: any[];
}

export interface UseScheduleSnapshotResult {
  data: ScheduleSnapshotData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Whether any snapshot data exists (at least one event day) */
  hasData: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function getApi(owner: SnapshotOwner) {
  return owner.type === 'project'
    ? api.schedule.projectPackageSnapshot
    : api.inquiries.scheduleSnapshot;
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useScheduleSnapshotData(
  owner: SnapshotOwner | null,
): UseScheduleSnapshotResult {
  const [data, setData] = useState<ScheduleSnapshotData>({
    summary: null,
    eventDays: [],
    activities: [],
    operators: [],
    subjects: [],
    locations: [],
    films: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!owner) return;

    setLoading(true);
    setError(null);

    try {
      const svc = getApi(owner);
      const id = owner.id;

      // Fetch summary first — if it 404s the owner has no snapshot
      const summary: ScheduleSnapshotSummary = await svc.getSummary(id);

      // Parallel-fetch all entity lists
      const [eventDays, activities, operators, subjects, locations, films] =
        await Promise.all([
          svc.getEventDays(id),
          svc.getActivities(id),
          svc.getOperators(id),
          svc.getSubjects(id),
          svc.getLocations(id),
          svc.getFilms(id),
        ]);

      setData({ summary, eventDays, activities, operators, subjects, locations, films });
    } catch (err: any) {
      // A 404 just means no snapshot exists yet — not an error for UI
      if (err?.status === 404 || err?.message?.includes('404')) {
        setData({
          summary: null,
          eventDays: [],
          activities: [],
          operators: [],
          subjects: [],
          locations: [],
          films: [],
        });
      } else {
        setError(err?.message || 'Failed to load schedule snapshot');
      }
    } finally {
      setLoading(false);
    }
  }, [owner?.type, owner?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    hasData: data.eventDays.length > 0,
  };
}

export default useScheduleSnapshotData;
