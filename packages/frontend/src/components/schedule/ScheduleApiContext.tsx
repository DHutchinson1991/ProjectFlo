'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { api } from '@/lib/api';

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
    update(subjectId: number, data: { count?: number | null; name?: string; notes?: string }): Promise<any>;
    delete(subjectId: number): Promise<void>;
    assignActivity(subjectId: number, activityId: number): Promise<any>;
    unassignActivity(subjectId: number, activityId: number): Promise<any>;
  };

  // ─── Location Slots ────────────────────────────────────────────────
  locationSlots: {
    create(dayId: number, data?: { location_number?: number }): Promise<any>;
    delete(slotId: number): Promise<void>;
    assignActivity(slotId: number, activityId: number): Promise<any>;
    unassignActivity(slotId: number, activityId: number): Promise<any>;
  };

  // ─── Operators / Crew ──────────────────────────────────────────────
  operators: {
    add(dayId: number, data: {
      position_name: string;
      position_color?: string | null;
      contributor_id?: number | null;
      job_role_id?: number | null;
      hours?: number;
      notes?: string;
      activity_id?: number | null; // maps to package_activity_id or project_activity_id
    }): Promise<any>;
    remove(operatorId: number): Promise<void>;
    assign(operatorId: number, contributorId: number | null): Promise<any>;
    assignActivity(operatorId: number, activityId: number): Promise<any>;
    unassignActivity(operatorId: number, activityId: number): Promise<any>;
    setEquipment(operatorId: number, equipment: { equipment_id: number; is_primary: boolean }[]): Promise<any>;
    /** Re-fetch all operators for this owner (used after equipment changes). */
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
      getAll: () => api.schedule.packageActivities.getAll(packageId),
      getByDay: (dayId) => {
        // PackageScheduleCard fetches all then filters — but we can use getByDay if available
        // For now, fetch all and the component filters
        return api.schedule.packageActivities.getAll(packageId);
      },
      create: (dayId, data) =>
        api.schedule.packageActivities.create(packageId, {
          package_event_day_id: dayId,
          ...data,
        }),
      update: (activityId, data) =>
        api.schedule.packageActivities.update(activityId, data),
      delete: (activityId) =>
        api.schedule.packageActivities.delete(activityId),
    },

    moments: {
      getByActivity: (activityId) =>
        api.schedule.packageActivityMoments.getByActivity(activityId),
      create: (activityId, data) =>
        api.schedule.packageActivityMoments.create(activityId, data),
      update: (momentId, data) =>
        api.schedule.packageActivityMoments.update(momentId, data),
      delete: (momentId) =>
        api.schedule.packageActivityMoments.delete(momentId),
      reorder: (activityId, momentIds) =>
        api.schedule.packageActivityMoments.reorder(activityId, momentIds),
    },

    subjects: {
      create: (dayId, data) =>
        api.schedule.packageEventDaySubjects.create(packageId, {
          event_day_template_id: dayId,
          ...data,
        }),
      update: (subjectId, data) =>
        api.schedule.packageEventDaySubjects.update(subjectId, data),
      delete: (subjectId) =>
        api.schedule.packageEventDaySubjects.delete(subjectId),
      assignActivity: (subjectId, activityId) =>
        api.schedule.packageEventDaySubjects.assignActivity(subjectId, activityId),
      unassignActivity: (subjectId, activityId) =>
        api.schedule.packageEventDaySubjects.unassignActivity(subjectId, activityId),
    },

    locationSlots: {
      create: (dayId, data) =>
        api.schedule.packageLocationSlots.create(packageId, {
          event_day_template_id: dayId,
          ...(data || {}),
        }),
      delete: (slotId) =>
        api.schedule.packageLocationSlots.delete(slotId),
      assignActivity: (slotId, activityId) =>
        api.schedule.packageLocationSlots.assignActivity(slotId, activityId),
      unassignActivity: (slotId, activityId) =>
        api.schedule.packageLocationSlots.unassignActivity(slotId, activityId),
    },

    operators: {
      add: (dayId, data) =>
        api.operators.packageDay.add(packageId, {
          event_day_template_id: dayId,
          position_name: data.position_name,
          position_color: data.position_color,
          contributor_id: data.contributor_id,
          job_role_id: data.job_role_id,
          hours: data.hours,
          notes: data.notes,
          package_activity_id: data.activity_id,
        }),
      remove: (operatorId) =>
        api.operators.packageDay.remove(operatorId),
      assign: (operatorId, contributorId) =>
        api.operators.packageDay.assign(operatorId, contributorId),
      assignActivity: (operatorId, activityId) =>
        api.operators.packageDay.assignActivity(operatorId, activityId),
      unassignActivity: (operatorId, activityId) =>
        api.operators.packageDay.unassignActivity(operatorId, activityId),
      setEquipment: (operatorId, equipment) =>
        api.operators.packageDay.setEquipment(operatorId, equipment),
      refreshAll: () =>
        api.operators.packageDay.getAll(packageId),
    },

    eventDays: {
      getAll: () => api.schedule.packageEventDays.getAll(packageId),
      add: (dayId) => api.schedule.packageEventDays.add(packageId, dayId),
      remove: (dayId) => api.schedule.packageEventDays.remove(packageId, dayId),
      create: (data) => api.schedule.packageEventDays.add(packageId, data.event_day_template_id ?? data.id),
      update: (_dayId, _data) => Promise.resolve(null), // package event days don't have direct update
      delete: (dayId) => api.schedule.packageEventDays.remove(packageId, dayId),
    },

    brandEventDays: {
      getAll: (bId) => api.schedule.eventDays.getAll(bId),
      create: (bId, data) => api.schedule.eventDays.create(bId, data),
    },
  };
}

