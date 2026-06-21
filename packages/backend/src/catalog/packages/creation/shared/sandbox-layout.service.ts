import { Injectable, Logger } from '@nestjs/common';
import { buildSandboxRoomLayout, resolveSandboxSpaceKind } from '@projectflo/shared';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { sandboxLayoutToPrismaCreateInputs } from '../../../../content/spatial/sandbox-room-layout.mapper';
import { PackageCreationRunLogger } from '../run/package-creation-run-logger';

/**
 * Applies deterministic default sandbox layouts to package sandbox space
 * slots that have no floor-plan objects yet (typically ceremony activities
 * on non-blueprint packages). Blueprint packages usually skip this pass
 * because snapshot consume already materialized objects.
 */
@Injectable()
export class SandboxLayoutService {
  private readonly logger = new Logger(SandboxLayoutService.name);

  constructor(private readonly prisma: PrismaService) {}

  async applyCeremonyLayouts(
    packageId: number,
    runLogger: PackageCreationRunLogger,
  ): Promise<void> {
    const slots = await this.prisma.packageSpaceSlot.findMany({
      where: {
        package_id: packageId,
        location_slot: { mode: 'SANDBOX' },
      },
      include: {
        _count: { select: { objects: true } },
        activity_assignments: {
          include: { package_activity: { select: { name: true, description: true } } },
        },
      },
    });
    runLogger.log('LAYOUT', 'Loaded sandbox slots', { packageId, slotCount: slots.length });

    if (slots.length === 0) {
      runLogger.warn('LAYOUT', 'No SANDBOX space slots found', { packageId });
      return;
    }

    let ceremonyCount = 0;
    let appliedCount = 0;
    let skippedHasObjects = 0;

    for (const slot of slots) {
      const activity = slot.activity_assignments[0]?.package_activity;
      const activityName = activity?.name ?? '';
      const kind = resolveSandboxSpaceKind({
        slotLabel: slot.label,
        activityName,
        activityDescription: activity?.description,
      });
      if (kind !== 'ceremony') continue;
      ceremonyCount++;

      if (slot._count.objects > 0) {
        skippedHasObjects += 1;
        continue;
      }

      try {
        const spec = buildSandboxRoomLayout({
          label: slot.label,
          activityName,
          description: activity?.description,
        });
        const layout = sandboxLayoutToPrismaCreateInputs(spec);

        await this.prisma.packageSpaceSlot.update({
          where: { id: slot.id },
          data: {
            description: layout.description,
            canvas_width: 1000,
            canvas_height: 1000,
          },
        });

        if (layout.objects.length > 0) {
          await this.prisma.spaceSlotObject.createMany({
            data: layout.objects.map((object) => ({
              ...object,
              package_space_slot_id: slot.id,
            })),
          });
        }

        if (layout.zones.length > 0) {
          await this.prisma.spaceSlotZone.createMany({
            data: layout.zones.map((zone) => ({
              ...zone,
              package_space_slot_id: slot.id,
            })),
          });
        }

        for (const spaceType of layout.typeTags) {
          await this.prisma.packageSpaceSlotTypeTag.create({
            data: { package_space_slot_id: slot.id, space_type: spaceType },
          }).catch(() => undefined);
        }

        appliedCount += 1;
        runLogger.log('LAYOUT', 'Applied shared ceremony sandbox layout', {
          packageId,
          slotId: slot.id,
          activityName,
          objectCount: layout.objects.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `[sandbox-layout] ceremony layout FAILED slot=${slot.id} activity="${activityName}": ${message}`,
          stack,
        );
        runLogger.error('LAYOUT', 'Ceremony layout failed', {
          packageId,
          slotId: slot.id,
          activityName,
          error: message,
          stack,
        });
      }
    }

    runLogger.log('LAYOUT', 'Default sandbox layout summary', {
      packageId,
      slotCount: slots.length,
      ceremonyCount,
      appliedCount,
      skippedHasObjects,
    });
    if (ceremonyCount === 0) {
      runLogger.warn('LAYOUT', 'No ceremony-named activity found for sandbox layouts', {
        packageId,
        activityNames: slots.map((s) => s.activity_assignments[0]?.package_activity?.name ?? '?'),
      });
    }
  }
}
