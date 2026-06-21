import { Injectable, Logger } from '@nestjs/common';
import { PlanningStatus } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { PackageCreationRunLogger } from '../../../catalog/packages/creation/run/package-creation-run-logger';
import { ActivityPlanningStatusService } from './activity-planning-status.service';
import { PackagePlanningProgressService } from './package-planning-progress.service';
import { PackagePlanningStepsService } from './package-planning-steps.service';
import { PackageContextService } from './package-context.service';
import { SingleActivityPlannerService } from './single-activity-planner.service';
import {
  PackagePlanningContext,
  PackagePlanningRunOptions,
  PackagePlanningRunResult,
  PackagePlanningSummary,
  PlannerActivityRecord,
} from '../activity-planning.types';
import {
  PLANNING_CANCELLED_BY_USER_MESSAGE,
  assertPlanningNotAborted,
} from '../package-planning-cancel.constants';
import { PackagePlanningCancelRegistryService } from './package-planning-cancel-registry.service';

@Injectable()
export class PackagePlanningOrchestratorService {
  private readonly logger = new Logger(PackagePlanningOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly packageContext: PackageContextService,
    private readonly status: ActivityPlanningStatusService,
    private readonly progress: PackagePlanningProgressService,
    private readonly steps: PackagePlanningStepsService,
    private readonly singleActivityPlanner: SingleActivityPlannerService,
    private readonly planningCancelRegistry: PackagePlanningCancelRegistryService,
  ) {}

  /** AbortSignal (in-process) or POST cancel persistence (`planning_cancel_requested_at`). */
  private async assertPlanningContinues(packageId: number, signal?: AbortSignal): Promise<void> {
    assertPlanningNotAborted(signal);
    await this.status.assertPlanningNotCancelled(packageId);
  }

  async planPackageActivities(
    packageId: number,
    runLogger?: PackageCreationRunLogger,
    options: PackagePlanningRunOptions = {},
  ): Promise<PackagePlanningRunResult> {
    const { deferCompletion = false, additionalSteps = 0, planningMode = 'full', abortSignal: externalAbortSignal } = options;
    /** Pipeline passes a signal; replan / other callers do not — register cancel targets here in that case. */
    const ownsCancelRegistrySession = externalAbortSignal == null;
    const abortSignal = externalAbortSignal ?? this.planningCancelRegistry.attach(packageId);
    const summary = this.progress.createSummary(packageId);
    let totalSteps = additionalSteps;

    try {
      runLogger?.log('PLANNER', 'Planner started', { packageId });
      await this.status.markPlanning(packageId);
      await this.assertPlanningContinues(packageId, abortSignal);

      const context = await this.loadPlanningContext(
        packageId,
        summary,
        deferCompletion,
        totalSteps,
        runLogger,
      );
      if (!context) {
        this.progress.writeSummary(summary, runLogger);
        return {
          packageId,
          totalSteps,
          summary,
          succeeded: true,
          deferredCompletion: deferCompletion,
        };
      }

      await this.assertPlanningContinues(packageId, abortSignal);

      if (planningMode === 'blueprint') {
        totalSteps = 1 + additionalSteps;
        this.progress.recordStep({
          packageId: context.packageId,
          totalSteps,
          summary,
          runLogger,
          step: 'blueprint-content',
          label: 'Using Day Blueprint snapshot content',
          status: 'completed',
          stepIndex: 0,
          data: {
            mode: 'blueprint',
            activityCount: context.activities.length,
          },
        });
      } else {
        totalSteps = 3 + context.activities.length * 3 + additionalSteps;
        await this.runPackageLevelSteps(context, totalSteps, summary, runLogger, abortSignal);
        await this.planActivities(context, totalSteps, summary, runLogger, abortSignal);
      }

      await this.assertPlanningContinues(packageId, abortSignal);

      if (!deferCompletion) {
        await this.status.setStatus(packageId, PlanningStatus.READY);
        this.progress.markReady(summary);
        this.progress.recordStep({
          packageId,
          totalSteps,
          summary,
          runLogger,
          step: 'done',
          label: 'Planning complete',
          status: 'completed',
          stepIndex: totalSteps - 1,
          data: { packageId },
        });
      }
      this.progress.writeSummary(summary, runLogger);
      this.logger.log(`planPackageActivities: completed for package ${packageId}`);
      return {
        packageId,
        totalSteps,
        summary,
        succeeded: true,
        deferredCompletion: deferCompletion,
      };
    } catch (err) {
      const raw = (err as Error).message;
      const message = raw === PLANNING_CANCELLED_BY_USER_MESSAGE ? 'Cancelled by user' : raw;
      this.logger.error(`planPackageActivities: top-level failure for package ${packageId} — ${message}`);
      this.progress.markFailed(summary, message);
      this.progress.writeSummary(summary, runLogger);
      await this.status.setStatus(packageId, PlanningStatus.FAILED, message);
      return {
        packageId,
        totalSteps,
        summary,
        succeeded: false,
        deferredCompletion: deferCompletion,
      };
    } finally {
      if (ownsCancelRegistrySession) {
        this.planningCancelRegistry.detach(packageId);
      }
    }
  }

