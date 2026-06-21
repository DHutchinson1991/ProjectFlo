import { Injectable, Logger } from '@nestjs/common';
import {
  assignCeremonySyntheticSeats,
  buildCeremonyBlueprintSubjectRoleInstances,
  buildCeremonyMotionTextForRole,
  CeremonySeatLayoutMode,
  computeCeremonyGuestSeatCapacity,
  coordinatesFromBlueprintPlacement,
  deriveSandboxAnchors,
  inferCeremonyMomentSeated,
  isGuestLikeRoleLabel,
  resolveSandboxSpaceKind,
  resolveSpatialCollisions,
  shouldSkipCeremonySeatSnap,
  type CeremonyRoleInstanceInput,
  type FloorPlanChairObject,
} from '@projectflo/shared';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { SpaceSlotSpatialSyncService } from '../../../workflow/locations/modules/floor-plans/space-slot-spatial-sync.service';

export interface BlueprintPlacementSeedResult {
  momentsSeeded: number;
  placementsWritten: number;
  skippedNoPosition: number;
}

export interface BlueprintPlacementSeedOptions {
  seatLayout?: CeremonySeatLayoutMode;
}

function normalizePlacementRoleKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/honou?r/g, 'honor')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Materializes Day Blueprint placement hints into package-scoped
 * `SpaceSlotMomentSubject` rows so Blocking AI can treat subject
 * layout as fixed (cameras-only in blueprint mode).
 */
@Injectable()
export class DayBlueprintPlacementSeedService {
  private readonly logger = new Logger(DayBlueprintPlacementSeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spatialSync: SpaceSlotSpatialSyncService,
  ) {}

