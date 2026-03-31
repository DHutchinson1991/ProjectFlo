'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { scheduleApi, crewSlotsApi } from '@/features/workflow/scheduling/api';

// ─── Schedule API Adapter Interface ────────────────────────────────────
// Normalized interface for schedule CRUD operations that decouples
// shared components from the underlying entity type (package template,
// project instance, or inquiry instance).
//
// Key convention: `dayId` = PK of the event day row in the current context:
//   • Package mode → PackageEventDay.id
//   • Project mode → ProjectEventDay.id
//   • Inquiry mode → ProjectEventDay.id (inquiry-owned)
//
// The adapter implementations handle field-name mapping internally:
//   • Package: dayId → { package_event_day_id: dayId } for activities,
//                       { event_day_template_id: templateId } for subjects
//   • Instance: dayId → { project_event_day_id: dayId }
// ────────────────────────────────────────────────────────────────────────

export type ScheduleMode = 'package' | 'project' | 'inquiry';

export interface ScheduleApi {
  /** Which entity type this adapter targets */
  readonly mode: ScheduleMode;
  /** The owning entity ID (packageId / projectId / inquiryId) */
  readonly ownerId: number;

  // ─── Activities ────────────────────────────────────────────────────
  activities: {
    getAll(): Promise<any[]>;
    getByDay(dayId: number): Promise<any[]>;
    create(dayId: number, data: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      start_time?: string;
      end_time?: string;
      duration_minutes?: number;
      order_index?: number;
      notes?: string;
      package_activity_id?: number;
    }): Promise<any>;
    update(activityId: number, data: any): Promise<any>;
    delete(activityId: number): Promise<void>;
  };

  // ─── Activity Moments ──────────────────────────────────────────────
  moments: {
    getByActivity(activityId: number): Promise<any[]>;
    create(activityId: number, data: {
      name: string;
      duration_seconds?: number;
      order_index?: number;
      is_required?: boolean;
      notes?: string;
    }): Promise<any>;
    update(momentId: number, data: any): Promise<any>;
    delete(momentId: number): Promise<void>;
    reorder(activityId: number, momentIds: number[]): Promise<any>;
  };

  // ─── Subjects ──────────────────────────────────────────────────────
  subjects: {
    create(dayId: number, data: {
      name: string;
      category?: string;
      role_template_id?: number;
      package_activity_id?: number; // package mode
      project_activity_id?: number; // instance mode
      notes?: string;
      order_index?: number;
    }): Promise<any>;
    update(subjectId: number, data: { count?: number | null; name?: string; real_name?: string | null; notes?: string }): Promise<any>;
    delete(subjectId: number): Promise<void>;
    assignActivity(subjectId: number, activityId: number): Promise<any>;
    unassignActivity(subjectId: number, activityId: number): Promise<any>;
  };

  // ─── Location Slots ────────────────────────────────────────────────
  locationSlots: {
    create(dayId: number, data?: { location_number?: number }): Promise<any>;
    update(slotId: number, data: { name?: string | null; address?: string | null }): Promise<any>;
    delete(slotId: number): Promise<void>;
    assignActivity(slotId: number, activityId: number): Promise<any>;
    unassignActivity(slotId: number, activityId: number): Promise<any>;
  };

  // ─── Crew Slots ────────────────────────────────────────────────────
  crewSlots: {
    add(dayId: number, data: {
      label?: string | null;
      crew_id?: number | null;
      job_role_id?: number | null;
      hours?: number;
      activity_id?: number | null; // maps to package_activity_id or project_activity_id
    }): Promise<any>;
    remove(crewSlotId: number): Promise<void>;
    assign(crewSlotId: number, crewId: number | null): Promise<any>;
    assignActivity(crewSlotId: number, activityId: number): Promise<any>;
    unassignActivity(crewSlotId: number, activityId: number): Promise<any>;
    setEquipment(crewSlotId: number, equipment: { equipment_id: number; is_primary: boolean }[]): Promise<any>;
    /** Re-fetch all crew slots for this owner (used after equipment changes). */
    refreshAll(): Promise<any[]>;
  };

  // ─── Event Days ────────────────────────────────────────────────────
  // Package mode: adds/removes brand templates from the package
  // Instance mode: CRUD on project/inquiry event day instances
  eventDays: {
    getAll(): Promise<any[]>;
    add(dayId: number): Promise<any>;    // package: add brand template; instance: no-op
    remove(dayId: number): Promise<any>; // package: remove from package; instance: delete
    create(data: any): Promise<any>;
    update(dayId: number, data: any): Promise<any>;
    delete(dayId: number): Promise<void>;
  };

  // ─── Brand Event Day Templates (package mode only) ─────────────────
  brandEventDays?: {
    getAll(brandId: number): Promise<any[]>;
    create(brandId: number, data: { name: string }): Promise<any>;
  };
}

