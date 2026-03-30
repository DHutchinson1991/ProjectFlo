import { useState, useEffect } from 'react';
import { scheduleApi, crewSlotsApi } from '@/features/workflow/scheduling/api';

type PackageSubject = Record<string, unknown>;
interface PackageActivity { id: number; package_event_day_id: number; }
interface PackageCrewSlotAssignment { package_activity_id?: number; }
interface CrewSlotEquipmentItem { equipment_id?: number; equipment?: { id?: number; category?: string; }; }
interface PackageCrewSlot { id: number; package_activity_id?: number; event_day_template_id?: number; crew_id?: number; label?: string; job_role?: { id: number; name: string; display_name?: string }; crew?: { id: number; crew_color?: string }; equipment?: CrewSlotEquipmentItem[]; activity_assignments?: PackageCrewSlotAssignment[]; }
interface PackageEventDay { id: number; _joinId?: number; }
interface PackageFilmRef { id: number; film_id: number; }
interface PackageFilmSchedule { scene_schedules?: Array<{ scene_id: number; package_activity_id?: number; }>; }
interface PackageLocation { id: number; event_day_template_id?: number; location_id?: number; location_number?: number; package_activity_id?: number; notes?: string; order_index?: number; activity_assignments?: Array<{ id: number; package_activity_id: number; package_activity?: { id: number; name: string } }>; }

interface PackageData {
  packageSubjects: PackageSubject[];
  packageActivities: PackageActivity[];
  packageCrewSlots: PackageCrewSlot[];
  sceneActivityCrewMap: Map<number, { cameraCount: number; audioCount: number }>;
  packageLocations: PackageLocation[];
  packageLocationLookup: Map<string, PackageLocation>;
}

export function useContentBuilderPackageData(
  packageId: number | null | undefined,
  filmId: number | string | undefined,
): PackageData {
  const [packageSubjects, setPackageSubjects] = useState<PackageSubject[]>([]);
  const [packageActivities, setPackageActivities] = useState<PackageActivity[]>([]);
  const [packageCrewSlots, setPackageCrewSlots] = useState<PackageCrewSlot[]>([]);
  const [sceneActivityCrewMap, setSceneActivityCrewMap] = useState<Map<number, { cameraCount: number; audioCount: number }>>(new Map());
  const [packageLocations, setPackageLocations] = useState<PackageLocation[]>([]);
  const [packageLocationLookup, setPackageLocationLookup] = useState<Map<string, PackageLocation>>(new Map());

  useEffect(() => {
    if (!packageId) return;
    let mounted = true;
    scheduleApi.packageEventDaySubjects.getAll(packageId).then((subjects) => {
      if (mounted) setPackageSubjects((subjects || []) as PackageSubject[]);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [packageId]);

  useEffect(() => {
    if (!packageId) return;
    let mounted = true;
    scheduleApi.packageLocationSlots.getAll(packageId).then((slots) => {
      if (!mounted) return;
      const assigned = ((slots || []) as PackageLocation[]).filter(
        (s) => (s.activity_assignments?.length || 0) > 0
      );
      setPackageLocations(assigned);
      const lookup = new Map<string, PackageLocation>();
      assigned.forEach((loc) => { lookup.set(String(loc.id), loc); });
      setPackageLocationLookup(lookup);
    }).catch(() => {
      if (!mounted) return;
      setPackageLocations([]);
      setPackageLocationLookup(new Map());
    });
    return () => { mounted = false; };
  }, [packageId]);

  useEffect(() => {
    if (!packageId || !filmId) return;
    let mounted = true;
    (async () => {
      try {
        const [activities, crewSlots, packageFilms, eventDays] = await Promise.all([
          scheduleApi.packageActivities.getAll(packageId),
          crewSlotsApi.packageDay.getAll(packageId),
          scheduleApi.packageFilms.getAll(packageId),
          scheduleApi.packageEventDays.getAll(packageId),
        ]);
        if (!mounted) return;
        setPackageActivities((activities || []) as PackageActivity[]);
        setPackageCrewSlots((crewSlots || []) as PackageCrewSlot[]);
        const joinToTemplateMap = new Map<number, number>();
        ((eventDays || []) as PackageEventDay[]).forEach((d) => {
          if (d._joinId != null) joinToTemplateMap.set(d._joinId, d.id);
        });
        const numFilmId = typeof filmId === 'string' ? parseInt(filmId, 10) : filmId;
        const matchingPF = ((packageFilms || []) as PackageFilmRef[]).find((pf) => pf.film_id === numFilmId);
        if (!matchingPF) return;
        const pfData = (await scheduleApi.packageFilms.getSchedule(matchingPF.id)) as PackageFilmSchedule;
        if (!mounted || !pfData?.scene_schedules) return;
        const activityCrewCounts = new Map<number, { cameraCount: number; audioCount: number }>();
        ((activities || []) as PackageActivity[]).forEach((act) => {
          const activityEventDayId = joinToTemplateMap.get(act.package_event_day_id) ?? act.package_event_day_id;
          const matched = ((crewSlots || []) as PackageCrewSlot[]).filter((o) => {
            if (o.package_activity_id === act.id) return true;
            if (o.activity_assignments?.some((a) => a.package_activity_id === act.id)) return true;
            const hasNoAssignment = !o.package_activity_id && (!o.activity_assignments || o.activity_assignments.length === 0);
            if (hasNoAssignment && o.event_day_template_id === activityEventDayId) return true;
            return false;
          });
          const seen = new Map<number, PackageCrewSlot>();
          matched.forEach((o) => { const crewId = o.crew_id ?? o.id; if (!seen.has(crewId)) seen.set(crewId, o); });
          const crew = Array.from(seen.values());
          const cameraIds = new Set<number>();
          const audioIds = new Set<number>();
          crew.forEach((op) => {
            const equipment = (op.equipment && op.equipment.length > 0 ? op.equipment : []) ?? [];
            equipment.forEach((eq) => {
              const cat = (eq.equipment?.category || '').toUpperCase();
              const eqId = eq.equipment_id ?? eq.equipment?.id;
              if (cat === 'CAMERA' && eqId) cameraIds.add(eqId);
              if (cat === 'AUDIO' && eqId) audioIds.add(eqId);
            });
          });
          activityCrewCounts.set(act.id, { cameraCount: cameraIds.size, audioCount: audioIds.size });
        });
        const sceneCrewMap = new Map<number, { cameraCount: number; audioCount: number }>();
        for (const sched of pfData.scene_schedules) {
          if (sched.package_activity_id) {
            const crew = activityCrewCounts.get(sched.package_activity_id);
            if (crew) sceneCrewMap.set(sched.scene_id, crew);
          }
        }
        setSceneActivityCrewMap(sceneCrewMap);
      } catch {
        // Silently fail — timeline shows default behavior
      }
    })();
    return () => { mounted = false; };
  }, [packageId, filmId]);

  return { packageSubjects, packageActivities, packageCrewSlots, sceneActivityCrewMap, packageLocations, packageLocationLookup };
}
