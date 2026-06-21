import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintSandboxLayoutService } from './day-blueprint-sandbox-layout.service';
import {
  ensurePackageSpaceSlot,
  resolveActivitySpaceSlotIds,
  type SnapshotActivity,
  type SnapshotSpaceSlot,
} from './day-blueprint-snapshot.space-slots';

/**
 * Snapshot-on-consume routine.
 *
 * Called by package creation when a DayBlueprint version is selected.
 * Accepts PUBLISHED versions and DRAFT versions created by the package
 * wizard (ephemeral — not listed in the published library).
 * Materializes the authored structure into package-scope
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
   * Consume a blueprint version into an existing package. Assumes the
   * package's event days have already been created (i.e. this runs
   * after the existing package-creation day/activity builder has set
   * up PackageEventDay rows). Safe to call exactly once per package.
   */
  async consumeIntoPackage(params: {
    packageId: number;
    blueprintVersionId: number;
    /** When set, only these DayBlueprintActivity rows are materialized. */
    selectedActivityIds?: number[];
    /** DayBlueprintDay.id → PackageTemplateDay.id; resolved to package_event_day rows. */
    blueprintDayMappings?: { blueprintDayId: number; eventTypeDayLinkId: number }[];
  }): Promise<{
    activitiesCreated: number;
    momentsCreated: number;
    actionsCreated: number;
    spaceSlotsCreated: number;
    subjectsCreated: number;
  }> {
    const { packageId, blueprintVersionId, selectedActivityIds, blueprintDayMappings } = params;

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
        subject_roles: {
          orderBy: { order_index: 'asc' },
          include: { subject_role: true },
        },
      },
    });
    if (!version) throw new NotFoundException('Blueprint version not found');
    if (version.status === 'ARCHIVED') {
      throw new BadRequestException('Archived blueprint versions cannot be consumed into a package');
    }
    if (version.status !== 'PUBLISHED' && version.status !== 'DRAFT') {
      throw new BadRequestException('Blueprint version cannot be consumed into a package');
    }

    const versionActivityIds = new Set(
      version.days.flatMap((day) => day.activities.map((activity) => activity.id)),
    );
    const allowedActivityIds = selectedActivityIds
      ? new Set(selectedActivityIds)
      : null;
    if (allowedActivityIds) {
      if (allowedActivityIds.size === 0) {
        throw new BadRequestException('At least one blueprint activity must be selected');
      }
      const invalidIds = selectedActivityIds!.filter((id) => !versionActivityIds.has(id));
      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `Blueprint activity ids are invalid for this version: ${invalidIds.join(', ')}`,
        );
      }
    }

    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      include: {
        package_event_days: { orderBy: { order_index: 'asc' } },
      },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    const blueprintDayToPackageDayId = await this.resolveBlueprintDayToPackageDayMap({
      packageId,
      blueprintVersionId: version.id,
      blueprintDays: version.days,
      packageEventDays: pkg.package_event_days,
      blueprintDayMappings,
      packageTemplateId: pkg.created_from_package_template_id,
    });

    let activitiesCreated = 0;
    let momentsCreated = 0;
    let actionsCreated = 0;
    let spaceSlotsCreated = 0;
    let subjectsCreated = 0;

    await this.prisma.$transaction(async (tx) => {
      const blueprintSlots = new Map<number, SnapshotSpaceSlot>(
        version.space_slots.map((slot) => [slot.id, slot]),
      );
      const packageSlotIds = new Map<string, number>();
      const packageSubjectDaysEnsured = new Set<number>();

      // Stamp lineage on the package header so UI can surface "Designed
      // from: Wedding Day - Civil UK Ceremony v3".
      const existingPkg = await tx.service_packages.findUnique({
        where: { id: packageId },
        select: { contents: true },
      });
      const existingContents =
        existingPkg?.contents &&
        typeof existingPkg.contents === 'object' &&
        !Array.isArray(existingPkg.contents)
          ? (existingPkg.contents as Record<string, unknown>)
          : {};
      await tx.service_packages.update({
        where: { id: packageId },
        data: {
          source_day_blueprint_id: version.day_blueprint_id,
          source_day_blueprint_version_id: version.id,
          ...(blueprintDayMappings && blueprintDayMappings.length > 0
            ? {
                contents: {
                  ...existingContents,
                  blueprint_day_mappings: blueprintDayMappings,
                } as Prisma.InputJsonValue,
              }
            : {}),
        },
      });

      // Pair blueprint days to package event days via explicit wizard
      // mappings or positional 1:1 fallback (single-day packages).
      const pkgDaysById = new Map(pkg.package_event_days.map((d) => [d.id, d]));
      for (const bpDay of version.days) {
        const pkgDayId = blueprintDayToPackageDayId.get(bpDay.id);
        if (!pkgDayId) continue;
        const pkgDay = pkgDaysById.get(pkgDayId);
        if (!pkgDay) continue;

        if (!packageSubjectDaysEnsured.has(pkgDay.id)) {
          subjectsCreated += await this.ensurePackageSubjectsFromBlueprint(tx, {
            packageId,
            eventDayTemplateId: pkgDay.event_day_template_id,
            subjectRoles: version.subject_roles,
          });
          packageSubjectDaysEnsured.add(pkgDay.id);
        }

        for (const bpActivity of bpDay.activities) {
          if (allowedActivityIds && !allowedActivityIds.has(bpActivity.id)) {
            continue;
          }
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

          const activitySlotIds = resolveActivitySpaceSlotIds(
            bpActivity,
            version.space_slots,
          );

          for (const blueprintSlotId of activitySlotIds) {
            const blueprintSlot = blueprintSlots.get(blueprintSlotId);
            if (!blueprintSlot) continue;
            const slotKey = `${pkgDay.event_day_template_id}:${blueprintSlot.id}`;
            let packageSlotId = packageSlotIds.get(slotKey);
            if (!packageSlotId) {
              const materialized = await ensurePackageSpaceSlot(tx, this.sandboxLayout, {
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
                subject_actions: bpMoment.actions.length > 0 ? Prisma.JsonNull : undefined,
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

    return { activitiesCreated, momentsCreated, actionsCreated, spaceSlotsCreated, subjectsCreated };
  }

  private async ensurePackageSubjectsFromBlueprint(
    tx: Prisma.TransactionClient,
    params: {
      packageId: number;
      eventDayTemplateId: number;
      subjectRoles: Array<{
        subject_role_id: number;
        typical_count: number | null;
        order_index: number;
        subject_role: { role_name: string };
      }>;
    },
  ): Promise<number> {
    let created = 0;
    for (const role of params.subjectRoles) {
      const count = role.typical_count != null && role.typical_count > 1 ? role.typical_count : null;
      const existing = await tx.packageDaySubject.findUnique({
        where: {
          package_id_event_day_template_id_name: {
            package_id: params.packageId,
            event_day_template_id: params.eventDayTemplateId,
            name: role.subject_role.role_name,
          },
        },
        select: { id: true },
      });

      if (existing) {
        await tx.packageDaySubject.update({
          where: { id: existing.id },
          data: {
            role_template_id: role.subject_role_id,
            count,
            order_index: role.order_index,
          },
        });
        continue;
      }

      await tx.packageDaySubject.create({
        data: {
          package_id: params.packageId,
          event_day_template_id: params.eventDayTemplateId,
          role_template_id: role.subject_role_id,
          name: role.subject_role.role_name,
          count,
          order_index: role.order_index,
        },
      });
      created += 1;
    }
    return created;
  }

  private async resolveBlueprintDayToPackageDayMap(params: {
    packageId: number;
    blueprintVersionId: number;
    blueprintDays: Array<{ id: number; order_index: number }>;
    packageEventDays: Array<{ id: number; event_day_template_id: number; order_index: number }>;
    blueprintDayMappings?: { blueprintDayId: number; eventTypeDayLinkId: number }[];
    packageTemplateId: number | null;
  }): Promise<Map<number, number>> {
    const {
      blueprintDays,
      packageEventDays,
      blueprintDayMappings,
      packageTemplateId,
    } = params;
    const map = new Map<number, number>();

    if (blueprintDayMappings && blueprintDayMappings.length > 0) {
      if (!packageTemplateId) {
        throw new BadRequestException(
          'Package has no template lineage; cannot resolve blueprint day mappings',
        );
      }
      const templateDayLinks = await this.prisma.packageTemplateDay.findMany({
        where: { package_template_id: packageTemplateId },
        select: { id: true, event_day_template_id: true },
      });
      const templateDayByLinkId = new Map(templateDayLinks.map((d) => [d.id, d]));
      const packageDayByTemplateId = new Map(
        packageEventDays.map((d) => [d.event_day_template_id, d.id]),
      );
      const versionDayIds = new Set(blueprintDays.map((d) => d.id));

      for (const row of blueprintDayMappings) {
        if (map.has(row.blueprintDayId)) {
          throw new BadRequestException('Duplicate blueprint day in blueprintDayMappings');
        }
        if (!versionDayIds.has(row.blueprintDayId)) {
          throw new BadRequestException(
            `Blueprint day id ${row.blueprintDayId} is not on the selected version`,
          );
        }
        const link = templateDayByLinkId.get(row.eventTypeDayLinkId);
        if (!link) {
          throw new BadRequestException(
            `Template day link id ${row.eventTypeDayLinkId} is invalid for this package template`,
          );
        }
        const pkgDayId = packageDayByTemplateId.get(link.event_day_template_id);
        if (!pkgDayId) {
          throw new BadRequestException(
            `No package event day for template day link ${row.eventTypeDayLinkId}`,
          );
        }
        map.set(row.blueprintDayId, pkgDayId);
      }
      return map;
    }

    const sortedBlueprintDays = [...blueprintDays].sort((a, b) => a.order_index - b.order_index);
    const sortedPackageDays = [...packageEventDays].sort((a, b) => a.order_index - b.order_index);
    for (let i = 0; i < sortedBlueprintDays.length; i++) {
      const pkgDay = sortedPackageDays[i];
      if (!pkgDay) break;
      map.set(sortedBlueprintDays[i].id, pkgDay.id);
    }
    return map;
  }

}
