import { Injectable, Logger } from '@nestjs/common';
import { ActivityPlannerService } from '../../../content/activity-planning/services/activity-planner.service';
import { PackageBlockingPlannerService } from '../../../content/activity-planning/services/package-blocking-planner.service';
import { PlanningEventsService } from '../../../content/activity-planning/services/planning-events.service';
import { PackagePlanningCancelRegistryService } from '../../../content/activity-planning/services/package-planning-cancel-registry.service';
import {
  assertPlanningNotAborted,
  isPlanningCancelledError,
} from '../../../content/activity-planning/package-planning-cancel.constants';
import { DayBlueprintPlacementSeedService } from '../../../content/day-blueprints/services';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { PackageCreationRunLogger } from './run/package-creation-run-logger';
import { SandboxLayoutService } from './shared/sandbox-layout.service';

type PackageCreationPipelineMode = 'blocking' | 'background';
type PackageCreationPipelineSource = 'catalog' | 'inquiry';
type ContentPlanningMode = 'full' | 'blueprint';

@Injectable()
export class PackageCreationPipelineService {
  private readonly logger = new Logger(PackageCreationPipelineService.name);

  constructor(
    private readonly sandboxLayout: SandboxLayoutService,
    private readonly activityPlanner: ActivityPlannerService,
    private readonly packageBlockingPlanner: PackageBlockingPlannerService,
    private readonly planningEvents: PlanningEventsService,
    private readonly prisma: PrismaService,
    private readonly planningCancelRegistry: PackagePlanningCancelRegistryService,
    private readonly blueprintPlacementSeed: DayBlueprintPlacementSeedService,
  ) {}

  async run(
    packageId: number,
    source: PackageCreationPipelineSource,
    mode: PackageCreationPipelineMode,
    runLogger: PackageCreationRunLogger,
    options: { blueprintModeHint?: boolean } = {},
  ): Promise<void> {
    if (mode === 'background') {
      void this.runPipeline(packageId, source, runLogger, options).catch((err: Error) => {
        this.logger.warn(
          `[post-create] background pipeline failed source=${source} package=${packageId}: ${err.message}`,
        );
      });
      return;
    }

    await this.runPipeline(packageId, source, runLogger, options);
  }

