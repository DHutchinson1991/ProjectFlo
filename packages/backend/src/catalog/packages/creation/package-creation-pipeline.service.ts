import { Injectable, Logger } from '@nestjs/common';
import { ActivityPlannerService } from '../../../content/activity-planning/services/activity-planner.service';
import { PackageBlockingPlannerService } from '../../../content/activity-planning/services/package-blocking-planner.service';
import { PlanningEventsService } from '../../../content/activity-planning/services/planning-events.service';
import { PackageCreationRunLogger } from './run/package-creation-run-logger';
import { SandboxLayoutService } from './shared/sandbox-layout.service';

type PackageCreationPipelineMode = 'blocking' | 'background';
type PackageCreationPipelineSource = 'catalog' | 'inquiry';

@Injectable()
export class PackageCreationPipelineService {
  private readonly logger = new Logger(PackageCreationPipelineService.name);

  constructor(
    private readonly sandboxLayout: SandboxLayoutService,
    private readonly activityPlanner: ActivityPlannerService,
    private readonly packageBlockingPlanner: PackageBlockingPlannerService,
    private readonly planningEvents: PlanningEventsService,
  ) {}

  async run(
    packageId: number,
    source: PackageCreationPipelineSource,
    mode: PackageCreationPipelineMode,
    runLogger: PackageCreationRunLogger,
  ): Promise<void> {
    if (mode === 'background') {
      void this.runPipeline(packageId, source, runLogger).catch((err: Error) => {
        this.logger.warn(
          `[post-create] background pipeline failed source=${source} package=${packageId}: ${err.message}`,
        );
      });
      return;
    }

    await this.runPipeline(packageId, source, runLogger);
  }

  private async runPipeline(
    packageId: number,
    source: PackageCreationPipelineSource,
    runLogger: PackageCreationRunLogger,
  ): Promise<void> {
    try {
      this.logger.log(`[post-create] starting source=${source} package=${packageId}`);

      await this.applyLayouts(packageId, source, runLogger);

      this.logger.log(`[post-create] planning package=${packageId}`);
      runLogger.log('PLANNER', 'Running activity planner', { packageId, source });
      const planningRun = await this.activityPlanner.planPackageActivities(packageId, runLogger, {
        deferCompletion: true,
        additionalSteps: 1,
      });

      if (!planningRun.succeeded) {
        this.logger.warn(`[post-create] planning failed source=${source} package=${packageId}`);
        return;
      }

      this.logger.log(`[post-create] planning complete source=${source} package=${packageId}`);

      // Blocking runs AFTER activity planning so moments exist and subject_actions
      // from the planner are available as prompt context. Never throws — a blocking
      // failure must not prevent the package from reaching planning_status=READY.
      try {
        this.logger.log(`[post-create] blocking package=${packageId}`);
        runLogger.log('BLOCKING', 'Running package blocking planner', { packageId, source });
        this.activityPlanner.startDeferredPackageBlocking(planningRun, runLogger);
        await this.packageBlockingPlanner.planPackageBlocking(packageId, runLogger, {
          stepIndex: Math.max(planningRun.totalSteps - 1, 0),
          totalSteps: Math.max(planningRun.totalSteps, 1),
        });
        this.logger.log(`[post-create] blocking complete source=${source} package=${packageId}`);
      } catch (err) {
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
    }
  }

  private async applyLayouts(
    packageId: number,
    source: PackageCreationPipelineSource,
    runLogger: PackageCreationRunLogger,
  ): Promise<void> {
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
}