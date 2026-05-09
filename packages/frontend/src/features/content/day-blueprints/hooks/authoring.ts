import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { dayBlueprintsAuthoringApi } from '../api';
import type {
  CreateActivityInput,
  CreateDayBlueprintVersionInput,
  CreateDayInput,
  CreateLocationRoleInput,
  LinkActivityLocationInput,
  CreateLockRuleInput,
  CreateMomentActionInput,
  CreateMomentInput,
  CreateMomentPlacementInput,
  CreateSpaceSlotInput,
  CreateSubjectRoleLinkInput,
  UpdateActivityInput,
  UpdateDayInput,
  UpdateLockRuleInput,
  UpdateMomentActionInput,
  UpdateMomentInput,
  UpdateMomentPlacementInput,
  UpdateSpaceSlotInput,
  UpdateSubjectRoleLinkInput,
} from '../api/authoring';
import { dayBlueprintKeys } from './index';

/**
 * Invalidate the full detail cache for a (blueprintId, versionId) pair.
 * All authoring mutations call this on success since the editor reads
 * the tree off the version detail response.
 */
function useInvalidateVersion(blueprintId: number | null, versionId: number | null) {
  const qc = useQueryClient();
  return () => {
    if (blueprintId && versionId) {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.version(blueprintId, versionId) });
    }
    if (blueprintId) {
      qc.invalidateQueries({ queryKey: dayBlueprintKeys.detail(blueprintId) });
    }
  };
}

export function useCreateDayBlueprintVersion(blueprintId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDayBlueprintVersionInput) =>
      dayBlueprintsAuthoringApi.versions.createDraft(blueprintId as number, data),
    onSuccess: () => {
      if (blueprintId) {
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.detail(blueprintId) });
        qc.invalidateQueries({ queryKey: dayBlueprintKeys.lists() });
      }
    },
  });
}

// ─── Days ─────────────────────────────────────────────────────────

export function useCreateDay(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (data: CreateDayInput) =>
      dayBlueprintsAuthoringApi.days.create(versionId as number, data),
    onSuccess: invalidate,
  });
}

export function useUpdateDay(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ dayId, data }: { dayId: number; data: UpdateDayInput }) =>
      dayBlueprintsAuthoringApi.days.update(dayId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteDay(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (dayId: number) => dayBlueprintsAuthoringApi.days.delete(dayId),
    onSuccess: invalidate,
  });
}

// ─── Activities ───────────────────────────────────────────────────

export function useCreateActivity(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ dayId, data }: { dayId: number; data: CreateActivityInput }) =>
      dayBlueprintsAuthoringApi.activities.create(dayId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateActivity(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ activityId, data }: { activityId: number; data: UpdateActivityInput }) =>
      dayBlueprintsAuthoringApi.activities.update(activityId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteActivity(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (activityId: number) => dayBlueprintsAuthoringApi.activities.delete(activityId),
    onSuccess: invalidate,
  });
}

export function useLinkActivityLocation(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ activityId, data }: { activityId: number; data: LinkActivityLocationInput }) =>
      dayBlueprintsAuthoringApi.activityLocations.link(activityId, data),
    onSuccess: invalidate,
  });
}

// ─── Moments ──────────────────────────────────────────────────────

export function useCreateMoment(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ activityId, data }: { activityId: number; data: CreateMomentInput }) =>
      dayBlueprintsAuthoringApi.moments.create(activityId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateMoment(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ momentId, data }: { momentId: number; data: UpdateMomentInput }) =>
      dayBlueprintsAuthoringApi.moments.update(momentId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteMoment(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (momentId: number) => dayBlueprintsAuthoringApi.moments.delete(momentId),
    onSuccess: invalidate,
  });
}

// ─── Moment actions + placements ──────────────────────────────────

export function useCreateMomentAction(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ momentId, data }: { momentId: number; data: CreateMomentActionInput }) =>
      dayBlueprintsAuthoringApi.momentActions.create(momentId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateMomentAction(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ actionId, data }: { actionId: number; data: UpdateMomentActionInput }) =>
      dayBlueprintsAuthoringApi.momentActions.update(actionId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteMomentAction(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (actionId: number) => dayBlueprintsAuthoringApi.momentActions.delete(actionId),
    onSuccess: invalidate,
  });
}

export function useCreateMomentPlacement(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ momentId, data }: { momentId: number; data: CreateMomentPlacementInput }) =>
      dayBlueprintsAuthoringApi.momentPlacements.create(momentId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateMomentPlacement(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ placementId, data }: { placementId: number; data: UpdateMomentPlacementInput }) =>
      dayBlueprintsAuthoringApi.momentPlacements.update(placementId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteMomentPlacement(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (placementId: number) =>
      dayBlueprintsAuthoringApi.momentPlacements.delete(placementId),
    onSuccess: invalidate,
  });
}

// ─── Subject role links ──────────────────────────────────────────

export function useCreateSubjectRoleLink(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (data: CreateSubjectRoleLinkInput) =>
      dayBlueprintsAuthoringApi.subjectRoleLinks.create(versionId as number, data),
    onSuccess: invalidate,
  });
}
export function useUpdateSubjectRoleLink(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ rowId, data }: { rowId: number; data: UpdateSubjectRoleLinkInput }) =>
      dayBlueprintsAuthoringApi.subjectRoleLinks.update(rowId, data),
    onSuccess: invalidate,
  });
}
export function useDeleteSubjectRoleLink(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (rowId: number) => dayBlueprintsAuthoringApi.subjectRoleLinks.delete(rowId),
    onSuccess: invalidate,
  });
}

// ─── Space slots ─────────────────────────────────────────────────

export function useCreateSpaceSlot(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (data: CreateSpaceSlotInput) =>
      dayBlueprintsAuthoringApi.spaceSlots.create(versionId as number, data),
    onSuccess: invalidate,
  });
}
export function useUpdateSpaceSlot(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ slotId, data }: { slotId: number; data: UpdateSpaceSlotInput }) =>
      dayBlueprintsAuthoringApi.spaceSlots.update(slotId, data),
    onSuccess: invalidate,
  });
}
export function useDeleteSpaceSlot(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (slotId: number) => dayBlueprintsAuthoringApi.spaceSlots.delete(slotId),
    onSuccess: invalidate,
  });
}

// ─── Lock rules ──────────────────────────────────────────────────

export function useCreateLockRule(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (data: CreateLockRuleInput) =>
      dayBlueprintsAuthoringApi.lockRules.create(versionId as number, data),
    onSuccess: invalidate,
  });
}
export function useUpdateLockRule(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: number; data: UpdateLockRuleInput }) =>
      dayBlueprintsAuthoringApi.lockRules.update(ruleId, data),
    onSuccess: invalidate,
  });
}
export function useDeleteLockRule(blueprintId: number | null, versionId: number | null) {
  const invalidate = useInvalidateVersion(blueprintId, versionId);
  return useMutation({
    mutationFn: (ruleId: number) => dayBlueprintsAuthoringApi.lockRules.delete(ruleId),
    onSuccess: invalidate,
  });
}

// ─── Location roles (brand vocabulary) ───────────────────────────

export function useLocationRoles() {
  return useQuery({
    queryKey: [...dayBlueprintKeys.all, 'location-roles'],
    queryFn: () => dayBlueprintsAuthoringApi.locationRoles.list(),
  });
}

export function useCreateLocationRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLocationRoleInput) =>
      dayBlueprintsAuthoringApi.locationRoles.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...dayBlueprintKeys.all, 'location-roles'] });
    },
  });
}