// ─── React Context ─────────────────────────────────────────────────────

const ScheduleApiContext = createContext<ScheduleApi | null>(null);

export function useScheduleApi(): ScheduleApi {
  const ctx = useContext(ScheduleApiContext);
  if (!ctx) {
    throw new Error('useScheduleApi must be used within a ScheduleApiProvider');
  }
  return ctx;
}

/** Optional hook that returns null when outside a provider (for backward compat) */
export function useOptionalScheduleApi(): ScheduleApi | null {
  return useContext(ScheduleApiContext);
}

// ─── Factory: Package Mode ─────────────────────────────────────────────

export function createPackageScheduleApi(packageId: number, brandId: number): ScheduleApi {
  return {
    mode: 'package',
    ownerId: packageId,

    activities: {
      getAll: () => scheduleApi.packageActivities.getAll(packageId),
      getByDay: (dayId) => {
        // PackageScheduleCard fetches all then filters — but we can use getByDay if available
        // For now, fetch all and the component filters
        return scheduleApi.packageActivities.getAll(packageId);
      },
      create: (dayId, data) =>
        scheduleApi.packageActivities.create(packageId, {
          package_event_day_id: dayId,
          ...data,
        }),
      update: (activityId, data) =>
        scheduleApi.packageActivities.update(activityId, data),
      delete: (activityId) =>
        scheduleApi.packageActivities.delete(activityId),
    },

    moments: {
      getByActivity: (activityId) =>
        scheduleApi.packageActivityMoments.getAll(activityId),
      create: (activityId, data) =>
        scheduleApi.packageActivityMoments.create(activityId, data),
      update: (momentId, data) =>
        scheduleApi.packageActivityMoments.update(momentId, data),
      delete: (momentId) =>
        scheduleApi.packageActivityMoments.delete(momentId),
      reorder: (activityId, momentIds) =>
        scheduleApi.packageActivityMoments.reorder(activityId, momentIds),
    },

    subjects: {
      create: (dayId, data) =>
        scheduleApi.packageEventDaySubjects.create(packageId, {
          event_day_template_id: dayId,
          ...data,
        }),
      update: (subjectId, data) =>
        scheduleApi.packageEventDaySubjects.update(subjectId, data),
      delete: (subjectId) =>
        scheduleApi.packageEventDaySubjects.delete(subjectId),
      assignActivity: (subjectId, activityId) =>
        scheduleApi.packageEventDaySubjects.assignActivity(subjectId, activityId),
      unassignActivity: (subjectId, activityId) =>
        scheduleApi.packageEventDaySubjects.unassignActivity(subjectId, activityId),
    },

    locationSlots: {
      create: (dayId, data) =>
        scheduleApi.packageLocationSlots.create(packageId, {
          event_day_template_id: dayId,
          ...(data || {}),
        }),
      update: () => Promise.resolve(null),
      delete: (slotId) =>
        scheduleApi.packageLocationSlots.delete(slotId),
      assignActivity: (slotId, activityId) =>
        scheduleApi.packageLocationSlots.assignActivity(slotId, activityId),
      unassignActivity: (slotId, activityId) =>
        scheduleApi.packageLocationSlots.unassignActivity(slotId, activityId),
    },

    crewSlots: {
      add: async (dayId, data) => {
        const created = await crewSlotsApi.packageDay.add(packageId, {
          package_event_day_id: dayId,
          label: data.label,
          crew_id: data.crew_id,
          job_role_id: data.job_role_id,
          hours: data.hours,
        });
        if (data.activity_id && created && typeof created === 'object' && 'id' in created) {
          await crewSlotsApi.packageDay.assignActivity(Number((created as { id: unknown }).id), data.activity_id);
        }
        return created;
      },
      remove: (crewSlotId) =>
        crewSlotsApi.packageDay.remove(crewSlotId),
      assign: (crewSlotId, crewId) =>
        crewSlotsApi.packageDay.assign(crewSlotId, crewId),
      assignActivity: (crewSlotId, activityId) =>
        crewSlotsApi.packageDay.assignActivity(crewSlotId, activityId),
      unassignActivity: (crewSlotId, activityId) =>
        crewSlotsApi.packageDay.unassignActivity(crewSlotId, activityId),
      setEquipment: (crewSlotId, equipment) =>
        crewSlotsApi.packageDay.setEquipment(crewSlotId, equipment),
      refreshAll: () =>
        crewSlotsApi.packageDay.getAll(packageId),
    },

    eventDays: {
      getAll: () => scheduleApi.packageEventDays.getAll(packageId),
      add: (dayId) => scheduleApi.packageEventDays.add(packageId, dayId),
      remove: (dayId) => scheduleApi.packageEventDays.remove(packageId, dayId),
      create: (data) => scheduleApi.packageEventDays.add(packageId, data.event_day_template_id ?? data.id),
      update: (_dayId, _data) => Promise.resolve(null), // package event days don't have direct update
      delete: (dayId) => scheduleApi.packageEventDays.remove(packageId, dayId),
    },

    brandEventDays: {
      getAll: (bId) => scheduleApi.eventDays.getAll(bId),
      create: (bId, data) => scheduleApi.eventDays.create(bId, data),
    },
  };
}

