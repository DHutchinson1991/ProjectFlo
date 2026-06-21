import { Injectable, Logger } from '@nestjs/common';
import { CeremonySeatLayoutMode } from '@projectflo/shared';
import { BlockingDirectorService } from '../../../ai/blocking/blocking-director.service';
import { DayBlueprintPlacementSeedService } from '../../day-blueprints/services';
import type { BlueprintPlacementSeedOptions } from '../../day-blueprints/services/day-blueprint-placement-seed.service';
import { PackageCreationRunLogger } from '../../../catalog/packages/creation/run/package-creation-run-logger';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { SpaceSlotSpatialSyncService } from '../../../workflow/locations/modules/floor-plans/space-slot-spatial-sync.service';
import { PackagePlanningProgressService } from './package-planning-progress.service';
import { ActivityPlanningStatusService } from './activity-planning-status.service';
import { assertPlanningNotAborted, isPlanningCancelledError } from '../package-planning-cancel.constants';

interface BlockingProgressContext {
  stepIndex: number;
  totalSteps: number;
}

type BlockingPlannerOptions = BlueprintPlacementSeedOptions & {
  skipPlacementSeed?: boolean;
};

/**
 * Runs the AI Blocking Director once per (activity × space slot × moment)
 * at package creation time, so films cloned from the package inherit
 * per-moment subject positions, camera positions, moment descriptions, and
 * camera→subject targeting plans.
 *
 * Invoked by `PackageCreationPipelineService` after `ActivityPlannerService`.
 * Never throws — package creation must not fail if blocking fails.
 */
@Injectable()
export class PackageBlockingPlannerService {
  private readonly logger = new Logger(PackageBlockingPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockingDirector: BlockingDirectorService,
    private readonly spatialSync: SpaceSlotSpatialSyncService,
    private readonly progress: PackagePlanningProgressService,
    private readonly planningStatus: ActivityPlanningStatusService,
    private readonly placementSeed: DayBlueprintPlacementSeedService,
  ) {}

  private async assertBlockingPlanningContinues(packageId: number, signal?: AbortSignal): Promise<void> {
    assertPlanningNotAborted(signal);
    await this.planningStatus.assertPlanningNotCancelled(packageId);
  }

