import { DayBlueprintPlacementFacing, DayBlueprintPlacementPosition } from '@prisma/client';

export function pickActivitySlot(
  slots: Array<{ id: number; day_blueprint_location_role_id: number; key: string; label: string }>,
  activityRoleIds: number[],
  activityName: string,
) {
  const byLocation = slots.find((slot) => activityRoleIds.includes(slot.day_blueprint_location_role_id));
  if (byLocation) return byLocation;

  const normalizedActivityName = normalize(activityName);
  const byName = slots.find((slot) => {
    const key = normalize(slot.key);
    const label = normalize(slot.label);
    return key.includes(normalizedActivityName) || label.includes(normalizedActivityName);
  });
  if (byName) return byName;

  return slots[0] ?? null;
}

export function deriveSpatialHints(input: {
  roleName: string;
  activityName: string;
  momentName: string;
  actionText?: string;
  roleId: number;
}): {
  position: DayBlueprintPlacementPosition;
  facing: DayBlueprintPlacementFacing;
} {
  const role = normalize(input.roleName);
  const activity = normalize(input.activityName);
  const moment = normalize(input.momentName);
  const action = normalize(input.actionText ?? '');
  const context = `${activity} ${moment} ${action}`;
  const ceremonyLike = /ceremony|vow|ring|kiss|processional|recessional/.test(context);
  const processionalLike = /processional|procession|entrance|entry|enter|down the aisle|walk/.test(context);
  const recessionalLike = /recessional|recession|exit|depart|dismiss/.test(context);
  const actionMovementLike = /processional|procession|entrance|entry|enter|down the aisle|walk/.test(action);
  const momentProcessionalLike = /processional|procession|entrance|entry/.test(moment);
  const brideEntranceMoment = /\b(bride|bridal)\b/.test(moment) && momentProcessionalLike;
  const groomEntranceMoment = /\bgroom\b/.test(moment) && momentProcessionalLike;
  const bridesidePartyEntranceMoment =
    /\b(bridal party|bridesmaids?|maid of honor|matron of honor|flower girl)\b/.test(moment) && momentProcessionalLike;
  const groomsidePartyEntranceMoment =
    /\b(groomsmen|groomsman|best man|groom party|ring bearer|ringbearer)\b/.test(moment) && momentProcessionalLike;

  if (/officiant|celebrant/.test(role)) {
    return {
      position: DayBlueprintPlacementPosition.ALTAR_FRONT,
      facing: DayBlueprintPlacementFacing.TOWARD_AUDIENCE,
    };
  }

  const brideLead = isBrideLeadRole(role);
  const groomLead = isGroomLeadRole(role);
  const coupleAlias = /\b(partner|couple)\b/.test(role);

  if (brideLead || groomLead || coupleAlias) {
    const roleProcessionalLike = actionMovementLike ||
      (brideLead && brideEntranceMoment) ||
      (groomLead && groomEntranceMoment);
    if (recessionalLike) {
      return {
        position: DayBlueprintPlacementPosition.AISLE_END,
        facing: DayBlueprintPlacementFacing.TOWARD_AISLE,
      };
    }
    if (roleProcessionalLike) {
      return {
        position: DayBlueprintPlacementPosition.AISLE_START,
        facing: DayBlueprintPlacementFacing.TOWARD_ALTAR,
      };
    }
    return {
      position: ceremonyLike
        ? DayBlueprintPlacementPosition.ALTAR_FRONT
        : DayBlueprintPlacementPosition.CENTER,
      facing: ceremonyLike
        ? DayBlueprintPlacementFacing.TOWARD_PARTNER
        : DayBlueprintPlacementFacing.TOWARD_CAMERA,
    };
  }

  if (isWeddingPartyRole(role)) {
    const bridesidePartyRole = isBridesidePartyRole(role);
    const groomsidePartyRole = isGroomsidePartyRole(role);
    const roleProcessionalLike =
      actionMovementLike ||
      (bridesidePartyRole && bridesidePartyEntranceMoment) ||
      (groomsidePartyRole && groomsidePartyEntranceMoment) ||
      (!bridesidePartyRole && !groomsidePartyRole && processionalLike);
    if (recessionalLike) {
      return {
        position: DayBlueprintPlacementPosition.AISLE_END,
        facing: DayBlueprintPlacementFacing.TOWARD_AISLE,
      };
    }
    if (roleProcessionalLike) {
      return {
        position: DayBlueprintPlacementPosition.AISLE_START,
        facing: DayBlueprintPlacementFacing.TOWARD_ALTAR,
      };
    }
    return {
      position: bridesidePartyRole
        ? DayBlueprintPlacementPosition.STAGE_LEFT
        : groomsidePartyRole
          ? DayBlueprintPlacementPosition.STAGE_RIGHT
          : DayBlueprintPlacementPosition.CENTER,
      facing: ceremonyLike
        ? DayBlueprintPlacementFacing.TOWARD_ALTAR
        : DayBlueprintPlacementFacing.TOWARD_CAMERA,
    };
  }

  if (/guest|audience|family/.test(role)) {
    return {
      position: input.roleId % 2 === 0
        ? DayBlueprintPlacementPosition.FIRST_ROW_LEFT
        : DayBlueprintPlacementPosition.FIRST_ROW_RIGHT,
      facing: DayBlueprintPlacementFacing.TOWARD_ALTAR,
    };
  }

  return {
    position: input.roleId % 2 === 0
      ? DayBlueprintPlacementPosition.STAGE_LEFT
      : DayBlueprintPlacementPosition.STAGE_RIGHT,
    facing: DayBlueprintPlacementFacing.TOWARD_CAMERA,
  };
}

export function lockFlagsToPlainObject(raw: unknown): Record<string, unknown> {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return { ...(raw as Record<string, unknown>) };
}

export function mergeDayBlueprintMomentLockFlags(current: unknown, patch: unknown): Record<string, unknown> {
  return { ...lockFlagsToPlainObject(current), ...lockFlagsToPlainObject(patch) };
}

export function sanitizeDayBlueprintMomentLockFlagsJson(raw: unknown): Record<string, unknown> | undefined {
  const obj = lockFlagsToPlainObject(raw);
  if (Object.keys(obj).length === 0) return undefined;
  return obj;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isWeddingPartyRole(role: string): boolean {
  return /\b(maid of honor|matron of honor|bridesmaid|bridesmaids|best man|groomsman|groomsmen|flower girl|ring bearer|ringbearer|wedding party|attendant)\b/.test(role);
}

function isBridesidePartyRole(role: string): boolean {
  return /\b(maid of honor|matron of honor|bridesmaid|bridesmaids|flower girl)\b/.test(role);
}

function isGroomsidePartyRole(role: string): boolean {
  return /\b(best man|groomsman|groomsmen|ring bearer|ringbearer)\b/.test(role);
}

function isBrideLeadRole(role: string): boolean {
  return /\bbride\b/.test(role) && !isBridesidePartyRole(role) && !/\b(father|mother|parent)s?\b/.test(role);
}

function isGroomLeadRole(role: string): boolean {
  return /\bgroom\b/.test(role) && !isGroomsidePartyRole(role) && !/\b(father|mother|parent)s?\b/.test(role);
}