// ─── Factory: Project Instance Mode ────────────────────────────────────

export function createProjectScheduleApi(projectId: number): ScheduleApi {
  return {
    mode: 'project',
    ownerId: projectId,

    activities: {
      getAll: () => api.schedule.projectAllActivities.getAll(projectId),
      getByDay: (dayId) => api.schedule.projectActivities.getByDay(projectId, dayId),
      create: (dayId, data) =>
        api.schedule.projectActivities.create(projectId, {
          project_event_day_id: dayId,
          ...data,
        }),
      update: (activityId, data) =>
        api.schedule.projectActivities.update(activityId, data),
      delete: (activityId) =>
        api.schedule.projectActivities.delete(activityId),
    },

    moments: {
      getByActivity: (activityId) =>
        api.schedule.instanceMoments.getByActivity(activityId),
      create: (activityId, data) =>
        api.schedule.instanceMoments.createForProject(projectId, {
          project_activity_id: activityId,
          ...data,
        }),
      update: (momentId, data) =>
        api.schedule.instanceMoments.update(momentId, data),
      delete: (momentId) =>
        api.schedule.instanceMoments.delete(momentId),
      reorder: (activityId, momentIds) =>
        api.schedule.instanceMoments.reorder(activityId, momentIds),
    },

    subjects: {
      create: (dayId, data) => {
        const { package_activity_id, ...rest } = data;
        return api.schedule.instanceSubjects.createForProject(projectId, {
          project_event_day_id: dayId,
          project_activity_id: data.project_activity_id ?? package_activity_id,
          ...rest,
        });
      },
      update: (subjectId, data) =>
        api.schedule.instanceSubjects.update(subjectId, data),
      delete: (subjectId) =>
        api.schedule.instanceSubjects.delete(subjectId),
      assignActivity: (subjectId, activityId) =>
        api.schedule.instanceSubjects.assignActivity(subjectId, activityId),
      unassignActivity: (subjectId, activityId) =>
        api.schedule.instanceSubjects.unassignActivity(subjectId, activityId),
    },

    locationSlots: {
      create: (dayId, data) =>
        api.schedule.instanceLocationSlots.createForProject(projectId, {
          project_event_day_id: dayId,
          ...(data || {}),
        }),
      delete: (slotId) =>
        api.schedule.instanceLocationSlots.delete(slotId),
      assignActivity: (slotId, activityId) =>
        api.schedule.instanceLocationSlots.assignActivity(slotId, activityId),
      unassignActivity: (slotId, activityId) =>
        api.schedule.instanceLocationSlots.unassignActivity(slotId, activityId),
    },

    operators: {
      add: (dayId, data) =>
        api.schedule.instanceOperators.createForProject(projectId, {
          project_event_day_id: dayId,
          position_name: data.position_name,
          position_color: data.position_color,
          contributor_id: data.contributor_id,
          job_role_id: data.job_role_id,
          hours: data.hours,
          notes: data.notes,
          project_activity_id: data.activity_id,
        }),
      remove: (operatorId) =>
        api.schedule.instanceOperators.delete(operatorId),
      assign: (operatorId, contributorId) =>
        api.schedule.instanceOperators.assignCrew(operatorId, contributorId),
      assignActivity: (operatorId, activityId) =>
        api.schedule.instanceOperators.assignActivity(operatorId, activityId),
      unassignActivity: (operatorId, activityId) =>
        api.schedule.instanceOperators.unassignActivity(operatorId, activityId),
      setEquipment: (operatorId, equipment) =>
        api.schedule.instanceOperators.setEquipment(operatorId, equipment),
      refreshAll: () =>
        api.schedule.instanceOperators.getForProject(projectId),
    },

    eventDays: {
      getAll: () => api.schedule.projectInstanceEventDays.getAll(projectId),
      add: (_dayId) => Promise.resolve(null), // N/A for instance mode
      remove: (dayId) => api.schedule.projectEventDays.delete(dayId),
      create: (data) => api.schedule.projectEventDays.create(projectId, data),
      update: (dayId, data) => api.schedule.projectEventDays.update(dayId, data),
      delete: (dayId) => api.schedule.projectEventDays.delete(dayId),
    },
  };
}