  private async runPipeline(
    packageId: number,
    source: PackageCreationPipelineSource,
    runLogger: PackageCreationRunLogger,
    options: { blueprintModeHint?: boolean },
  ): Promise<void> {
    const abortSignal = this.planningCancelRegistry.attach(packageId);
    try {
      const planningMode = await this.resolvePlanningMode(packageId, options.blueprintModeHint);
      this.logger.log(`[post-create] starting source=${source} package=${packageId}`);
      runLogger.setPlanningMode(planningMode);
      runLogger.log('PLANNER', 'Resolved content planning mode', {
        packageId,
        source,
        planningMode,
      });

      await this.applyLayouts(packageId, source, planningMode, runLogger);
      assertPlanningNotAborted(abortSignal);

      this.logger.log(`[post-create] planning package=${packageId}`);
      runLogger.log('PLANNER', 'Running activity planner', { packageId, source, planningMode });
      const planningRun = await this.activityPlanner.planPackageActivities(packageId, runLogger, {
        deferCompletion: true,
        additionalSteps: 1,
        planningMode,
        abortSignal,
      });

      if (!planningRun.succeeded) {
        this.logger.warn(`[post-create] planning failed source=${source} package=${packageId}`);
        return;
      }

      this.logger.log(`[post-create] planning complete source=${source} package=${packageId}`);
      if (planningMode === 'blueprint') {
        try {
          const seedResult = await this.blueprintPlacementSeed.seedPackagePlacementsFromBlueprint(packageId);
          runLogger.log('BUILDER', 'Seeded blueprint placement hints into package floor plan', {
            packageId,
            ...seedResult,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `[post-create] blueprint placement seed failed package=${packageId}: ${message}`,
          );
          runLogger.warn('BUILDER', 'Blueprint placement seed failed', { packageId, error: message });
        }
      }
      const [crewActivityLinks, subjectActivityLinks] = await Promise.all([
        this.prisma.packageCrewSlotActivity.count({
          where: { package_activity: { package_id: packageId } },
        }),
        this.prisma.packageDaySubjectActivity.count({
          where: { package_activity: { package_id: packageId } },
        }),
      ]);
      assertPlanningNotAborted(abortSignal);

      // Blocking runs after planning: full mode uses planner subject_actions as
      // prompt context; blueprint mode uses snapshot actions + placement seed.
      // Never throws — a blocking failure must not prevent planning_status=READY.
      try {
        this.logger.log(`[post-create] blocking package=${packageId}`);
        runLogger.log('BLOCKING', 'Running package blocking planner', { packageId, source });
        this.activityPlanner.startDeferredPackageBlocking(planningRun, runLogger);
        await this.packageBlockingPlanner.planPackageBlocking(packageId, runLogger, {
          stepIndex: Math.max(planningRun.totalSteps - 1, 0),
          totalSteps: Math.max(planningRun.totalSteps, 1),
        }, abortSignal);
        this.logger.log(`[post-create] blocking complete source=${source} package=${packageId}`);
      } catch (err) {
        if (isPlanningCancelledError(err)) {
          this.logger.warn(`[post-create] planning cancelled by user source=${source} package=${packageId}`);
          runLogger.warn('PLANNER', 'Package AI planning cancelled by user', { packageId, source });
          await this.activityPlanner.failDeferredPackagePlanning(planningRun, 'Cancelled by user', runLogger);
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `[post-create] blocking failed source=${source} package=${packageId}: ${message}`,
          stack,
        );
        runLogger.error('BLOCKING', 'Package blocking planner threw', {
          packageId,
          source,
          error: message,
          stack,
        });
      }

      await this.activityPlanner.completeDeferredPackagePlanning(planningRun, runLogger);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.planningEvents.emit({
        packageId,
        step: 'error',
        label: 'Planning pipeline failed',
        status: 'failed',
        stepIndex: 0,
        totalSteps: 0,
        error: message,
      });
      throw err;
    } finally {
      this.planningCancelRegistry.detach(packageId);
    }
  }

  private async resolvePlanningMode(
    packageId: number,
    blueprintModeHint?: boolean,
  ): Promise<ContentPlanningMode> {
    if (blueprintModeHint) return 'blueprint';

    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { source_day_blueprint_version_id: true },
    });

    return pkg?.source_day_blueprint_version_id ? 'blueprint' : 'full';
  }

  private async applyLayouts(
    packageId: number,
    source: PackageCreationPipelineSource,
    planningMode: ContentPlanningMode,
    runLogger: PackageCreationRunLogger,
  ): Promise<void> {
    if (planningMode === 'blueprint' && await this.blueprintSnapshotSlotsHaveObjects(packageId)) {
      this.logger.log(
        `[post-create] skipping ceremony layout pass — blueprint snapshot already materialized objects package=${packageId}`,
      );
      runLogger.log('LAYOUT', 'Skipped default sandbox layouts (blueprint snapshot objects present)', {
        packageId,
        source,
      });
      return;
    }

    this.logger.log(`[post-create] applying sandbox layouts source=${source} package=${packageId}`);
    runLogger.log('LAYOUT', 'Applying default sandbox layouts', { packageId, source });

    try {
      await this.sandboxLayout.applyCeremonyLayouts(packageId, runLogger);
      this.logger.log(`[post-create] sandbox layouts complete source=${source} package=${packageId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `[post-create] sandbox layouts failed source=${source} package=${packageId}: ${message}`,
        stack,
      );
      runLogger.error('LAYOUT', 'Default sandbox layout pass failed', {
        packageId,
        source,
        error: message,
        stack,
      });
    }
  }

  /** True when every blueprint-linked sandbox slot already has floor-plan objects from consume. */
  private async blueprintSnapshotSlotsHaveObjects(packageId: number): Promise<boolean> {
    const slots = await this.prisma.packageSpaceSlot.findMany({
      where: {
        package_id: packageId,
        source_day_blueprint_space_slot_id: { not: null },
        location_slot: { mode: 'SANDBOX' },
      },
      select: {
        _count: { select: { objects: true } },
      },
    });
    if (slots.length === 0) return false;
    return slots.every((slot) => slot._count.objects > 0);
  }
}