import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { SpaceSlotLayoutService } from '../../../../workflow/locations/modules/floor-plans/space-slot-layout.service';
import { PackageCreationRunLogger } from '../run/package-creation-run-logger';

/**
 * Applies deterministic default sandbox layouts (currently: ceremony
 * seating) to a newly created package's sandbox space slots.
 *
 * Used by both catalog and inquiry creators. Never throws: layout failures
 * are logged to the run logger and swallowed so they cannot break package
 * creation. Callers decide whether to await this (catalog, where layout is
 * part of the sync build) or fire-and-forget (inquiry, where drafts do not
 * block on layouts).
 */
@Injectable()
export class SandboxLayoutService {
  private readonly logger = new Logger(SandboxLayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spaceSlotLayouts: SpaceSlotLayoutService,
  ) {}

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
        activity_assignments: {
          include: { package_activity: { select: { name: true } } },
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
    for (const slot of slots) {
      const activityName = slot.activity_assignments[0]?.package_activity?.name ?? '';
      if (!/ceremony/i.test(activityName)) continue;
      ceremonyCount++;
      try {
        await this.spaceSlotLayouts.applyCeremonyLayoutToSpaceSlot(slot.id, { capacity: 100 });
        appliedCount++;
        runLogger.log('LAYOUT', 'Applied ceremony layout', {
          packageId,
          slotId: slot.id,
          activityName,
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
    });
    if (ceremonyCount === 0) {
      runLogger.warn('LAYOUT', 'No ceremony-named activity found for sandbox layouts', {
        packageId,
        activityNames: slots.map((s) => s.activity_assignments[0]?.package_activity?.name ?? '?'),
      });
    }
  }
}