// ─── Factory: Inquiry Instance Mode ────────────────────────────────────

export function createInquiryScheduleApi(inquiryId: number): ScheduleApi {
  return {
    mode: 'inquiry',
    ownerId: inquiryId,

    activities: {
      getAll: () => api.schedule.inquiryActivities.getAll(inquiryId),
      getByDay: (dayId) => api.schedule.inquiryActivities.getByDay(inquiryId, dayId),
      create: (dayId, data) =>
        api.schedule.inquiryActivities.create(inquiryId, {
          project_event_day_id: dayId,
          ...data,
        }),
      update: (activityId, data) =>
        api.schedule.inquiryActivities.update(activityId, data),
      delete: (activityId) =>
        api.schedule.inquiryActivities.delete(activityId),
    },

    moments: {
      getByActivity: (activityId) =>
        api.schedule.instanceMoments.getByActivity(activityId),
      create: (activityId, data) =>
        api.schedule.instanceMoments.createForInquiry(inquiryId, {
          project_activity_id: activityId,
          ...data,
        }),
      update: (momentId, data) =>
        api.schedule.instanceMoments.update(momentId, data),
      delete: (momentId) =>
        api.schedule.instanceMoments.delete(momentId),
      reorder: (activityId, momentIds) =>
        api.schedule.instanceMoments.reorder(activityId, momentIds),
    },

    subjects: {
      create: (dayId, data) => {
        const { package_activity_id, ...rest } = data;
        return api.schedule.instanceSubjects.createForInquiry(inquiryId, {
          project_event_day_id: dayId,
          project_activity_id: data.project_activity_id ?? package_activity_id,
          ...rest,
        });
      },
      update: (subjectId, data) =>
        api.schedule.instanceSubjects.update(subjectId, data),
      delete: (subjectId) =>
        api.schedule.instanceSubjects.delete(subjectId),
      assignActivity: (subjectId, activityId) =>
        api.schedule.instanceSubjects.assignActivity(subjectId, activityId),
      unassignActivity: (subjectId, activityId) =>
        api.schedule.instanceSubjects.unassignActivity(subjectId, activityId),
    },

    locationSlots: {
      create: (dayId, data) =>
        api.schedule.instanceLocationSlots.createForInquiry(inquiryId, {
          project_event_day_id: dayId,
          ...(data || {}),
        }),
      delete: (slotId) =>
        api.schedule.instanceLocationSlots.delete(slotId),
      assignActivity: (slotId, activityId) =>
        api.schedule.instanceLocationSlots.assignActivity(slotId, activityId),
      unassignActivity: (slotId, activityId) =>
        api.schedule.instanceLocationSlots.unassignActivity(slotId, activityId),
    },

    operators: {
      add: (dayId, data) =>
        api.schedule.instanceOperators.createForInquiry(inquiryId, {
          project_event_day_id: dayId,
          position_name: data.position_name,
          position_color: data.position_color,
          contributor_id: data.contributor_id,
          job_role_id: data.job_role_id,
          hours: data.hours,
          notes: data.notes,
          project_activity_id: data.activity_id,
        }),
      remove: (operatorId) =>
        api.schedule.instanceOperators.delete(operatorId),
      assign: (operatorId, contributorId) =>
        api.schedule.instanceOperators.assignCrew(operatorId, contributorId),
      assignActivity: (operatorId, activityId) =>
        api.schedule.instanceOperators.assignActivity(operatorId, activityId),
      unassignActivity: (operatorId, activityId) =>
        api.schedule.instanceOperators.unassignActivity(operatorId, activityId),
      setEquipment: (operatorId, equipment) =>
        api.schedule.instanceOperators.setEquipment(operatorId, equipment),
      refreshAll: () =>
        api.schedule.instanceOperators.getForInquiry(inquiryId),
    },

    eventDays: {
      getAll: () => api.schedule.inquiryEventDays.getAll(inquiryId),
      add: (_dayId) => Promise.resolve(null), // N/A for instance mode
      remove: (dayId) => api.schedule.inquiryEventDays.delete(dayId),
      create: (data) => api.schedule.inquiryEventDays.create(inquiryId, data),
      update: (dayId, data) => api.schedule.inquiryEventDays.update(dayId, data),
      delete: (dayId) => api.schedule.inquiryEventDays.delete(dayId),
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