// ─── Factory: Project Instance Mode ────────────────────────────────────

export function createProjectScheduleApi(projectId: number): ScheduleApi {
  return {
    mode: 'project',
    ownerId: projectId,

    activities: {
      getAll: () => scheduleApi.projectAllActivities.getAll(projectId),
      getByDay: (dayId) => scheduleApi.projectActivities.getByDay(projectId, dayId),
      create: (dayId, data) =>
        scheduleApi.projectActivities.create(projectId, {
          project_event_day_id: dayId,
          ...data,
        }),
      update: (activityId, data) =>
        scheduleApi.projectActivities.update(activityId, data),
      delete: (activityId) =>
        scheduleApi.projectActivities.delete(activityId),
    },

    moments: {
      getByActivity: (activityId) =>
        scheduleApi.instanceMoments.getByActivity(activityId),
      create: (activityId, data) =>
        scheduleApi.instanceMoments.createForProject(projectId, {
          project_activity_id: activityId,
          ...data,
        }),
      update: (momentId, data) =>
        scheduleApi.instanceMoments.update(momentId, data),
      delete: (momentId) =>
        scheduleApi.instanceMoments.delete(momentId),
      reorder: (activityId, momentIds) =>
        scheduleApi.instanceMoments.reorder(activityId, momentIds),
    },

    subjects: {
      create: (dayId, data) => {
        const { package_activity_id, ...rest } = data;
        return scheduleApi.instanceSubjects.createForProject(projectId, {
          project_event_day_id: dayId,
          project_activity_id: data.project_activity_id ?? package_activity_id,
          ...rest,
        });
      },
      update: (subjectId, data) =>
        scheduleApi.instanceSubjects.update(subjectId, data),
      delete: (subjectId) =>
        scheduleApi.instanceSubjects.delete(subjectId),
      assignActivity: (subjectId, activityId) =>
        scheduleApi.instanceSubjects.assignActivity(subjectId, activityId),
      unassignActivity: (subjectId, activityId) =>
        scheduleApi.instanceSubjects.unassignActivity(subjectId, activityId),
    },

    locationSlots: {
      create: (dayId, data) =>
        scheduleApi.instanceLocationSlots.createForProject(projectId, {
          project_event_day_id: dayId,
          ...(data || {}),
        }),
      update: (slotId, data) =>
        scheduleApi.instanceLocationSlots.update(slotId, data),
      delete: (slotId) =>
        scheduleApi.instanceLocationSlots.delete(slotId),
      assignActivity: (slotId, activityId) =>
        scheduleApi.instanceLocationSlots.assignActivity(slotId, activityId),
      unassignActivity: (slotId, activityId) =>
        scheduleApi.instanceLocationSlots.unassignActivity(slotId, activityId),
    },

    crewSlots: {
      add: async (dayId, data) => {
        const created = await scheduleApi.instanceCrewSlots.createForProject(projectId, {
          project_event_day_id: dayId,
          label: data.label,
          crew_id: data.crew_id,
          job_role_id: data.job_role_id,
          hours: data.hours,
        });
        if (data.activity_id && created && typeof created === 'object' && 'id' in created) {
          await scheduleApi.instanceCrewSlots.assignActivity(Number((created as { id: unknown }).id), data.activity_id);
        }
        return created;
      },
      remove: (crewSlotId) =>
        scheduleApi.instanceCrewSlots.delete(crewSlotId),
      assign: (crewSlotId, crewId) =>
        scheduleApi.instanceCrewSlots.assignCrew(crewSlotId, crewId),
      assignActivity: (crewSlotId, activityId) =>
        scheduleApi.instanceCrewSlots.assignActivity(crewSlotId, activityId),
      unassignActivity: (crewSlotId, activityId) =>
        scheduleApi.instanceCrewSlots.unassignActivity(crewSlotId, activityId),
      setEquipment: (crewSlotId, equipment) =>
        scheduleApi.instanceCrewSlots.setEquipment(crewSlotId, equipment),
      refreshAll: () =>
        scheduleApi.instanceCrewSlots.getForProject(projectId),
    },

    eventDays: {
      getAll: () => scheduleApi.projectInstanceEventDays.getAll(projectId),
      add: (_dayId) => Promise.resolve(null), // N/A for instance mode
      remove: (dayId) => scheduleApi.projectEventDays.delete(dayId),
      create: (data) => scheduleApi.projectEventDays.create(projectId, data),
      update: (dayId, data) => scheduleApi.projectEventDays.update(dayId, data),
      delete: (dayId) => scheduleApi.projectEventDays.delete(dayId),
    },
  };
}

