/**
 * useInstanceScheduleData — editable state hook for project/inquiry schedule instances.
 *
 * Unlike useScheduleSnapshotData (read-only), this hook provides setter functions
 * so that shared schedule components (ActivitiesCard, CrewCard, SubjectsCard,
 * LocationsCard) can mutate state after API calls.
 *
 * Data is fetched from the instance CRUD endpoints (not snapshot read-only
 * endpoints) so the data includes full relation includes needed for editing.
 *
 * NORMALIZATION: Instance data uses `project_event_day_id` / `project_activity_id`
 * field names, but existing shared components expect `package_event_day_id`,
 * `event_day_template_id`, and `package_activity_id`. This hook adds compatible
 * aliases so the same components work with both package and instance data.
 */

import { useState, useEffect, useCallback } from 'react';
import { crewApi, jobRolesApi } from '@/features/workflow/crew/api';
import { equipmentApi } from '@/features/workflow/equipment/api';
import { scheduleApi } from '@/features/workflow/scheduling/api';
import { request } from '@/shared/api/client';

// ─── Normalization Helpers ────────────────────────────────────────────
// Add package-compatible field aliases to instance data so existing
// shared components can use the same field names for filtering.

function normalizeAssignments(assignments: any[] | undefined): any[] | undefined {
  if (!assignments) return assignments;
  return assignments.map((a: any) => ({
    ...a,
    package_activity_id: a.package_activity_id ?? a.project_activity_id,
  }));
}

function normalizeEventDay(day: any): any {
  return {
    ...day,
    // _joinId: used by ActivitiesCard to map activeDayId → activity.package_event_day_id
    _joinId: day._joinId ?? day.id,
    // event_day_template_id: EquipmentCard uses this to filter crew slots for the active day.
    // In instance mode, crew slots have NO event_day_template_id on the DB row — the
    // normalizeCrewSlot function falls back to project_event_day_id (the instance day PK).
    // So the event day must carry its own id here to match, overriding the original
    // template reference that would cause a mismatch.
    event_day_template_id: day.id,
  };
}

function normalizeActivity(act: any): any {
  return {
    ...act,
    // ActivitiesCard filters by: a.package_event_day_id === activeDayJoinId
    package_event_day_id: act.package_event_day_id ?? act.project_event_day_id,
  };
}

function normalizeSubject(subj: any): any {
  return {
    ...subj,
    // SubjectsCard filters by: s.event_day_template_id === activeEventDayId
    event_day_template_id: subj.event_day_template_id ?? subj.project_event_day_id,
    activity_assignments: normalizeAssignments(subj.activity_assignments),
  };
}

function normalizeLocationSlot(slot: any): any {
  return {
    ...slot,
    event_day_template_id: slot.event_day_template_id ?? slot.project_event_day_id,
    activity_assignments: normalizeAssignments(slot.activity_assignments),
  };
}

function normalizeCrewSlot(op: any): any {
  return {
    ...op,
    event_day_template_id: op.event_day_template_id ?? op.project_event_day_id,
    activity_assignments: normalizeAssignments(op.activity_assignments),
    package_activity_id: op.package_activity_id ?? op.project_activity_id,
  };
}

/** Normalize an array using a normalizer function */
function normalizeArray(arr: any[], normalizer: (item: any) => any): any[] {
  return arr.map(normalizer);
}

/** Create a setter that normalizes incoming data automatically */
function createNormalizedSetter(
  rawSetter: React.Dispatch<React.SetStateAction<any[]>>,
  normalizer: (item: any) => any,
): React.Dispatch<React.SetStateAction<any[]>> {
  return (updater: React.SetStateAction<any[]>) => {
    rawSetter((prev: any[]) => {
      const next = typeof updater === 'function' ? (updater as (prev: any[]) => any[])(prev) : updater;
      return normalizeArray(next, normalizer);
    });
  };
}

// ─── Types ────────────────────────────────────────────────────────────

export type InstanceOwner =
  | { type: 'project'; id: number }
  | { type: 'inquiry'; id: number };

export interface InstanceScheduleData {
  eventDays: any[];
  activities: any[];
  crewSlots: any[];
  subjects: any[];
  locationSlots: any[];
  films: any[];
}

/** Reference data needed by card components (crew, jobRoles, etc.) */
export interface InstanceReferenceData {
  crew: any[];
  jobRoles: any[];
  allEquipment: any[];
  subjectTemplates: any[];
}

export interface UseInstanceScheduleResult {
  data: InstanceScheduleData;
  /** Brand-level reference data for card components */
  refData: InstanceReferenceData;
  setEventDays: React.Dispatch<React.SetStateAction<any[]>>;
  setActivities: React.Dispatch<React.SetStateAction<any[]>>;
  setCrewSlots: React.Dispatch<React.SetStateAction<any[]>>;
  setSubjects: React.Dispatch<React.SetStateAction<any[]>>;
  setLocationSlots: React.Dispatch<React.SetStateAction<any[]>>;
  setFilms: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasData: boolean;
  /** Active event day ID for tab selection */
  activeDayId: number | null;
  setActiveDayId: (id: number | null) => void;
  /** Selected activity ID for detail panel */
  selectedActivityId: number | null;
  setSelectedActivityId: (id: number | null) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useInstanceScheduleData(
  owner: InstanceOwner | null,
  brandId?: number | null,
): UseInstanceScheduleResult {
  const [eventDays, setEventDays] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [crewSlots, setCrewSlots] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [locationSlots, setLocationSlots] = useState<any[]>([]);
  const [films, setFilms] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [jobRoles, setJobRoles] = useState<any[]>([]);
  const [allEquipment, setAllEquipment] = useState<any[]>([]);
  const [subjectTemplates, setSubjectTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDayId, setActiveDayId] = useState<number | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!owner) return;