  async planPackageBlocking(
    packageId: number,
    runLogger: PackageCreationRunLogger,
    progressContext: BlockingProgressContext = { stepIndex: 0, totalSteps: 1 },
    abortSignal?: AbortSignal,
    options?: BlockingPlannerOptions,
  ): Promise<void> {
    const startedAt = Date.now();
    this.logger.log(`[blocking] start package=${packageId}`);
    runLogger.log('BLOCKING', 'Starting package blocking planner', { packageId });

    // Load all (activity, spaceSlot) pairs with their moments
    const assignments = await this.prisma.spaceActivityAssignment.findMany({
      where: { package_activity: { package_id: packageId } },
      include: {
        package_activity: {
          select: {
            id: true,
            name: true,
            moments: { select: { id: true, name: true, order_index: true }, orderBy: { order_index: 'asc' } },
          },
        },
        package_space_slot: { select: { id: true, label: true } },
      },
    });

    if (assignments.length === 0) {
      this.logger.warn(`[blocking] no space/activity assignments for package=${packageId} — skipping`);
      runLogger.warn('BLOCKING', 'No space/activity assignments — skipping blocking planner', { packageId });
      this.emitBlockingSummary({
        packageId,
        progressContext,
        completedMoments: 0,
        failedMoments: 0,
        totalMoments: 0,
        averageAiTimeMs: undefined,
        correctedCameraAssignments: 0,
        warningCount: 0,
      });
      return;
    }

    const totalMoments = assignments.reduce((n, a) => n + a.package_activity.moments.length, 0);
    const isBlueprintPackage = await this.isBlueprintBackedPackage(packageId);
    runLogger.log('BLOCKING', 'Resolved blocking targets', {
      packageId,
      assignments: assignments.length,
      totalMoments,
      isBlueprintPackage,
    });

    if (isBlueprintPackage && !options?.skipPlacementSeed) {
      try {
        const seedResult = await this.placementSeed.seedPackagePlacementsFromBlueprint(packageId, {
          seatLayout: options?.seatLayout ?? CeremonySeatLayoutMode.FLUID,
        });
        runLogger.log('BLOCKING', 'Ensured blueprint placement seed before blocking', {
          packageId,
          ...seedResult,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`[blocking] placement seed failed package=${packageId}: ${message}`);
        runLogger.warn('BLOCKING', 'Blueprint placement seed failed before blocking', {
          packageId,
          error: message,
        });
      }
    }

    let completed = 0;
    let failed = 0;
    let totalAiDurationMs = 0;
    let aiMomentCount = 0;
    let correctedCameraAssignments = 0;
    let totalWarnings = 0;
    let latestTraceLogPath: string | undefined;

    for (const a of assignments) {
      const activityId = a.package_activity.id;
      const activityName = a.package_activity.name;
      const spaceSlotId = a.package_space_slot.id;
      const spaceSlotLabel = a.package_space_slot.label;

      if (!isBlueprintPackage) {
        try {
          const changed = await this.spatialSync.syncCamerasAndSubjects(spaceSlotId, activityId);
          runLogger.log('BLOCKING', 'Seeded floor-plan subjects/cameras for activity (once per assignment)', {
            packageId,
            activityId,
            spaceSlotId,
            changed,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `[blocking] pre-seed failed activity=${activityId} slot=${spaceSlotId}: ${message}`,
          );
          runLogger.warn('BLOCKING', 'Pre-seed of floor-plan subjects/cameras failed', {
            packageId,
            activityId,
            spaceSlotId,
            error: message,
          });
        }
      } else {
        runLogger.log('BLOCKING', 'Skipped per-assignment spatial sync (blueprint placement seed already ran)', {
          packageId,
          activityId,
          spaceSlotId,
        });
      }

      for (const moment of a.package_activity.moments) {
        await this.assertBlockingPlanningContinues(packageId, abortSignal);

        try {
          this.logger.log(
            `[blocking] activity="${activityName}" space="${spaceSlotLabel}" moment="${moment.name}" (pkgMoment=${moment.id})`,
          );
          runLogger.log('BLOCKING', 'Running blocking for moment', {
            packageId,
            activityId,
            activityName,
            spaceSlotId,
            spaceSlotLabel,
            packageMomentId: moment.id,
            momentName: moment.name,
            orderIndex: moment.order_index,
          });

          const blockingResult = await this.blockingDirector.generateBlockingForPackageMoment(
            moment.id,
            spaceSlotId,
            activityId,
            {
              onProgress: (update) => {
                this.progress.emitLiveUpdate({
                  packageId,
                  totalSteps: progressContext.totalSteps,
                  step: 'blocking',
                  label: this.labelForSubstep(moment.name, update.substep),
                  stepIndex: progressContext.stepIndex,
                  activityName,
                  momentId: moment.id,
                  momentName: moment.name,
                  data: {
                    substep: update.substep,
                    spaceName: spaceSlotLabel,
                    completedMoments: completed,
                    totalMoments,
                    failedMoments: failed,
                    llmDurationMs: update.llmDurationMs,
                    queueWaitMs: update.queueWaitMs,
                    cappedCameraCount: update.cappedCameraCount,
                    warningCount: update.warningCount,
                    notices: update.notices,
                  },
                });
              },
            },
          );
          runLogger.log('BLOCKING', 'Attached AI Director package-moment log', {
            packageId,
            activityId,
            packageMomentId: moment.id,
            momentName: moment.name,
            logFilePath: blockingResult.logFilePath,
          });
          runLogger.log('BLOCKING_TRACE', `AI Director trace for package moment ${moment.id} (${moment.name})`, blockingResult.logContent);
          completed++;
          totalAiDurationMs += blockingResult.telemetry.llmDurationMs;
          aiMomentCount += 1;
          correctedCameraAssignments += blockingResult.telemetry.correctedCameraAssignments;
          totalWarnings += blockingResult.telemetry.warningCount;
          latestTraceLogPath = blockingResult.logFilePath;

          this.progress.emitLiveUpdate({
            packageId,
            totalSteps: progressContext.totalSteps,
            step: 'blocking',
            label: `Saved blocking for ${moment.name}`,
            status: 'completed',
            stepIndex: progressContext.stepIndex,
            activityName,
            momentId: moment.id,
            momentName: moment.name,
            data: {
              substep: 'persisted',
              spaceName: spaceSlotLabel,
              completedMoments: completed,
              totalMoments,
              failedMoments: failed,
              llmDurationMs: blockingResult.telemetry.llmDurationMs,
              queueWaitMs: blockingResult.telemetry.queueWaitMs,
              cappedCameraCount: blockingResult.telemetry.cappedCameraCount,
              warningCount: blockingResult.telemetry.warningCount,
              notices: blockingResult.telemetry.notices,
              traceLogPath: blockingResult.logFilePath,
            },
          });
        } catch (err) {
          if (isPlanningCancelledError(err)) {
            throw err;
          }
          failed++;
          const message = err instanceof Error ? err.message : String(err);
          const stack = err instanceof Error ? err.stack : undefined;
          this.logger.error(
            `[blocking] FAILED activity="${activityName}" moment="${moment.name}" (pkgMoment=${moment.id}): ${message}`,
            stack,
          );
          runLogger.error('BLOCKING', 'Blocking failed for moment', {
            packageId,
            activityId,
            packageMomentId: moment.id,
            momentName: moment.name,
            error: message,
            stack,
          });
          this.progress.emitLiveUpdate({
            packageId,
            totalSteps: progressContext.totalSteps,
            step: 'blocking',
            label: `Blocking failed for ${moment.name}`,
            status: 'failed',
            stepIndex: progressContext.stepIndex,
            activityName,
            momentId: moment.id,
            momentName: moment.name,
            error: message,
            data: {
              spaceName: spaceSlotLabel,
              completedMoments: completed,
              totalMoments,
              failedMoments: failed,
              traceLogPath: latestTraceLogPath,
            },
          });
          // Keep going — one moment's failure must not block the rest.
        }
      }
    }

    const elapsedMs = Date.now() - startedAt;
    this.logger.log(
      `[blocking] complete package=${packageId} moments=${completed}/${totalMoments} failed=${failed} elapsed=${elapsedMs}ms`,
    );
    runLogger.log('BLOCKING', 'Package blocking planner finished', {
      packageId,
      completedMoments: completed,
      failedMoments: failed,
      totalMoments,
      elapsedMs,
    });

    this.emitBlockingSummary({
      packageId,
      progressContext,
      completedMoments: completed,
      failedMoments: failed,
      totalMoments,
      averageAiTimeMs: aiMomentCount > 0 ? Math.round(totalAiDurationMs / aiMomentCount) : undefined,
      correctedCameraAssignments,
      warningCount: totalWarnings,
      traceLogPath: latestTraceLogPath,
    });
  }

  private emitBlockingSummary(args: {
    packageId: number;
    progressContext: BlockingProgressContext;
    completedMoments: number;
    failedMoments: number;
    totalMoments: number;
    averageAiTimeMs?: number;
    correctedCameraAssignments: number;
    warningCount: number;
    traceLogPath?: string;
  }): void {
    this.progress.emitLiveUpdate({
      packageId: args.packageId,
      totalSteps: args.progressContext.totalSteps,
      step: 'blocking',
      label: 'Blocking summary',
      status: 'completed',
      stepIndex: args.progressContext.stepIndex,
      data: {
        substep: 'summary',
        completedMoments: args.completedMoments,
        failedMoments: args.failedMoments,
        totalMoments: args.totalMoments,
        averageAiTimeMs: args.averageAiTimeMs,
        correctedCameraAssignments: args.correctedCameraAssignments,
        warningCount: args.warningCount,
        traceLogPath: args.traceLogPath,
      },
    });
  }

  private async isBlueprintBackedPackage(packageId: number): Promise<boolean> {
    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { source_day_blueprint_version_id: true },
    });
    return Boolean(pkg?.source_day_blueprint_version_id);
  }

  private labelForSubstep(momentName: string, substep: string): string {
    switch (substep) {
      case 'llm-request-started':
        return `Generating blocking for ${momentName}`;
      case 'llm-response-received':
        return `LM Studio responded for ${momentName}`;
      case 'parse-complete':
        return `Parsed blocking for ${momentName}`;
      case 'guardrails-applied':
        return `Applied guardrails for ${momentName}`;
      default:
        return `Generating camera blocking for ${momentName}`;
    }
  }
}