// ─── Factory: Inquiry Instance Mode ────────────────────────────────────

export function createInquiryScheduleApi(inquiryId: number): ScheduleApi {
  return {
    mode: 'inquiry',
    ownerId: inquiryId,

    activities: {
      getAll: () => scheduleApi.inquiryActivities.getAll(inquiryId),
      getByDay: (dayId) => scheduleApi.inquiryActivities.getByDay(inquiryId, dayId),
      create: (dayId, data) =>
        scheduleApi.inquiryActivities.create(inquiryId, {
          project_event_day_id: dayId,
          ...data,
        }),
      update: (activityId, data) =>
        scheduleApi.inquiryActivities.update(activityId, data),
      delete: (activityId) =>
        scheduleApi.inquiryActivities.delete(activityId),
    },

    moments: {
      getByActivity: (activityId) =>
        scheduleApi.instanceMoments.getByActivity(activityId),
      create: (activityId, data) =>
        scheduleApi.instanceMoments.createForInquiry(inquiryId, {
          project_activity_id: activityId,
          ...data,
        }),
      update: (momentId, data) =>
        scheduleApi.instanceMoments.update(momentId, data),
      delete: (momentId) =>
        scheduleApi.instanceMoments.delete(momentId),
      reorder: (activityId, momentIds) =>
        scheduleApi.instanceMoments.reorder(activityId, momentIds),
    },

    subjects: {
      create: (dayId, data) => {
        const { package_activity_id, ...rest } = data;
        return scheduleApi.instanceSubjects.createForInquiry(inquiryId, {
          project_event_day_id: dayId,
          project_activity_id: data.project_activity_id ?? package_activity_id,
          ...rest,
        });
      },
      update: (subjectId, data) =>
        scheduleApi.instanceSubjects.update(subjectId, data),
      delete: (subjectId) =>
        scheduleApi.instanceSubjects.delete(subjectId),
      assignActivity: (subjectId, activityId) =>
        scheduleApi.instanceSubjects.assignActivity(subjectId, activityId),
      unassignActivity: (subjectId, activityId) =>
        scheduleApi.instanceSubjects.unassignActivity(subjectId, activityId),
    },

    locationSlots: {
      create: (dayId, data) =>
        scheduleApi.instanceLocationSlots.createForInquiry(inquiryId, {
          project_event_day_id: dayId,
          ...(data || {}),
        }),
      update: (slotId, data) =>
        scheduleApi.instanceLocationSlots.update(slotId, data),
      delete: (slotId) =>
        scheduleApi.instanceLocationSlots.delete(slotId),
      assignActivity: (slotId, activityId) =>
        scheduleApi.instanceLocationSlots.assignActivity(slotId, activityId),
      unassignActivity: (slotId, activityId) =>
        scheduleApi.instanceLocationSlots.unassignActivity(slotId, activityId),
    },

    crewSlots: {
      add: async (dayId, data) => {
        const created = await scheduleApi.instanceCrewSlots.createForInquiry(inquiryId, {
          project_event_day_id: dayId,
          label: data.label,
          crew_id: data.crew_id,
          job_role_id: data.job_role_id,
          hours: data.hours,
        });
        if (data.activity_id && created && typeof created === 'object' && 'id' in created) {
          await scheduleApi.instanceCrewSlots.assignActivity(Number((created as { id: unknown }).id), data.activity_id);
        }
        return created;
      },
      remove: (crewSlotId) =>
        scheduleApi.instanceCrewSlots.delete(crewSlotId),
      assign: (crewSlotId, crewId) =>
        scheduleApi.instanceCrewSlots.assignCrew(crewSlotId, crewId),
      assignActivity: (crewSlotId, activityId) =>
        scheduleApi.instanceCrewSlots.assignActivity(crewSlotId, activityId),
      unassignActivity: (crewSlotId, activityId) =>
        scheduleApi.instanceCrewSlots.unassignActivity(crewSlotId, activityId),
      setEquipment: (crewSlotId, equipment) =>
        scheduleApi.instanceCrewSlots.setEquipment(crewSlotId, equipment),
      refreshAll: () =>
        scheduleApi.instanceCrewSlots.getForInquiry(inquiryId),
    },

    eventDays: {
      getAll: () => scheduleApi.inquiryEventDays.getAll(inquiryId),
      add: (_dayId) => Promise.resolve(null), // N/A for instance mode
      remove: (dayId) => scheduleApi.inquiryEventDays.delete(dayId),
      create: (data) => scheduleApi.inquiryEventDays.create(inquiryId, data),
      update: (dayId, data) => scheduleApi.inquiryEventDays.update(dayId, data),
      delete: (dayId) => scheduleApi.inquiryEventDays.delete(dayId),
    },
  };
}

// ─── Provider Component ────────────────────────────────────────────────

interface ScheduleApiProviderProps {
  children: React.ReactNode;
  scheduleApi: ScheduleApi;
}

export function ScheduleApiProvider({ children, scheduleApi }: ScheduleApiProviderProps) {
  return (
    <ScheduleApiContext.Provider value={scheduleApi}>
      {children}
    </ScheduleApiContext.Provider>
  );
}

/** Convenience hook: memoize a schedule API adapter by mode+ownerId */
export function useScheduleApiAdapter(
  mode: ScheduleMode,
  ownerId: number,
  brandId?: number,
): ScheduleApi {
  return useMemo(() => {
    switch (mode) {
      case 'package':
        return createPackageScheduleApi(ownerId, brandId ?? 0);
      case 'project':
        return createProjectScheduleApi(ownerId);
      case 'inquiry':
        return createInquiryScheduleApi(ownerId);
    }
  }, [mode, ownerId, brandId]);
}