  private async loadPlanningContext(
    packageId: number,
    summary: PackagePlanningSummary,
    deferCompletion: boolean,
    totalSteps: number,
    runLogger?: PackageCreationRunLogger,
  ): Promise<PackagePlanningContext | null> {
    const activities = await this.prisma.packageActivity.findMany({
      where: { package_id: packageId },
      select: {
        id: true,
        name: true,
        description: true,
        duration_minutes: true,
        package_id: true,
        package_event_day_id: true,
      },
      orderBy: { order_index: 'asc' },
    });

    summary.totalActivities = activities.length;
    if (activities.length === 0) {
      this.logger.log(`planPackageActivities: no activities for package ${packageId}`);
      if (!deferCompletion) {
        await this.status.setStatus(packageId, PlanningStatus.READY);
        this.progress.markReady(summary);
      }
      this.progress.recordStep({
        packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'activities',
        label: 'Load activities',
        status: 'skipped',
        stepIndex: 0,
        error: 'No activities found',
      });
      return null;
    }

    const allSubjects = await this.packageContext.loadPackageSubjects(packageId);
    summary.totalSubjects = allSubjects.length;
    if (allSubjects.length === 0) {
      this.logger.log(`planPackageActivities: no subjects for package ${packageId} — skipping`);
      if (!deferCompletion) {
        await this.status.setStatus(packageId, PlanningStatus.READY);
        this.progress.markReady(summary);
      }
      this.progress.recordStep({
        packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'subjects',
        label: 'Load package subjects',
        status: 'skipped',
        stepIndex: 1,
        error: 'No subjects found',
      });
      return null;
    }

    const pkg = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { event_category: true },
    });

    const eventType = pkg?.event_category ?? 'Wedding';
    const locationContext = await this.packageContext.loadLocationContext(packageId);

    summary.eventType = eventType;
    summary.locationContext = locationContext;

    this.logger.log(
      `planPackageActivities: planning ${activities.length} activities for package ${packageId} (${allSubjects.length} subjects, eventType=${eventType})`,
    );

    runLogger?.log('PLANNER', 'Loaded planner context', {
      packageId,
      eventType,
      activityCount: activities.length,
      subjectCount: allSubjects.length,
      locationContext,
    });

    return {
      packageId,
      activities: activities as PlannerActivityRecord[],
      allSubjects,
      eventType,
      locationContext,
    };
  }

  private async runPackageLevelSteps(
    context: PackagePlanningContext,
    totalSteps: number,
    summary: PackagePlanningSummary,
    runLogger?: PackageCreationRunLogger,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    await this.assertPlanningContinues(context.packageId, abortSignal);
    const descriptionLogger = runLogger?.startSkillLog('01-activity-description', 'Activity Description Enrichment', {
      packageId: context.packageId,
      eventType: context.eventType,
      activityCount: context.activities.length,
    });
    this.progress.recordStep({
      packageId: context.packageId,
      totalSteps,
      summary,
      runLogger,
      step: 'descriptions',
      label: 'Enriching activity descriptions',
      status: 'started',
      stepIndex: 0,
    });
    const descriptionResult = await this.steps.runDescriptionEnrichment(
      context.activities,
      context.allSubjects,
      context.eventType,
      descriptionLogger,
    );
    await this.assertPlanningContinues(context.packageId, abortSignal);
    this.progress.recordStep({
      packageId: context.packageId,
      totalSteps,
      summary,
      runLogger,
      step: 'descriptions',
      label: 'Enriching activity descriptions',
      status: descriptionResult.succeeded ? 'completed' : 'failed',
      stepIndex: 0,
      error: descriptionResult.succeeded ? undefined : 'Description enrichment kept existing values',
      data: {
        updatedActivityCount: descriptionResult.updatedActivityCount,
        metrics: descriptionResult.metrics,
        value: descriptionResult.value,
      },
    });

    const subjectAssignmentLogger = runLogger?.startSkillLog('02-subject-assignment', 'Activity Subject Assignment', {
      packageId: context.packageId,
      eventType: context.eventType,
      activityCount: context.activities.length,
      subjectCount: context.allSubjects.length,
    });
    this.progress.recordStep({
      packageId: context.packageId,
      totalSteps,
      summary,
      runLogger,
      step: 'subjects',
      label: 'Assigning subjects to activities',
      status: 'started',
      stepIndex: 1,
    });
    const subjectResult = await this.steps.runSubjectAssignment(
      context.activities,
      context.allSubjects,
      context.eventType,
      subjectAssignmentLogger,
    );
    await this.assertPlanningContinues(context.packageId, abortSignal);
    this.progress.recordStep({
      packageId: context.packageId,
      totalSteps,
      summary,
      runLogger,
      step: 'subjects',
      label: 'Assigning subjects to activities',
      status: subjectResult.succeeded ? 'completed' : 'failed',
      stepIndex: 1,
      error: subjectResult.succeeded ? undefined : 'Subject assignments left unchanged',
      data: {
        updatedActivityCount: subjectResult.updatedActivityCount,
        insertedAssignmentCount: subjectResult.insertedAssignmentCount,
        metrics: subjectResult.metrics,
        value: subjectResult.value,
      },
    });

    const timingLogger = runLogger?.startSkillLog('03-activity-timing', 'Activity Timing', {
      packageId: context.packageId,
      eventType: context.eventType,
      activityCount: context.activities.length,
    });
    this.progress.recordStep({
      packageId: context.packageId,
      totalSteps,
      summary,
      runLogger,
      step: 'timing',
      label: 'Estimating activity timing',
      status: 'started',
      stepIndex: 2,
    });
    const timingResult = await this.steps.runTimingEstimation(
      context.activities,
      context.allSubjects,
      context.locationContext,
      context.eventType,
      timingLogger,
    );
    await this.assertPlanningContinues(context.packageId, abortSignal);
    this.progress.recordStep({
      packageId: context.packageId,
      totalSteps,
      summary,
      runLogger,
      step: 'timing',
      label: 'Estimating activity timing',
      status: timingResult.succeeded ? 'completed' : 'failed',
      stepIndex: 2,
      error: timingResult.succeeded ? undefined : 'Existing timing values retained',
      data: {
        changedActivityCount: timingResult.changedActivityCount,
        metrics: timingResult.metrics,
        value: timingResult.value,
      },
    });
  }

  private async planActivities(
    context: PackagePlanningContext,
    totalSteps: number,
    summary: PackagePlanningSummary,
    runLogger?: PackageCreationRunLogger,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    for (let index = 0; index < context.activities.length; index += 1) {
      await this.assertPlanningContinues(context.packageId, abortSignal);
      await this.planActivity(context, context.activities[index], index, totalSteps, summary, runLogger, abortSignal);
    }
  }

  private async planActivity(
    context: PackagePlanningContext,
    activity: PlannerActivityRecord,
    index: number,
    totalSteps: number,
    summary: PackagePlanningSummary,
    runLogger?: PackageCreationRunLogger,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const baseIndex = 3 + index * 3;

    try {
      await this.assertPlanningContinues(context.packageId, abortSignal);
      const activityKey = `${activity.id}-${activity.name}`;
      const momentLogger = runLogger?.startSkillLog(
        `04-${activityKey}-moment-generation`,
        `${activity.name} - Moment Generation`,
        { packageId: context.packageId, activityId: activity.id, activityName: activity.name, subjectCount: context.allSubjects.length },
      );

      this.progress.recordStep({
        packageId: context.packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'activity-moments',
        label: `${activity.name} — generating moments`,
        status: 'started',
        stepIndex: baseIndex,
        activityName: activity.name,
      });
      const momentStartedAt = Date.now();
      const planState = await this.singleActivityPlanner.preparePlanContext(activity.id, context.allSubjects, momentLogger);
      const hasActivityMoments = planState.fullMoments.length > 0 && planState.activity != null;

      this.progress.recordStep({
        packageId: context.packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'activity-moments',
        label: `${activity.name} — generating moments`,
        status: hasActivityMoments ? 'completed' : 'skipped',
        stepIndex: baseIndex,
        activityName: activity.name,
        error: hasActivityMoments ? undefined : 'No moments available for activity',
        data: {
          activityId: activity.id,
          momentCount: planState.fullMoments.length,
          momentSource: planState.momentSource,
          templateUsed: planState.templateUsed ?? undefined,
          metrics: {
            durationMs: Date.now() - momentStartedAt,
            llmCallCount: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            promptChars: 0,
            responseChars: 0,
          },
          value: {
            candidateCount: 1,
            changedCount: planState.momentSource === 'existing' || planState.fullMoments.length === 0 ? 0 : 1,
            changeRate: planState.momentSource === 'existing' || planState.fullMoments.length === 0 ? 0 : 1,
            valueScore: planState.momentSource === 'existing' || planState.fullMoments.length === 0 ? 'none' : 'high',
          },
        },
      });

      if (!hasActivityMoments || !planState.activity) {
        this.progress.recordStep({
          packageId: context.packageId,
          totalSteps,
          summary,
          runLogger,
          step: 'activity-casting',
          label: `${activity.name} — casting subjects`,
          status: 'skipped',
          stepIndex: baseIndex + 1,
          activityName: activity.name,
          error: 'No moments available',
        });
        this.progress.recordStep({
          packageId: context.packageId,
          totalSteps,
          summary,
          runLogger,
          step: 'activity-actions',
          label: `${activity.name} — planning actions`,
          status: 'skipped',
          stepIndex: baseIndex + 2,
          activityName: activity.name,
          error: 'No moments available',
        });
        return;
      }

      await this.assertPlanningContinues(context.packageId, abortSignal);

      const castingLogger = runLogger?.startSkillLog(
        `05-${activityKey}-activity-casting`,
        `${activity.name} - Activity Casting`,
        {
          packageId: context.packageId,
          activityId: activity.id,
          activityName: activity.name,
          momentCount: planState.fullMoments.length,
          subjectCount: planState.subjects.length,
        },
      );
      this.progress.recordStep({
        packageId: context.packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'activity-casting',
        label: `${activity.name} — casting subjects`,
        status: 'started',
        stepIndex: baseIndex + 1,
        activityName: activity.name,
      });
      const { presenceMaps, focalMaps, succeeded: castingSucceeded, metrics: castingMetrics, value: castingValue } = await this.singleActivityPlanner.planCasting(
        planState.activity,
        planState.fullMoments,
        planState.subjects,
        castingLogger,
        ({ momentId, momentName, subjectIds, subjectNames }) => {
          this.progress.emitLiveUpdate({
            packageId: context.packageId,
            totalSteps,
            step: 'activity-casting',
            label: `${activity.name} — deciding subjects for ${momentName}`,
            stepIndex: baseIndex + 1,
            activityName: activity.name,
            momentId,
            momentName,
            subjectIds,
            subjectNames,
          });
        },
      );
      this.progress.recordStep({
        packageId: context.packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'activity-casting',
        label: `${activity.name} — casting subjects`,
        status: castingSucceeded ? 'completed' : 'failed',
        stepIndex: baseIndex + 1,
        activityName: activity.name,
        error: castingSucceeded ? undefined : 'Used fallback presence maps',
        data: {
          activityId: activity.id,
          momentCount: planState.fullMoments.length,
          subjectCount: planState.subjects.length,
          metrics: castingMetrics,
          value: castingValue,
        },
      });

      await this.assertPlanningContinues(context.packageId, abortSignal);

      const actionsLogger = runLogger?.startSkillLog(
        `06-${activityKey}-activity-actions`,
        `${activity.name} - Activity Actions`,
        {
          packageId: context.packageId,
          activityId: activity.id,
          activityName: activity.name,
          momentCount: planState.fullMoments.length,
          subjectCount: planState.subjects.length,
        },
      );
      this.progress.recordStep({
        packageId: context.packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'activity-actions',
        label: `${activity.name} — planning actions`,
        status: 'started',
        stepIndex: baseIndex + 2,
        activityName: activity.name,
      });
      const actionsResult = await this.singleActivityPlanner.planActions(
        planState.activity,
        planState.fullMoments,
        planState.subjects,
        presenceMaps,
        focalMaps,
        actionsLogger,
        ({ momentId, momentName, subjectIds, subjectNames }) => {
          this.progress.emitLiveUpdate({
            packageId: context.packageId,
            totalSteps,
            step: 'activity-actions',
            label: `${activity.name} — writing actions for ${momentName}`,
            stepIndex: baseIndex + 2,
            activityName: activity.name,
            momentId,
            momentName,
            subjectIds,
            subjectNames,
          });
        },
      );
      this.progress.recordStep({
        packageId: context.packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'activity-actions',
        label: `${activity.name} — planning actions`,
        status: actionsResult.succeeded ? 'completed' : 'failed',
        stepIndex: baseIndex + 2,
        activityName: activity.name,
        error: actionsResult.succeeded ? undefined : 'Persisted fallback subject actions',
        data: {
          activityId: activity.id,
          persistedMomentCount: planState.fullMoments.length,
          metrics: actionsResult.metrics,
          value: actionsResult.value,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message === PLANNING_CANCELLED_BY_USER_MESSAGE) {
        throw err;
      }
      const message = (err as Error).message;
      this.logger.warn(`planPackageActivities: failed for activity ${activity.id} "${activity.name}" — ${message}`);
      summary.errors.push(`Activity ${activity.id} (${activity.name}): ${message}`);
      this.progress.recordStep({
        packageId: context.packageId,
        totalSteps,
        summary,
        runLogger,
        step: 'activity',
        label: `Planning ${activity.name}`,
        status: 'failed',
        stepIndex: baseIndex,
        activityName: activity.name,
        error: message,
        data: { activityId: activity.id },
      });
    }
  }
}