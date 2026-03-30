import { useState, useEffect } from "react";
import { scheduleApi } from "@/features/workflow/scheduling/api";

interface NormalizedActivity {
  id: number;
  name: string;
  package_event_day_id: number;
  duration_minutes?: number;
  moments?: unknown[];
  [key: string]: unknown;
}

interface NormalizedEventDay {
  id: number;
  _joinId: number;
  name: string;
  order_index?: number;
  [key: string]: unknown;
}

interface UsePackageActivitiesResult {
  pkgActivities: NormalizedActivity[];
  pkgEventDays: NormalizedEventDay[];
  activitiesLoading: boolean;
}

const normalizeActivity = (a: any): NormalizedActivity => ({
  ...a,
  package_event_day_id: a.package_event_day_id ?? a.project_event_day_id,
});

const normalizeEventDay = (d: any): NormalizedEventDay => ({
  ...d,
  _joinId: d._joinId ?? d.id,
});

/**
 * Loads activities and event-days for the relevant owner context
 * (package template, project instance, or inquiry instance).
 *
 * Extracted from CreateSceneDialog to enable React Query migration (idea D)
 * and to decouple data-fetching from rendering.
 */
export function usePackageActivities(
  open: boolean,
  packageId: number | null | undefined,
  instanceOwnerType: "project" | "inquiry" | undefined,
  instanceOwnerId: number | null | undefined,
): UsePackageActivitiesResult {
  const [pkgActivities, setPkgActivities] = useState<NormalizedActivity[]>([]);
  const [pkgEventDays, setPkgEventDays] = useState<NormalizedEventDay[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setActivitiesLoading(true);

    let request: Promise<[any[], any[]]>;
    if (instanceOwnerType === "project" && instanceOwnerId) {
      request = Promise.all([
        scheduleApi.projectAllActivities.getAll(instanceOwnerId),
        scheduleApi.projectInstanceEventDays.getAll(instanceOwnerId),
      ]);
    } else if (instanceOwnerType === "inquiry" && instanceOwnerId) {
      request = Promise.all([
        scheduleApi.inquiryActivities.getAll(instanceOwnerId),
        scheduleApi.inquiryEventDays.getAll(instanceOwnerId),
      ]);
    } else if (packageId) {
      request = Promise.all([
        scheduleApi.packageActivities.getAll(packageId),
        scheduleApi.packageEventDays.getAll(packageId),
      ]);
    } else {
      setPkgActivities([]);
      setPkgEventDays([]);
      setActivitiesLoading(false);
      return;
    }

    request
      .then(([acts, days]) => {
        setPkgActivities((acts ?? []).map(normalizeActivity));
        setPkgEventDays((days ?? []).map(normalizeEventDay));
      })
      .catch(() => {
        setPkgActivities([]);
        setPkgEventDays([]);
      })
      .finally(() => setActivitiesLoading(false));
  }, [open, packageId, instanceOwnerId, instanceOwnerType]);

  return { pkgActivities, pkgEventDays, activitiesLoading };
}
