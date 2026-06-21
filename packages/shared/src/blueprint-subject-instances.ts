export interface BlueprintSubjectRoleInstanceInput {
  roleId: number;
  roleLabel: string;
  typicalCount?: number | null;
  orderIndex?: number | null;
}

export interface BlueprintSubjectRoleInstance<T extends BlueprintSubjectRoleInstanceInput = BlueprintSubjectRoleInstanceInput> {
  role: T;
  roleId: number;
  roleLabel: string;
  copyIndex: number;
  copyCount: number;
  instanceOrdinal: number;
}

export function subjectRoleInstanceCount(value: number | null | undefined): number {
  return Math.max(Math.floor(Number(value ?? 1)), 1);
}

export function isGuestLikeRoleLabel(roleLabel: string): boolean {
  return /\bguests?\b|audience|crowd|congregation/i.test(roleLabel);
}

export function floorPlanSubjectLabel(roleLabel: string, copyIndex: number, copyCount: number): string {
  if (isGuestLikeRoleLabel(roleLabel)) {
    return '';
  }
  if (copyCount <= 1) {
    return splitRoleNameAcrossTwoLines(roleLabel.trim());
  }
  return `${splitRoleNameAcrossTwoLines(roleLabel.trim())}\n${copyIndex + 1}`;
}

/**
 * Caps guest-like roles to physical guest pew capacity so package spatial rows
 * stay one person per chair (not `typical_count` proxy blobs).
 */
export function effectiveCeremonyTypicalCount(
  roleLabel: string,
  typicalCount: number | null | undefined,
  guestSeatCapacity: number,
): number {
  const base = subjectRoleInstanceCount(typicalCount);
  if (!isGuestLikeRoleLabel(roleLabel)) return base;
  if (guestSeatCapacity <= 0) return 1;
  return Math.min(base, guestSeatCapacity);
}

export function buildCeremonyBlueprintSubjectRoleInstances<T extends BlueprintSubjectRoleInstanceInput>(
  roles: T[],
  options?: { guestSeatCapacity?: number },
): Array<BlueprintSubjectRoleInstance<T>> {
  const guestSeatCapacity = options?.guestSeatCapacity;
  if (guestSeatCapacity == null || guestSeatCapacity <= 0) {
    return buildBlueprintSubjectRoleInstances(roles);
  }

  const cappedRoles = roles.map((role) => ({
    ...role,
    typicalCount: isGuestLikeRoleLabel(role.roleLabel)
      ? effectiveCeremonyTypicalCount(role.roleLabel, role.typicalCount, guestSeatCapacity)
      : role.typicalCount,
  }));
  return buildBlueprintSubjectRoleInstances(cappedRoles);
}

export function buildBlueprintSubjectRoleInstances<T extends BlueprintSubjectRoleInstanceInput>(
  roles: T[],
): Array<BlueprintSubjectRoleInstance<T>> {
  let instanceOrdinal = 0;
  const sorted = [...roles].sort((left, right) => {
    const leftOrder = left.orderIndex ?? 0;
    const rightOrder = right.orderIndex ?? 0;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.roleId - right.roleId;
  });

  return sorted.flatMap((role) => {
    const copyCount = subjectRoleInstanceCount(role.typicalCount);
    return Array.from({ length: copyCount }, (_, copyIndex) => {
      const instance: BlueprintSubjectRoleInstance<T> = {
        role,
        roleId: role.roleId,
        roleLabel: role.roleLabel,
        copyIndex,
        copyCount,
        instanceOrdinal,
      };
      instanceOrdinal += 1;
      return instance;
    });
  });
}

function splitRoleNameAcrossTwoLines(name: string): string {
  const t = name.trim();
  if (t.length <= 11) return t;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return t;
  let line1 = words[0]!;
  let i = 1;
  while (i < words.length && `${line1} ${words[i]}`.length <= 12) {
    line1 = `${line1} ${words[i]!}`;
    i += 1;
  }
  if (i >= words.length) return t;
  return `${line1}\n${words.slice(i).join(' ')}`;
}
