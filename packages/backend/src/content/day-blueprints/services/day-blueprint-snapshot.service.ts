import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintSandboxLayoutService } from './day-blueprint-sandbox-layout.service';

type SnapshotSpaceSlot = {
  id: number;
  day_blueprint_location_role_id: number;
  key: string;
  label: string;
  description: string | null;
};

type SnapshotActivity = {
  id: number;
  name: string;
  description: string | null;
  activity_locations: Array<{ day_blueprint_location_role_id: number }>;
  moments: Array<{ placements: Array<{ day_blueprint_space_slot_id: number }> }>;
};

/**
 * Snapshot-on-consume routine.
 *
 * Called by package creation when a published DayBlueprint version is
 * selected. Materializes the authored structure into package-scope
 * rows (PackageActivity, PackageActivityMoment,
 * PackageActivityMomentAction, PackageSpaceSlot lineage) and records
 * a DayBlueprintUsage row.
 *
 * The materialized snapshot is the runtime source of truth for the
 * package. Blueprint tables must not be read live during package
 * runtime — this protects historical packages from upstream edits.
 */
@Injectable()
export class DayBlueprintSnapshotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sandboxLayout: DayBlueprintSandboxLayoutService,
  ) {}

  /**
   * Consume a published version into an existing package. Assumes the
   * package's event days have already been created (i.e. this runs
   * after the existing package-creation day/activity builder has set
   * up PackageEventDay rows). Safe to call exactly once per package.
   */
  async consumeIntoPackage(params: {
    packageId: number;
    blueprintVersionId: number;
  }): Promise<{ activitiesCreated: number; momentsCreated: number; actionsCreated: number; spaceSlotsCreated: number }> {
    const { packageId, blueprintVersionId } = params;

    const version = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: blueprintVersionId },
      include: {
        day_blueprint: true,
        days: {
          orderBy: { order_index: 'asc' },
          include: {
            activities: {
              orderBy: { order_index: 'asc' },
              include: {
                activity_locations: true,
                moments: {
                  orderBy: { order_index: 'asc' },
                  include: { actions: true, placements: true },
                },
              },
            },
          },
        },
        space_slots: { orderBy: { order_index: 'asc' } },
      },
    });
    if (!version) throw new NotFoundException('Blueprint version not found');
    if (version.status !== 'PUBLISHED') {
      throw new BadRequestException('Only PUBLISHED versions can be consumed into a package');
    }

    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      include: {
        package_event_days: { orderBy: { order_index: 'asc' } },
      },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    let activitiesCreated = 0;
    let momentsCreated = 0;
    let actionsCreated = 0;
    let spaceSlotsCreated = 0;

    await this.prisma.$transaction(async (tx) => {
      const blueprintSlots = new Map<number, SnapshotSpaceSlot>(
        version.space_slots.map((slot) => [slot.id, slot]),
      );
      const packageSlotIds = new Map<string, number>();

      // Stamp lineage on the package header so UI can surface "Designed
      // from: Wedding Day - Civil UK Ceremony v3".
      await tx.service_packages.update({
        where: { id: packageId },
        data: {
          source_day_blueprint_id: version.day_blueprint_id,
          source_day_blueprint_version_id: version.id,
        },
      });

      // Pair blueprint days to package event days positionally. Day
      // blueprint days do not carry a direct FK to package event day
      // rows — the package wizard already picks which EventDay rows
      // apply, and this snapshotter fills them with blueprint content.
      const pkgDays = pkg.package_event_days;
      for (let i = 0; i < version.days.length; i++) {
        const bpDay = version.days[i];
        const pkgDay = pkgDays[i];
        if (!pkgDay) break; // package has fewer days than blueprint; remainder skipped

        for (const bpActivity of bpDay.activities) {
          const activity = await tx.packageActivity.create({
            data: {
              package_id: packageId,
              package_event_day_id: pkgDay.id,
              source_day_blueprint_activity_id: bpActivity.id,
              name: bpActivity.name,
              description: bpActivity.description ?? undefined,
              icon: bpActivity.icon ?? undefined,
              color: bpActivity.color ?? undefined,
              start_time: bpActivity.default_start_time ?? undefined,
              duration_minutes: bpActivity.default_duration_minutes ?? undefined,
              order_index: bpActivity.order_index,
            },
          });
          activitiesCreated += 1;

          const activitySlotIds = this.resolveActivitySpaceSlotIds(
            bpActivity,
            version.space_slots,
          );

          for (const blueprintSlotId of activitySlotIds) {
            const blueprintSlot = blueprintSlots.get(blueprintSlotId);
            if (!blueprintSlot) continue;
            const slotKey = `${pkgDay.event_day_template_id}:${blueprintSlot.id}`;
            let packageSlotId = packageSlotIds.get(slotKey);
            if (!packageSlotId) {
              const materialized = await this.ensurePackageSpaceSlot(tx, {
                packageId,
                eventDayTemplateId: pkgDay.event_day_template_id,
                blueprintSlot,
                activityName: bpActivity.name,
                activityDescription: bpActivity.description,
              });
              packageSlotId = materialized.id;
              if (materialized.created) spaceSlotsCreated += 1;
              packageSlotIds.set(slotKey, packageSlotId);
            }

            await tx.spaceActivityAssignment.upsert({
              where: {
                package_space_slot_id_package_activity_id: {
                  package_space_slot_id: packageSlotId,
                  package_activity_id: activity.id,
                },
              },
              create: {
                package_space_slot_id: packageSlotId,
                package_activity_id: activity.id,
              },
              update: {},
            });
          }

          for (const bpMoment of bpActivity.moments) {
            const moment = await tx.packageActivityMoment.create({
              data: {
                package_activity_id: activity.id,
                source_day_blueprint_moment_id: bpMoment.id,
                name: bpMoment.name,
                description: bpMoment.description ?? undefined,
                duration_seconds: bpMoment.duration_seconds,
                order_index: bpMoment.order_index,
                is_required: bpMoment.criticality !== 'OPTIONAL' && bpMoment.criticality !== 'REMOVABLE',
              },
            });
            momentsCreated += 1;

            if (bpMoment.actions.length > 0) {
              const actionData = bpMoment.actions.map((a) => ({
                package_activity_moment_id: moment.id,
                subject_role_id: a.subject_role_id,
                action_text: a.action_text,
                emphasis: a.emphasis,
                notes: a.notes ?? undefined,
                order_index: a.order_index,
                source_day_blueprint_moment_action_id: a.id,
              }));
              await tx.packageActivityMomentAction.createMany({ data: actionData });
              actionsCreated += actionData.length;
            }
          }
        }
      }

      // Upsert the usage row so re-consumes stay idempotent per
      // (version, package).
      await tx.dayBlueprintUsage.upsert({
        where: {
          day_blueprint_version_id_package_id: {
            day_blueprint_version_id: version.id,
            package_id: packageId,
          },
        },
        create: {
          day_blueprint_version_id: version.id,
          package_id: packageId,
          is_current: true,
        },
        update: {
          consumed_at: new Date(),
          is_current: true,
        },
      });

      // Older usages on the same package for prior versions are marked
      // not-current so the drift indicator stays truthful.
      await tx.dayBlueprintUsage.updateMany({
        where: {
          package_id: packageId,
          day_blueprint_version_id: { not: version.id },
        },
        data: { is_current: false },
      });
    });

    return { activitiesCreated, momentsCreated, actionsCreated, spaceSlotsCreated };
  }

  private resolveActivitySpaceSlotIds(activity: SnapshotActivity, slots: SnapshotSpaceSlot[]) {
    const ids = new Set<number>();
    for (const moment of activity.moments) {
      for (const placement of moment.placements) ids.add(placement.day_blueprint_space_slot_id);
    }

    const activityRoleIds = new Set(
      activity.activity_locations.map((location) => location.day_blueprint_location_role_id),
    );
    if (activityRoleIds.size === 0) return Array.from(ids);

    const roleSlots = slots.filter((slot) => activityRoleIds.has(slot.day_blueprint_location_role_id));
    const activityOwned = roleSlots.filter((slot) => this.spaceSlotMatchesActivity(slot, activity.name));
    const chosen = activityOwned.length > 0 ? activityOwned : roleSlots;
    for (const slot of chosen) ids.add(slot.id);
    return Array.from(ids);
  }

  private async ensurePackageSpaceSlot(
    tx: Prisma.TransactionClient,
    params: {
      packageId: number;
      eventDayTemplateId: number;
      blueprintSlot: SnapshotSpaceSlot;
      activityName: string;
      activityDescription: string | null;
    },
  ) {
    const layout = this.sandboxLayout.build({
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

  private spaceSlotMatchesActivity(slot: SnapshotSpaceSlot, activityName: string) {
    const normalizedKey = this.stableKey(slot.key);
    const normalizedLabel = this.normalizeName(slot.label);
    return (
      normalizedKey === this.stableKey(`${activityName} space`) ||
      normalizedLabel === this.normalizeName(activityName) ||
      normalizedLabel === this.normalizeName(`${activityName} Space`)
    );
  }

  private normalizeName(value: string) {
    return value.trim().toLowerCase().replace(/honou?r/g, 'honor').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private stableKey(value: string) {
    return this.normalizeName(value).replace(/ /g, '_');
  }
}