    setLoading(true);
    setError(null);

    try {
      const id = owner.id;
      const isProject = owner.type === 'project';

      // Fetch event days first (they include nested activities, crew slots, etc.)
      const [days, allActivities, ops, subs, locSlots, flms] = await Promise.all([
        isProject
          ? scheduleApi.projectInstanceEventDays.getAll(id)
          : scheduleApi.inquiryEventDays.getAll(id),
        isProject
          ? scheduleApi.projectAllActivities.getAll(id)
          : scheduleApi.inquiryActivities.getAll(id),
        isProject
          ? scheduleApi.instanceCrewSlots.getForProject(id)
          : scheduleApi.instanceCrewSlots.getForInquiry(id),
        isProject
          ? scheduleApi.instanceSubjects.getForProject(id)
          : scheduleApi.instanceSubjects.getForInquiry(id),
        isProject
          ? scheduleApi.instanceLocationSlots.getForProject(id)
          : scheduleApi.instanceLocationSlots.getForInquiry(id),
        isProject
          ? scheduleApi.projectFilms.getAll(id)
          : scheduleApi.inquiryFilms.getAll(id),
      ]);

      setEventDays(normalizeArray(days, normalizeEventDay));
      setActivities(normalizeArray(allActivities, normalizeActivity));
      setCrewSlots(normalizeArray(ops, normalizeCrewSlot));
      setSubjects(normalizeArray(subs, normalizeSubject));
      setLocationSlots(normalizeArray(locSlots, normalizeLocationSlot));
      setFilms(flms);

      // Auto-select first day if none selected
      if (days.length > 0 && !activeDayId) {
        setActiveDayId(days[0].id);
      }

      // Fetch brand-level reference data (crew, jobRoles, equipment, subjectTemplates)
      if (brandId) {
        try {
          const [crew, roles] = await Promise.all([
            crewApi.getByBrand(brandId),
            jobRolesApi.getAll(),
          ]);
          setCrew(crew || []);
          setJobRoles((roles || []).filter((r: any) => r.is_active));
        } catch (crewErr) {
          console.warn('Failed to load crew/jobRoles for instance:', crewErr);
        }

        try {
          const templates = await request<any[]>(
            `/api/subjects/roles/brand/${brandId}`,
            {},
            { includeBrandQuery: false },
          );
          setSubjectTemplates(templates || []);
        } catch {
          console.warn('Failed to load subject templates for instance');
        }

        try {
          const grouped = await equipmentApi.getGroupedByCategory();
          const flat: any[] = [];
          Object.values(grouped).forEach((group: any) => {
            if (group && Array.isArray(group.equipment)) flat.push(...group.equipment);
          });
          setAllEquipment(flat);
        } catch {
          console.warn('Failed to load equipment inventory for instance');
        }
      }
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('404')) {
        setEventDays([]);
        setActivities([]);
        setCrewSlots([]);
        setSubjects([]);
        setLocationSlots([]);
        setFilms([]);
      } else {
        setError(err?.message || 'Failed to load schedule data');
      }
    } finally {
      setLoading(false);
    }
  }, [owner?.type, owner?.id, brandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Wrap setters so any data added/updated by components gets normalized too
  const normalizedSetEventDays = useCallback(
    createNormalizedSetter(setEventDays, normalizeEventDay), [setEventDays],
  );
  const normalizedSetActivities = useCallback(
    createNormalizedSetter(setActivities, normalizeActivity), [setActivities],
  );
  const normalizedSetCrewSlots = useCallback(
    createNormalizedSetter(setCrewSlots, normalizeCrewSlot), [setCrewSlots],
  );
  const normalizedSetSubjects = useCallback(
    createNormalizedSetter(setSubjects, normalizeSubject), [setSubjects],
  );
  const normalizedSetLocationSlots = useCallback(
    createNormalizedSetter(setLocationSlots, normalizeLocationSlot), [setLocationSlots],
  );

  return {
    data: { eventDays, activities, crewSlots, subjects, locationSlots, films },
    refData: { crew, jobRoles, allEquipment, subjectTemplates },
    setEventDays: normalizedSetEventDays,
    setActivities: normalizedSetActivities,
    setCrewSlots: normalizedSetCrewSlots,
    setSubjects: normalizedSetSubjects,
    setLocationSlots: normalizedSetLocationSlots,
    setFilms,
    loading,
    error,
    refresh: fetchData,
    hasData: eventDays.length > 0,
    activeDayId,
    setActiveDayId,
    selectedActivityId,
    setSelectedActivityId,
  };
}

export default useInstanceScheduleData;

// Re-export normalizers for external use (e.g., InstanceScheduleEditor)
export {
  normalizeEventDay,
  normalizeActivity,
  normalizeSubject,
  normalizeLocationSlot,
  normalizeCrewSlot,
};
