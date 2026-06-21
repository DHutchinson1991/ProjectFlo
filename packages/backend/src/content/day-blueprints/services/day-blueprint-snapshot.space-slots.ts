import { type Prisma } from '@prisma/client';
import { type DayBlueprintSandboxLayoutService } from './day-blueprint-sandbox-layout.service';

export type SnapshotSpaceSlot = {
  id: number;
  day_blueprint_location_role_id: number;
  key: string;
  label: string;
  description: string | null;
};

export type SnapshotActivity = {
  id: number;
  name: string;
  description: string | null;
  activity_locations: Array<{ day_blueprint_location_role_id: number }>;
  moments: Array<{ placements: Array<{ day_blueprint_space_slot_id: number }> }>;
};

export function resolveActivitySpaceSlotIds(activity: SnapshotActivity, slots: SnapshotSpaceSlot[]) {
  const ids = new Set<number>();
  for (const moment of activity.moments) {
    for (const placement of moment.placements) ids.add(placement.day_blueprint_space_slot_id);
  }

  const activityRoleIds = new Set(
    activity.activity_locations.map((location) => location.day_blueprint_location_role_id),
  );
  if (activityRoleIds.size === 0) return Array.from(ids);

  const roleSlots = slots.filter((slot) => activityRoleIds.has(slot.day_blueprint_location_role_id));
  const activityOwned = roleSlots.filter((slot) => spaceSlotMatchesActivity(slot, activity.name));
  const chosen = activityOwned.length > 0 ? activityOwned : roleSlots;
  for (const slot of chosen) ids.add(slot.id);
  return Array.from(ids);
}

export async function ensurePackageSpaceSlot(
  tx: Prisma.TransactionClient,
  sandboxLayout: DayBlueprintSandboxLayoutService,
  params: {
    packageId: number;
    eventDayTemplateId: number;
    blueprintSlot: SnapshotSpaceSlot;
    activityName: string;
    activityDescription: string | null;
  },
) {
  const layout = sandboxLayout.build({
    label: params.blueprintSlot.label,
    activityName: params.activityName,
    description: params.blueprintSlot.description ?? params.activityDescription,
  });
  const existing = await tx.packageSpaceSlot.findUnique({
    where: {
      package_id_event_day_template_id_label: {
        package_id: params.packageId,
        event_day_template_id: params.eventDayTemplateId,
        label: params.blueprintSlot.label,
      },
    },
    include: { _count: { select: { objects: true, zones: true, type_tags: true } } },
  });

  if (existing) {
    await tx.packageSpaceSlot.update({
      where: { id: existing.id },
      data: {
        description: existing.description ?? layout.description,
        source_day_blueprint_space_slot_id: params.blueprintSlot.id,
        canvas_width: 1000,
        canvas_height: 1000,
      },
    });
    if (existing._count.objects === 0) {
      await tx.spaceSlotObject.createMany({
        data: layout.objects.map((object) => ({ ...object, package_space_slot_id: existing.id })),
      });
    }
    if (existing._count.zones === 0) {
      await tx.spaceSlotZone.createMany({
        data: layout.zones.map((zone) => ({ ...zone, package_space_slot_id: existing.id })),
      });
    }
    if (existing._count.type_tags === 0 && layout.typeTags.length > 0) {
      await tx.packageSpaceSlotTypeTag.createMany({
        data: layout.typeTags.map((spaceType) => ({ package_space_slot_id: existing.id, space_type: spaceType })),
        skipDuplicates: true,
      });
    }
    return { id: existing.id, created: false };
  }

  const slot = await tx.packageSpaceSlot.create({
    data: {
      package_id: params.packageId,
      event_day_template_id: params.eventDayTemplateId,
      label: params.blueprintSlot.label,
      description: layout.description,
      source_day_blueprint_space_slot_id: params.blueprintSlot.id,
      canvas_width: 1000,
      canvas_height: 1000,
      objects: { createMany: { data: layout.objects } },
      zones: { createMany: { data: layout.zones } },
      ...(layout.typeTags.length > 0
        ? { type_tags: { createMany: { data: layout.typeTags.map((spaceType) => ({ space_type: spaceType })) } } }
        : {}),
    },
    select: { id: true },
  });
  return { id: slot.id, created: true };
}

function spaceSlotMatchesActivity(slot: SnapshotSpaceSlot, activityName: string) {
  const normalizedKey = stableKey(slot.key);
  const normalizedLabel = normalizeName(slot.label);
  return (
    normalizedKey === stableKey(`${activityName} space`) ||
    normalizedLabel === normalizeName(activityName) ||
    normalizedLabel === normalizeName(`${activityName} Space`)
  );
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/honou?r/g, 'honor').replace(/[^a-z0-9]+/g, ' ').trim();
}

function stableKey(value: string) {
  return normalizeName(value).replace(/ /g, '_');
}
