import { Injectable } from '@nestjs/common';
import { PlanningStatus } from '@prisma/client';
import { PackageCreationRunLogger } from '../../../catalog/packages/creation/run/package-creation-run-logger';
import {
  PackagePlanningRunOptions,
  PackagePlanningRunResult,
  PlannerSubject,
  SingleActivityPlanResult,
} from '../activity-planning.types';
import { ActivityPlanningStatusService } from './activity-planning-status.service';
import { ActivityPlanningMaintenanceService } from './activity-planning-maintenance.service';
import { PackagePlanningProgressService } from './package-planning-progress.service';
import { PackagePlanningOrchestratorService } from './package-planning-orchestrator.service';
import { SingleActivityPlannerService } from './single-activity-planner.service';

/**
 * Activity planner — runs at package creation time (fire-and-forget).
 *
 * Pipeline (no film/scene required):
 *   0. Set planning_status = PLANNING
 *   0.5. AI Description Enrichment — fill empty activity descriptions
 *   1. AI Subject Assignment — which subjects attend each activity
 *   2. AI Duration/Timing — realistic durations + suggested start times
 *   3. Ensure moments from knowledge base (or AI generation fallback)
 *   4. AI Casting + Focal Priority — who is present + focal rank per moment
 *   5. AI Actions — narrative action descriptions per subject
 *   6. Persist subject_actions (with focal data) to PackageActivityMoment
 *   7. Set planning_status = READY
 *
 * Phase 2 (spatial/director/ControlNet) runs later when a film scene is linked.
 */
@Injectable()
export class ActivityPlannerService {
  constructor(
    private readonly packagePlanningOrchestrator: PackagePlanningOrchestratorService,
    private readonly activityPlanningMaintenance: ActivityPlanningMaintenanceService,
    private readonly singleActivityPlanner: SingleActivityPlannerService,
    private readonly status: ActivityPlanningStatusService,
    private readonly progress: PackagePlanningProgressService,
  ) {}

  /**
   * Plan all activities in a package: assign subjects → estimate timing → moments + casting + actions.
   * Fire-and-forget safe — errors are logged but never thrown.
   */
  async planPackageActivities(
    packageId: number,
    runLogger?: PackageCreationRunLogger,
    options: PackagePlanningRunOptions = {},
  ): Promise<PackagePlanningRunResult> {
    return this.packagePlanningOrchestrator.planPackageActivities(packageId, runLogger, options);
  }

  startDeferredPackageBlocking(
    run: PackagePlanningRunResult,
    runLogger?: PackageCreationRunLogger,
  ): void {
    if (!run.succeeded || !run.deferredCompletion) return;

    this.progress.recordStep({
      packageId: run.packageId,
      totalSteps: this.getDeferredTotalSteps(run),
      summary: run.summary,
      runLogger,
      step: 'blocking',
      label: 'Generating camera blocking',
      status: 'started',
      stepIndex: this.getDeferredTotalSteps(run) - 1,
    });
  }

  async completeDeferredPackagePlanning(
    run: PackagePlanningRunResult,
    runLogger?: PackageCreationRunLogger,
  ): Promise<void> {
    if (!run.succeeded || !run.deferredCompletion || run.summary.finalStatus === PlanningStatus.FAILED) {
      return;
    }

    const totalSteps = this.getDeferredTotalSteps(run);
    this.progress.recordStep({
      packageId: run.packageId,
      totalSteps,
      summary: run.summary,
      runLogger,
      step: 'blocking',
      label: 'Generating camera blocking',
      status: 'completed',
      stepIndex: totalSteps - 1,
    });
    await this.status.setStatus(run.packageId, PlanningStatus.READY);
    this.progress.markReady(run.summary);
    this.progress.recordStep({
      packageId: run.packageId,
      totalSteps,
      summary: run.summary,
      runLogger,
      step: 'done',
      label: 'Planning complete',
      status: 'completed',
      stepIndex: totalSteps - 1,
    });
    this.progress.writeSummary(run.summary, runLogger);
  }

  async failDeferredPackagePlanning(
    run: PackagePlanningRunResult,
    error: string,
    runLogger?: PackageCreationRunLogger,
  ): Promise<void> {
    if (!run.deferredCompletion || run.summary.finalStatus === PlanningStatus.FAILED) {
      return;
    }

    this.progress.markFailed(run.summary, error);
    this.progress.writeSummary(run.summary, runLogger);
    await this.status.setStatus(run.packageId, PlanningStatus.FAILED, error);
  }

  /**
   * Replan a package: clears existing AI data and re-runs the full pipeline.
   */
  async replanPackageActivities(packageId: number): Promise<void> {
    await this.activityPlanningMaintenance.replanPackageActivities(packageId);
  }

  /**
   * Resync scheduled scenes: for each film scene linked to this package's
   * activities, re-copy moments and actions from PackageActivityMoment.
   * Returns the scene IDs that were resynced.
   */
  async resyncScheduledScenes(packageId: number): Promise<number[]> {
    return this.activityPlanningMaintenance.resyncScheduledScenes(packageId);
  }

  /**
   * Plan a single activity: ensure moments → casting + focal → actions → persist.
   */
  async planSingleActivity(
    activityId: number,
    subjects?: PlannerSubject[],
  ): Promise<SingleActivityPlanResult> {
    return this.singleActivityPlanner.planActivity(activityId, subjects ?? []);
  }

  private getDeferredTotalSteps(run: PackagePlanningRunResult): number {
    return Math.max(run.totalSteps, 1);
  }
}