  async seedPackagePlacementsFromBlueprint(
    packageId: number,
    options?: BlueprintPlacementSeedOptions,
  ): Promise<BlueprintPlacementSeedResult> {
    const seatLayout = options?.seatLayout ?? CeremonySeatLayoutMode.FLUID;
    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { source_day_blueprint_version_id: true },
    });
    if (!pkg?.source_day_blueprint_version_id) {
      return { momentsSeeded: 0, placementsWritten: 0, skippedNoPosition: 0 };
    }

    await this.ensureBlueprintActivityLinks(packageId);
    await this.spatialSync.getByPackage(packageId, { sync: true });

    const assignments = await this.prisma.spaceActivityAssignment.findMany({
      where: { package_activity: { package_id: packageId } },
      include: {
        package_activity: {
          select: {
            id: true,
            name: true,
            description: true,
            moments: {
              where: { source_day_blueprint_moment_id: { not: null } },
              orderBy: { order_index: 'asc' },
              select: {
                id: true,
                source_day_blueprint_moment_id: true,
              },
            },
          },
        },
        package_space_slot: {
          include: {
            objects: true,
            source_day_blueprint_space_slot: { select: { key: true, label: true } },
          },
        },
      },
    });

    const sourceMomentIds = assignments.flatMap((a) =>
      a.package_activity.moments
        .map((m) => m.source_day_blueprint_moment_id)
        .filter((id): id is number => id != null),
    );
    if (sourceMomentIds.length === 0) {
      return { momentsSeeded: 0, placementsWritten: 0, skippedNoPosition: 0 };
    }

    const blueprintMoments = await this.prisma.dayBlueprintMoment.findMany({
      where: { id: { in: sourceMomentIds } },
      include: {
        placements: {
          orderBy: { order_index: 'asc' },
          include: { subject_role: { select: { id: true, role_name: true } } },
        },
        actions: {
          orderBy: { order_index: 'asc' },
          select: {
            subject_role_id: true,
            action_text: true,
            notes: true,
          },
        },
      },
    });
    const blueprintById = new Map(blueprintMoments.map((m) => [m.id, m]));

    let momentsSeeded = 0;
    let placementsWritten = 0;
    let skippedNoPosition = 0;

    for (const assignment of assignments) {
      const activityId = assignment.package_activity.id;
      const spaceSlotId = assignment.package_space_slot.id;

      try {
        await this.spatialSync.syncCamerasAndSubjects(spaceSlotId, activityId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[placement-seed] spatial bootstrap failed package=${packageId} activity=${activityId} slot=${spaceSlotId}: ${message}`,
        );
      }

      const subjectLinks = await this.prisma.packageDaySubjectActivity.findMany({
        where: { package_activity_id: activityId },
        include: {
          package_day_subject: {
            select: { id: true, name: true, role_template_id: true, count: true, order_index: true },
          },
        },
      });

      const subjectPositions = await this.prisma.spaceSlotSubjectPosition.findMany({
        where: { package_space_slot_id: spaceSlotId, day_subject_id: { not: null } },
        select: { id: true, day_subject_id: true, order_index: true },
        orderBy: { order_index: 'asc' },
      });
      const positionsByDaySubjectId = new Map<number, typeof subjectPositions>();
      for (const position of subjectPositions) {
        if (position.day_subject_id == null) continue;
        const list = positionsByDaySubjectId.get(position.day_subject_id) ?? [];
        list.push(position);
        positionsByDaySubjectId.set(position.day_subject_id, list);
      }

      const bpSlot = assignment.package_space_slot.source_day_blueprint_space_slot;
      const kind = resolveSandboxSpaceKind({
        slotKey: bpSlot?.key ?? null,
        slotLabel: assignment.package_space_slot.label,
        activityName: assignment.package_activity.name,
        activityDescription: assignment.package_activity.description,
      });

      const chairObjects: FloorPlanChairObject[] = assignment.package_space_slot.objects.map((o) => ({
        object_type: o.object_type,
        x: o.x,
        y: o.y,
        width: o.width,
        height: o.height,
        metadata: (o.metadata as Record<string, unknown> | null) ?? null,
      }));
      // Named landmarks derived from the slot geometry — shared with the
      // Day Designer preview and the blocking AI prompt.
      const anchors = deriveSandboxAnchors(chairObjects);

      for (const moment of assignment.package_activity.moments) {
        const bpMomentId = moment.source_day_blueprint_moment_id!;
        const bpMoment = blueprintById.get(bpMomentId);
        if (!bpMoment || bpMoment.placements.length === 0) continue;

        let wroteForMoment = false;
        const placements = bpMoment.placements;
        const actionByRoleId = new Map(
          bpMoment.actions.map((action) => [action.subject_role_id, action]),
        );
        const momentName = bpMoment.name;
        const guestSeatCapacity =
          kind === 'ceremony' && chairObjects.some((object) => object.object_type === 'CHAIR_ROW')
            ? computeCeremonyGuestSeatCapacity(chairObjects, seatLayout)
            : 0;
        const placementInstances = buildCeremonyBlueprintSubjectRoleInstances(
          placements.flatMap((placement, placementIndex) => {
            const roleLabel = placement.subject_role?.role_name ?? '';
            const link =
              subjectLinks.find(
                (l) => l.package_day_subject.role_template_id === placement.subject_role_id,
              ) ??
              (roleLabel
                ? subjectLinks.find(
                    (l) =>
                      normalizePlacementRoleKey(l.package_day_subject.name) ===
                      normalizePlacementRoleKey(roleLabel),
                  )
                : undefined);
            if (!link) return [];
            return [{
              roleId: placement.subject_role_id,
              roleLabel: roleLabel || link.package_day_subject.name,
              typicalCount: link.package_day_subject.count,
              orderIndex: placement.order_index ?? placementIndex,
              placement,
              link,
              placementIndex,
            }];
          }),
          guestSeatCapacity > 0 ? { guestSeatCapacity } : undefined,
        );

        const useCeremonySeats =
          kind === 'ceremony' &&
          chairObjects.some((object) => object.object_type === 'CHAIR_ROW');
        const ceremonySeatInputs: CeremonyRoleInstanceInput[] = placementInstances.map((instance) => {
          const placement = instance.role.placement;
          const action = actionByRoleId.get(instance.roleId);
          const motionText = buildCeremonyMotionTextForRole({
            actionText: action?.action_text,
            actionNotes: action?.notes,
            placementPositionHint: placement.position_hint,
            placementNotes: placement.notes,
            momentName,
          });
          return {
            roleId: instance.roleId,
            copyIndex: instance.copyIndex,
            copyCount: instance.copyCount,
            roleLink: { order_index: instance.role.orderIndex },
            roleLabel: instance.roleLabel,
            skipSeatSnap: shouldSkipCeremonySeatSnap(instance.roleLabel, motionText),
          };
        });
        const ceremonySeatResult = useCeremonySeats
          ? assignCeremonySyntheticSeats(chairObjects, ceremonySeatInputs, { seatLayout })
          : null;

        const pendingRows: Array<{
          subjectPositionId: number;
          x: number;
          y: number;
          rotation: number;
          fixed: boolean;
          seated: boolean;
        }> = [];

        for (const instance of placementInstances) {
          const placement = instance.role.placement;
          const link = instance.role.link;
          const roleLabel = placement.subject_role?.role_name ?? link.package_day_subject.name;
          const positions = positionsByDaySubjectId.get(link.package_day_subject_id) ?? [];
          const subjectPosition = positions[instance.copyIndex];
          if (!subjectPosition) {
            skippedNoPosition += 1;
            continue;
          }

          const placementInput = {
            position_hint: placement.position_hint,
            facing_hint: placement.facing_hint,
            notes: placement.notes,
          };
          const action = actionByRoleId.get(instance.roleId);
          const motionText = buildCeremonyMotionTextForRole({
            actionText: action?.action_text,
            actionNotes: action?.notes,
            placementPositionHint: placement.position_hint,
            placementNotes: placement.notes,
            momentName,
          });
          const seatKey = `${instance.roleId}:${instance.copyIndex}`;
          const skipSeatSnap = shouldSkipCeremonySeatSnap(roleLabel, motionText);
          const snapped = ceremonySeatResult && !skipSeatSnap
            ? ceremonySeatResult.seatByInstanceKey.get(seatKey)
            : undefined;

          if (
            kind === 'ceremony' &&
            isGuestLikeRoleLabel(roleLabel) &&
            useCeremonySeats &&
            !skipSeatSnap &&
            !snapped
          ) {
            skippedNoPosition += 1;
            continue;
          }

          const coords = snapped ?? coordinatesFromBlueprintPlacement(
            placementInput,
            instance.instanceOrdinal,
            placementInstances.length,
            kind,
            roleLabel,
            instance.copyIndex,
            chairObjects,
            { motionText, momentName, anchors },
          );

          pendingRows.push({
            subjectPositionId: subjectPosition.id,
            x: coords.x,
            y: coords.y,
            rotation: coords.rotation,
            // Seat-snapped subjects occupy assigned seats — immovable for collision resolution.
            fixed: Boolean(snapped),
            seated: inferCeremonyMomentSeated(roleLabel, motionText, { pewSnapped: Boolean(snapped) }),
          });
        }

        // Deterministic collision pass: push subjects out of solid furniture
        // and enforce minimum separation, so seeded rows are always valid.
        resolveSpatialCollisions(pendingRows, chairObjects);

        for (const row of pendingRows) {
          await this.prisma.spaceSlotMomentSubject.upsert({
            where: {
              subject_position_id_moment_id: {
                subject_position_id: row.subjectPositionId,
                moment_id: moment.id,
              },
            },
            create: {
              subject_position_id: row.subjectPositionId,
              moment_id: moment.id,
              x: row.x,
              y: row.y,
              rotation: row.rotation,
              seated: row.seated,
              present: true,
            },
            update: {
              x: row.x,
              y: row.y,
              rotation: row.rotation,
              seated: row.seated,
              present: true,
            },
          });

          placementsWritten += 1;
          wroteForMoment = true;
        }

        if (wroteForMoment) momentsSeeded += 1;
      }
    }

    this.logger.log(
      `[placement-seed] package=${packageId} moments=${momentsSeeded} placements=${placementsWritten} skipped=${skippedNoPosition}`,
    );

    return { momentsSeeded, placementsWritten, skippedNoPosition };
  }

  /** Links package subjects and crew slots to blueprint-sourced activities (idempotent). */
  private async ensureBlueprintActivityLinks(packageId: number): Promise<void> {
    const activities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId },
      select: { id: true, package_event_day_id: true },
    });
    if (activities.length === 0) return;

    const packageEventDayIds = Array.from(new Set(
      activities.map((activity) => activity.package_event_day_id).filter((id): id is number => id != null),
    ));
    if (packageEventDayIds.length === 0) return;

    const [packageEventDays, crewSlots] = await Promise.all([
      this.prisma.packageEventDay.findMany({
        where: { id: { in: packageEventDayIds } },
        select: { id: true, event_day_template_id: true },
      }),
      this.prisma.packageCrewSlot.findMany({
        where: { package_id: packageId, package_event_day_id: { in: packageEventDayIds } },
        select: { id: true, package_event_day_id: true },
      }),
    ]);

    const eventDayTemplateByJoinId = new Map(
      packageEventDays.map((day) => [day.id, day.event_day_template_id]),
    );
    const eventTemplateIds = Array.from(new Set(
      packageEventDays.map((day) => day.event_day_template_id),
    ));
    const subjects = await this.prisma.packageDaySubject.findMany({
      where: {
        package_id: packageId,
        event_day_template_id: { in: eventTemplateIds },
      },
      select: { id: true, event_day_template_id: true },
    });
    const subjectsByTemplateId = new Map<number, number[]>();
    for (const subject of subjects) {
      const list = subjectsByTemplateId.get(subject.event_day_template_id) ?? [];
      list.push(subject.id);
      subjectsByTemplateId.set(subject.event_day_template_id, list);
    }
    const crewSlotsByJoinDayId = new Map<number, number[]>();
    for (const crewSlot of crewSlots) {
      const list = crewSlotsByJoinDayId.get(crewSlot.package_event_day_id) ?? [];
      list.push(crewSlot.id);
      crewSlotsByJoinDayId.set(crewSlot.package_event_day_id, list);
    }

    for (const activity of activities) {
      const joinDayId = activity.package_event_day_id;
      if (joinDayId == null) continue;
      const templateDayId = eventDayTemplateByJoinId.get(joinDayId);
      if (templateDayId == null) continue;

      const subjectIds = subjectsByTemplateId.get(templateDayId) ?? [];
      const crewSlotIds = crewSlotsByJoinDayId.get(joinDayId) ?? [];

      if (subjectIds.length > 0) {
        await this.prisma.packageDaySubjectActivity.createMany({
          data: subjectIds.map((subjectId) => ({
            package_day_subject_id: subjectId,
            package_activity_id: activity.id,
          })),
          skipDuplicates: true,
        });
      }

      if (crewSlotIds.length > 0) {
        await this.prisma.packageCrewSlotActivity.createMany({
          data: crewSlotIds.map((crewSlotId) => ({
            package_crew_slot_id: crewSlotId,
            package_activity_id: activity.id,
          })),
          skipDuplicates: true,
        });
      }
    }
  }
}
